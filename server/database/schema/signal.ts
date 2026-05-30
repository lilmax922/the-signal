import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const categoryEnum = pgEnum('category', ['finance', 'tech', 'world'])

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
  imageAlt: text(),
  sourceUrl: text().notNull(),
  publishedAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  pipelineRunId: text(),
}, t => [
  index('idx_signal_category_published').on(t.category, t.publishedAt.desc()),
  index('idx_signal_published_at').on(t.publishedAt.desc()),
])
