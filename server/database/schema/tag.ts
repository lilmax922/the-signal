import type { z } from 'zod'
import { relations, sql } from 'drizzle-orm'
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { signalTag } from './signal-tag'

export const tag = pgTable('tag', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull().unique(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, t => [
  // GIN trigram index for ILIKE search on tag names
  index('idx_tag_name_trgm').using('gin', sql`${t.name} gin_trgm_ops`),
])

export const InsertTag = createInsertSchema(tag).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type InsertTag = z.infer<typeof InsertTag>

export const tagRelations = relations(tag, ({ many }) => ({
  signals: many(signalTag),
}))
