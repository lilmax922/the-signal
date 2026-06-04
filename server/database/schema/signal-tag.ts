import type { z } from 'zod'
import { relations } from 'drizzle-orm'
import {
  index,
  pgTable,
  primaryKey,
  uuid,
} from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { signal } from './signal'
import { tag } from './tag'

export const signalTag = pgTable('signal_tag', {
  signalId: uuid().notNull().references(() => signal.id, { onDelete: 'cascade' }),
  tagId: uuid().notNull().references(() => tag.id, { onDelete: 'cascade' }),
}, t => [
  index('idx_signal_tag_signal_id').on(t.signalId),
  index('idx_signal_tag_tag_id').on(t.tagId),
  primaryKey({ columns: [t.signalId, t.tagId] }),
])

export const InsertSignalTag = createInsertSchema(signalTag)

export type InsertSignalTag = z.infer<typeof InsertSignalTag>

export const signalTagRelations = relations(signalTag, ({ one }) => ({
  signal: one(signal, {
    fields: [signalTag.signalId],
    references: [signal.id],
  }),
  tag: one(tag, {
    fields: [signalTag.tagId],
    references: [tag.id],
  }),
}))
