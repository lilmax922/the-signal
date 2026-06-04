import { z } from 'zod'
import { FEED_PAGE_SIZE, FEED_PAGE_SIZE_MAX } from '../constants/limits'

// ─── Shared primitives ────────────────────────────────────────────────────────

export const categorySchema = z.enum(['finance', 'tech', 'world'])

export type Category = z.infer<typeof categorySchema>

// LLM contract: every signal ships with exactly 3 summary points (both languages).
// Used by `signalSchema` (API response) and reused internally for consistency.
const summarySchema = z.array(z.string().min(1)).length(3)

// Embedded tag shape used inside signal responses. Mirrors the `tag` table minus
// the server-managed timestamps.
const signalTagSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
})

// ─── Signal response shapes ───────────────────────────────────────────────────

// Full signal — returned by `GET /api/signals/[slug]`. Excludes internal fields
// (`guid`, `pipelineRunId`, `createdAt`, `updatedAt`) that are never sent to clients.
export const signalSchema = z.object({
  id: z.uuid(),
  slug: z.string().min(1),
  category: categorySchema,
  titleEn: z.string().min(1),
  titleZh: z.string().min(1),
  contentEn: z.string().min(1),
  contentZh: z.string().min(1),
  summaryEn: summarySchema,
  summaryZh: summarySchema,
  imageUrl: z.url().nullable(),
  sourceUrl: z.url(),
  publishedAt: z.iso.datetime(),
  tags: z.array(signalTagSchema).max(3),
})

export type Signal = z.infer<typeof signalSchema>

// Lightweight feed card — returned inside the `GET /api/signals` envelope.
// Derived from `signalSchema` via `.omit()` so the field set is not duplicated:
// if a field is added to `signalSchema`, the feed shape picks it up automatically
// and only the `omit` list needs to be reviewed.
export const signalFeedSchema = signalSchema.omit({
  contentEn: true,
  contentZh: true,
  summaryEn: true,
  sourceUrl: true,
})

export type SignalFeed = z.infer<typeof signalFeedSchema>

// ─── Feed list envelope + request query ───────────────────────────────────────

export const feedResponseSchema = z.object({
  items: z.array(signalFeedSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
})

export type FeedResponse = z.infer<typeof feedResponseSchema>

export const signalQuerySchema = z.object({
  category: categorySchema.optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(FEED_PAGE_SIZE_MAX).default(FEED_PAGE_SIZE),
})

export type SignalQuery = z.infer<typeof signalQuerySchema>
