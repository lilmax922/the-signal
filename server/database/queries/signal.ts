import type { Category, FeedResponse } from '#shared/validators/signal'
import type { DbClient } from '../index'
import type { InsertSignal as InsertSignalType } from '../schema'
import { Buffer } from 'node:buffer'
import { and, eq, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { feedResponseSchema } from '#shared/validators/signal'
import { db } from '../index'
import { InsertSignal, signal } from '../schema'

export async function findSignalByGuid(guid: string) {
  return db.query.signal.findFirst({
    columns: { id: true },
    where: eq(signal.guid, guid),
  })
}

export async function insertSignal(
  insertable: InsertSignalType,
  client: DbClient = db,
) {
  const parsed = InsertSignal.safeParse(insertable)
  if (!parsed.success) {
    throw new Error(`insertSignal: invalid payload — ${parsed.error.message}`)
  }

  const [inserted] = await client.insert(signal).values(parsed.data).returning()
  if (!inserted) {
    throw new Error('insertSignal: no row returned')
  }
  return inserted
}

// ─── Feed + Detail query helpers ─────────────────────────────────────────────

// Cursor wire format: `base64({publishedAt-iso}|{id-uuid})`. The cursor is
// decoded once at the API boundary, never stored in the DB.
const cursorSchema = z.object({
  publishedAt: z.iso.datetime(),
  id: z.string().uuid(),
})

function encodeCursor(row: { publishedAt: Date, id: string }): string {
  return Buffer.from(`${row.publishedAt.toISOString()}|${row.id}`).toString('base64')
}

function decodeCursor(cursor: string): { publishedAt: Date, id: string } {
  const raw = Buffer.from(cursor, 'base64').toString('utf-8')
  const parts = raw.split('|')
  if (parts.length !== 2) {
    throw new Error('findSignals: malformed cursor')
  }
  const [publishedAt, id] = parts as [string, string]
  const parsed = cursorSchema.safeParse({ publishedAt, id })
  if (!parsed.success) {
    throw new Error(`findSignals: malformed cursor — ${parsed.error.message}`)
  }
  return { publishedAt: new Date(parsed.data.publishedAt), id: parsed.data.id }
}

// Flatten a relational-query result into the lightweight `{ id, name }` tag
// shape used by `signalFeedSchema` / `signalSchema`, sorted by `name` to keep
// the response stable across requests.
function toTags(rows: Array<{ tag: { id: string, name: string } }>) {
  return rows
    .map(r => r.tag)
    .sort((a, b) => a.name.localeCompare(b.name))
}

// Cursor-paginated feed query. Fetches `limit + 1` rows so `hasMore` can be
// derived without a second `COUNT(*)`. The `category` filter (when present)
// hits the per-category partial index; the cursor anchor uses the row-tuple
// comparison `WHERE (published_at, id) < (?, ?)` that the composite index
// `idx_signal_published_at_id` supports.
export async function findSignals(args: {
  category?: Category
  cursor?: string
  limit: number
}): Promise<FeedResponse> {
  const cursorRow = args.cursor ? decodeCursor(args.cursor) : null

  // Row-tuple cursor anchor — `or(...)` collapses to a single predicate so
  // Postgres can use the composite index in one seek.
  const cursorPredicate = cursorRow
    ? or(
        sql`${signal.publishedAt} < ${cursorRow.publishedAt}`,
        and(
          sql`${signal.publishedAt} = ${cursorRow.publishedAt}`,
          sql`${signal.id} < ${cursorRow.id}`,
        ),
      )
    : undefined

  const wherePredicate = and(
    cursorPredicate,
    args.category ? eq(signal.category, args.category) : undefined,
  )

  const rows = await db.query.signal.findMany({
    where: wherePredicate,
    with: {
      tags: {
        with: { tag: true },
      },
    },
    orderBy: (s, { desc }) => [desc(s.publishedAt), desc(s.id)],
    limit: args.limit + 1,
  })

  const hasMore = rows.length > args.limit
  const page = hasMore ? rows.slice(0, args.limit) : rows
  const last = page[page.length - 1]

  const response: FeedResponse = {
    items: page.map(r => ({
      id: r.id,
      slug: r.slug,
      category: r.category,
      titleEn: r.titleEn,
      titleZh: r.titleZh,
      summaryZh: r.summaryZh,
      imageUrl: r.imageUrl,
      publishedAt: r.publishedAt.toISOString(),
      tags: toTags(r.tags),
    })),
    nextCursor: hasMore && last ? encodeCursor(last) : null,
    hasMore,
  }

  const parsed = feedResponseSchema.safeParse(response)
  if (!parsed.success) {
    throw new Error(`findSignals: response drifted from contract — ${parsed.error.message}`)
  }
  return parsed.data
}

// Single-signal detail query. Returns the full bilingual signal with its tags,
// or `null` when no row matches — the route handler decides between 200 and 404.
export async function findSignalBySlug(slug: string) {
  const row = await db.query.signal.findFirst({
    where: eq(signal.slug, slug),
    with: {
      tags: {
        with: { tag: true },
      },
    },
  })
  if (!row)
    return null

  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    titleEn: row.titleEn,
    titleZh: row.titleZh,
    contentEn: row.contentEn,
    contentZh: row.contentZh,
    summaryEn: row.summaryEn,
    summaryZh: row.summaryZh,
    imageUrl: row.imageUrl,
    sourceUrl: row.sourceUrl,
    publishedAt: row.publishedAt.toISOString(),
    tags: toTags(row.tags),
  }
}
