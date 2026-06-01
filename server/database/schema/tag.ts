import type { z } from 'zod'
import {
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

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
