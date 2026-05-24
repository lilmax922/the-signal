import {
  index,
  pgTable,
  primaryKey,
  uuid,
} from 'drizzle-orm/pg-core'
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
