import type { DbClient } from '../../server/database'
import { and, asc, count, eq, gte, inArray, isNotNull, lt, notExists, sql } from 'drizzle-orm'
import { signal } from '../../server/database/schema'
import { signalTag } from '../../server/database/schema/signal-tag'
import { tag } from '../../server/database/schema/tag'

// Retention window for the `signal` table (context/database-schema.md
// "Data Retention"). The cutoff is always evaluated server-side as
// `NOW() - INTERVAL '3 months'` at each statement — no JS clock skew leaks
// into the delete boundary. Per-statement re-evaluation can only move the
// boundary later as the run progresses, which errs toward under-delete (a
// boundary row waits for next month), never over-delete.
export const PURGE_RETENTION_MONTHS = 3

// Rows deleted per statement. Keeps each DELETE small and yields per-batch
// counts for the run log.
export const PURGE_BATCH_SIZE_DEFAULT = 500

// Server-side cutoff fragment — the documented retention predicate, verbatim.
// Keep the '3 months' literal in sync with PURGE_RETENTION_MONTHS above.
// A fresh fragment per call: the same object must not be shared across queries.
export function purgeCutoffSql() {
  return sql`NOW() - INTERVAL '3 months'`
}

// `signal.image_url` is a Supabase public URL for the mirrored file:
//   {SUPABASE_URL}/storage/v1/object/public/{bucket}/{key}
// (the render path /storage/v1/render/image/public/… is accepted too).
// Returns null for null/relative/malformed URLs — the caller skips those files
// (counted as skipped, never deleted blind). NULL image_url means no mirror
// was ever uploaded (ingest soft-fail), so there is no file and no skip.
export function storageObjectFromImageUrl(imageUrl: string | null): { bucket: string, key: string } | null {
  if (!imageUrl)
    return null
  let pathname: string
  try {
    pathname = new URL(imageUrl).pathname
  }
  catch {
    return null
  }
  const match = pathname.match(/\/storage\/v1\/(?:object|render\/image)\/public\/([^/]+)\/(.+)/)
  if (!match || !match[1] || !match[2])
    return null
  return { bucket: match[1], key: match[2] }
}

export type ExpiredSignal = {
  id: string
  imageUrl: string | null
}

// Narrow storage seam: the Trigger.dev task binds the Supabase client;
// verification scripts bind a fake. Throws on failure so a mid-run Storage
// outage aborts before any DB row is deleted (Trigger.dev retries the run).
export type PurgeStorage = {
  removeObjects: (bucket: string, keys: string[]) => Promise<void>
}

// Narrow seam between the purge orchestration (`runPurge`) and the outside
// world. The Trigger.dev task binds the Drizzle + Supabase implementation
// (`createDrizzlePurgeDeps`); verification scripts bind an in-memory fake —
// no DB, Storage, or Trigger runtime needed.
export type PurgeDeps = {
  // Oldest batch first. `offset` pages a stable snapshot for dry-run counting;
  // real deletes always read from the start (offset 0) because deleted rows
  // vacate the window. Order by (published_at, id) so paging is stable under
  // timestamp ties.
  listExpiredSignals: (limit: number, offset?: number) => Promise<ExpiredSignal[]>
  countSignalTags: (signalIds: string[]) => Promise<number>
  deleteSignals: (signalIds: string[]) => Promise<number>
  countWouldBeOrphanTags: () => Promise<number>
  deleteOrphanTags: () => Promise<number>
  // Storage keys still referenced by unexpired signals — candidates pointing
  // at these are excluded from deletion so a shared file is never removed
  // while a surviving signal still points at it.
  listSurvivingImageKeys: () => Promise<Array<{ bucket: string, key: string }>>
  deleteImageObjects: (bucket: string, keys: string[]) => Promise<number>
}

export type PurgeBatchInfo = {
  batchIndex: number
  signals: number
  signalTags: number
  images: number
  imagesSkipped: number
}

export type PurgeOptions = {
  dryRun: boolean
  batchSize?: number
  onBatch?: (info: PurgeBatchInfo) => void | Promise<void>
}

export type PurgeResult = {
  dryRun: boolean
  batches: number
  signals: number
  signalTags: number
  tags: number
  images: number
  imagesSkipped: number
}

