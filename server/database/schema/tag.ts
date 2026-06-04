import type { z } from 'zod'
import { relations } from 'drizzle-orm'
import {
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
})

export const InsertTag = createInsertSchema(tag).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type InsertTag = z.infer<typeof InsertTag>

export const tagRelations = relations(tag, ({ many }) => ({
  signals: many(signalTag),
}))
