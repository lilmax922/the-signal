import type { z } from 'zod'
import { relations, sql } from 'drizzle-orm'
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { signalTag } from './signal-tag'

const categoryEnum = pgEnum('category', ['finance', 'tech', 'world'])

export const signal = pgTable('signal', {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  guid: text().notNull().unique(),
  category: categoryEnum().notNull(),
  titleEn: text().notNull(),
  titleZh: text().notNull(),
  contentEn: text().notNull(),
  contentZh: text().notNull(),
  summaryEn: text().array().notNull(),
  summaryZh: text().array().notNull(),
  imageUrl: text(),
  sourceUrl: text().notNull(),
  publishedAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  pipelineRunId: text(),
}, t => [
  // Legacy: retained for non-cursor category-only queries (admin views, back-office tasks)
  index('idx_signal_category_published').on(t.category, t.publishedAt.desc()),

  // Cursor pagination: composite anchor for `WHERE (published_at, id) < (?, ?)` lookups
  index('idx_signal_published_at_id').on(t.publishedAt.desc(), t.id.desc()),

  // Per-category partial indexes: filtered feed queries hit these instead of the full composite
  index('idx_signal_finance_published_at_id').on(t.publishedAt.desc(), t.id.desc()).where(sql`${t.category} = 'finance'`),
  index('idx_signal_tech_published_at_id').on(t.publishedAt.desc(), t.id.desc()).where(sql`${t.category} = 'tech'`),
  index('idx_signal_world_published_at_id').on(t.publishedAt.desc(), t.id.desc()).where(sql`${t.category} = 'world'`),

  // GIN trigram indexes for ILIKE search across title columns
  index('idx_signal_title_zh_trgm').using('gin', sql`${t.titleZh} gin_trgm_ops`),
  index('idx_signal_title_en_trgm').using('gin', sql`${t.titleEn} gin_trgm_ops`),
])

export const InsertSignal = createInsertSchema(signal, {
  summaryEn: schema => schema.length(3),
  summaryZh: schema => schema.length(3),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type InsertSignal = z.infer<typeof InsertSignal>

export const signalRelations = relations(signal, ({ many }) => ({
  tags: many(signalTag),
}))