// Batched purge per signal batch (oldest first): Storage mirrors, then signal
// rows, with junction counts alongside. Orphaned tags are cleaned once, after
// all signal batches. In dry-run mode every counter is populated but no DELETE
// (DB or Storage) is issued.
export async function runPurge(deps: PurgeDeps, options: PurgeOptions): Promise<PurgeResult> {
  const batchSize = options.batchSize ?? PURGE_BATCH_SIZE_DEFAULT
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error(`runPurge: batchSize must be a positive integer, got ${batchSize}`)
  }

  const surviving = new Set(
    (await deps.listSurvivingImageKeys()).map(obj => `${obj.bucket}/${obj.key}`),
  )
  // Keys already handled earlier in this run (same file referenced by two
  // expired rows — impossible with UUID filenames, but free to guard).
  const seenImages = new Set<string>()

  let batches = 0
  let signals = 0
  let signalTags = 0
  let images = 0
  let imagesSkipped = 0

  // Dry-run issues SELECTs only, so nothing vacates the window — page forward
  // with an offset. (Assumes no concurrent insert of back-dated rows mid-run;
  // the refinery only inserts freshly published signals, so the expired set is
  // effectively frozen while a run executes.)
  let offset = 0
  for (;;) {
    const rows = await deps.listExpiredSignals(batchSize, options.dryRun ? offset : 0)
    if (rows.length === 0)
      break
    if (options.dryRun)
      offset += rows.length

    const ids = rows.map(row => row.id)
    const linkedTags = await deps.countSignalTags(ids)

    // Storage candidates for this batch: parsed keys, deduped, minus files
    // still referenced by surviving signals.
    const candidates = new Map<string, { bucket: string, key: string }>()
    let skipped = 0
    for (const row of rows) {
      if (!row.imageUrl)
        continue
      const obj = storageObjectFromImageUrl(row.imageUrl)
      if (!obj) {
        skipped += 1
        continue
      }
      const ref = `${obj.bucket}/${obj.key}`
      if (!surviving.has(ref) && !seenImages.has(ref)) {
        candidates.set(ref, obj)
        seenImages.add(ref)
      }
    }
    const byBucket = new Map<string, string[]>()
    for (const obj of candidates.values()) {
      const keys = byBucket.get(obj.bucket) ?? []
      keys.push(obj.key)
      byBucket.set(obj.bucket, keys)
    }

    let batchImages = 0
    if (options.dryRun) {
      batchImages = candidates.size
    }
    else {
      // Storage-first: mirror files go before their rows, so a mid-batch
      // Storage failure aborts the run with the DB untouched (and retried by
      // Trigger.dev). Deleting rows first would strand orphan files that no
      // later run can rediscover, because the keys live only on the rows.
      for (const [bucket, keys] of byBucket) {
        batchImages += await deps.deleteImageObjects(bucket, keys)
      }
    }

    let affected: number
    if (options.dryRun) {
      affected = ids.length
    }
    else {
      // signal_tag rows cascade via ON DELETE CASCADE — the pre-delete count is
      // exact for this batch because this job is the only writer that deletes
      // signals.
      affected = await deps.deleteSignals(ids)
    }
    signals += affected
    signalTags += linkedTags
    images += batchImages
    imagesSkipped += skipped

    batches += 1
    await options.onBatch?.({ batchIndex: batches, signals: affected, signalTags: linkedTags, images: batchImages, imagesSkipped: skipped })
  }

  const tags = options.dryRun
    ? await deps.countWouldBeOrphanTags()
    : await deps.deleteOrphanTags()

  return { dryRun: options.dryRun, batches, signals, signalTags, tags, images, imagesSkipped }
}

// Drizzle + Supabase-backed `PurgeDeps`. Accepts the shared `DbClient` union so
// the same implementation runs against the live client or inside a transaction.
export function createDrizzlePurgeDeps(client: DbClient, storage: PurgeStorage): PurgeDeps {
  return {
    async listExpiredSignals(limit: number, offset = 0) {
      return client
        .select({ id: signal.id, imageUrl: signal.imageUrl })
        .from(signal)
        .where(lt(signal.publishedAt, purgeCutoffSql()))
        .orderBy(asc(signal.publishedAt), asc(signal.id))
        .limit(limit)
        .offset(offset)
    },

    async countSignalTags(signalIds: string[]) {
      const [row] = await client
        .select({ value: count() })
        .from(signalTag)
        .where(inArray(signalTag.signalId, signalIds))
      return row?.value ?? 0
    },

    async deleteSignals(signalIds: string[]) {
      const deleted = await client
        .delete(signal)
        .where(inArray(signal.id, signalIds))
        .returning({ id: signal.id })
      return deleted.length
    },

    // Dry-run: tags whose references all point at expired signals — exactly the
    // set the real cleanup below would remove, plus any pre-existing orphans.
    async countWouldBeOrphanTags() {
      const [row] = await client
        .select({ value: count() })
        .from(tag)
        .where(notExists(
          client
            .select()
            .from(signalTag)
            .innerJoin(signal, eq(signal.id, signalTag.signalId))
            .where(and(
              eq(signalTag.tagId, tag.id),
              gte(signal.publishedAt, purgeCutoffSql()),
            )),
        ))
      return row?.value ?? 0
    },

    // Tags are only ever created alongside a signal in the refinery pipeline,
    // so a tag with zero references after the signal deletes is an orphan by
    // construction.
    async deleteOrphanTags() {
      const deleted = await client
        .delete(tag)
        .where(notExists(
          client
            .select()
            .from(signalTag)
            .where(eq(signalTag.tagId, tag.id)),
        ))
        .returning({ id: tag.id })
      return deleted.length
    },

    async listSurvivingImageKeys() {
      const rows = await client
        .selectDistinct({ imageUrl: signal.imageUrl })
        .from(signal)
        .where(and(
          gte(signal.publishedAt, purgeCutoffSql()),
          isNotNull(signal.imageUrl),
        ))
      const keys: Array<{ bucket: string, key: string }> = []
      for (const row of rows) {
        const obj = storageObjectFromImageUrl(row.imageUrl)
        if (obj)
          keys.push(obj)
      }
      return keys
    },

    async deleteImageObjects(bucket: string, keys: string[]) {
      if (keys.length === 0)
        return 0
      await storage.removeObjects(bucket, keys)
      return keys.length
    },
  }
}
