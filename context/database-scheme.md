# Database Schema

## Overview

All tables are in Supabase (PostgreSQL), managed via Drizzle ORM. Row Level Security (RLS) is **disabled** — access control is enforced entirely in the Nitro server layer.

No custom user or profile table exists. User identity is managed exclusively by Supabase Auth (`auth.users`). `@nuxtjs/supabase` provides `user.user_metadata.avatar_url` and `user.user_metadata.full_name` directly from the OAuth provider, so no mirror table is needed.

**Naming conventions**
- Table names: singular (`signal`, not `signals`)
- Column names: `snake_case`
- Drizzle schema variables / TypeScript types: `camelCase`
- Files and folders: `kebab-case`

---

## Tables

### `signal`

The core content table. Each row is one fully-processed Signal Card.

| Column            | Type          | Constraints                                     | Description                                                            |
| ----------------- | ------------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| `id`              | `uuid`        | PK, default `gen_random_uuid()`                 | Unique signal identifier.                                              |
| `fact_hash`       | `text`        | UNIQUE, NOT NULL                                | SHA-256 of (`source_url` + `title_en`). Deduplication key.            |
| `category`        | `text`        | NOT NULL, CHECK IN (`tech`, `world`, `science`) | Derived from the source RSS feed path.                                 |
| `title_en`        | `text`        | NOT NULL                                        | Original English headline from RSS metadata.                           |
| `title_zh`        | `text`        | NOT NULL                                        | De-noised Traditional Chinese headline.                                |
| `content_en`      | `text`        | NOT NULL                                        | De-noised English body. Retained for potential re-processing.          |
| `content_zh`      | `text`        | NOT NULL                                        | Translated Traditional Chinese body. Rendered in the UI.               |
| `summary_zh`      | `text[]`      | NOT NULL                                        | Exactly 3 Traditional Chinese bullet-point summary items.              |
| `image_url`   | `text`        | nullable                                        | Supabase Storage public URL for the mirrored image.            |
| `image_alt`   | `text`        | nullable                                        | Alt text for the preview image.                                        |
| `source_url`      | `text`        | NOT NULL                                        | Original article URL.                                                  |
| `published_at`    | `timestamptz` | NOT NULL                                        | Publication timestamp from RSS.                                        |
| `created_at`      | `timestamptz` | default `now()`                                 | Row creation timestamp.                                                |
| `pipeline_run_id` | `text`        | nullable                                        | Trigger.dev run ID for traceability.                                   |

---

### `tag`

Normalised entity tag registry. One canonical row per entity.

| Column       | Type          | Constraints                     | Description                                               |
| ------------ | ------------- | ------------------------------- | --------------------------------------------------------- |
| `id`         | `uuid`        | PK, default `gen_random_uuid()` | Unique tag identifier.                                    |
| `name`       | `text`        | UNIQUE, NOT NULL                | Canonical label (e.g. `NVIDIA`, `OpenAI`, `$TSLA`).      |
| `created_at` | `timestamptz` | default `now()`                 | Row creation timestamp.                                   |

---

### `signal_tag`

Junction table. Max 3 tags per signal — enforced at the pipeline layer before insert.

| Column      | Type   | Constraints                                      | Description            |
| ----------- | ------ | ------------------------------------------------ | ---------------------- |
| `signal_id` | `uuid` | FK → `signal(id)` ON DELETE CASCADE              | —                      |
| `tag_id`    | `uuid` | FK → `tag(id)` ON DELETE CASCADE                 | —                      |
| PRIMARY KEY | —      | (`signal_id`, `tag_id`)                          | Composite PK.          |

---

## Entity Relationship

```
signal ──< signal_tag >── tag
```

No user-owned tables. `auth.users` is not referenced by any application table.

---

## Drizzle Schema (lib/db/schema/*.ts)

```ts
import { pgTable, uuid, text, timestamp, primaryKey, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const signal = pgTable('signal', {
  id:            uuid('id').primaryKey().defaultRandom(),
  factHash:      text('fact_hash').notNull().unique(),
  category:      text('category').notNull(),
  titleEn:       text('title_en').notNull(),
  titleZh:       text('title_zh').notNull(),
  contentEn:     text('content_en').notNull(),
  contentZh:     text('content_zh').notNull(),
  summaryZh:     text('summary_zh').array().notNull(),
  imageUrl:  text('image_url'),
  imageAlt:  text('image_alt'),
  sourceUrl:     text('source_url').notNull(),
  publishedAt:   timestamp('published_at', { withTimezone: true }).notNull(),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
  pipelineRunId: text('pipeline_run_id'),
}, table => [
  check('category_check', sql`${table.category} IN ('tech', 'world', 'science')`),
])

export const tag = pgTable('tag', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const signalTag = pgTable('signal_tag', {
  signalId: uuid('signal_id').notNull().references(() => signal.id, { onDelete: 'cascade' }),
  tagId:    uuid('tag_id').notNull().references(() => tag.id, { onDelete: 'cascade' }),
}, table => [
  primaryKey({ columns: [table.signalId, table.tagId] }),
])
```

---

## Zod Validators (lib/validators/signal.ts)

```ts
import { z } from 'zod'

export const categorySchema = z.enum(['tech', 'world', 'science'])

export const signalSchema = z.object({
  id:           z.string().uuid(),
  factHash:     z.string(),
  category:     categorySchema,
  titleEn:      z.string().min(1),
  titleZh:      z.string().min(1),
  contentEn:    z.string().min(1),
  contentZh:    z.string().min(1),
  summaryZh:    z.array(z.string().min(1)).length(3),
  imageUrl: z.string().url().nullable(),
  imageAlt: z.string().nullable(),
  sourceUrl:    z.string().url(),
  publishedAt:  z.string().datetime(),
  createdAt:    z.string().datetime().nullable(),
  pipelineRunId: z.string().nullable(),
})

// For the LLM output shape coming back from OpenRouter
export const llmOutputSchema = z.object({
  titleZh:   z.string().min(1),
  contentEn: z.string().min(1),
  contentZh: z.string().min(1),
  summaryZh: z.array(z.string().min(1)).length(3),
  tags:      z.array(z.string().min(1)).max(3),
})

// API query params
export const signalQuerySchema = z.object({
  category: categorySchema.optional(),
  cursor:   z.string().uuid().optional(),
  limit:    z.coerce.number().int().min(1).max(50).default(20),
})

export const signalSearchSchema = z.object({
  q:     z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(20).default(10),
})
```

---

## Indexes

```sql
CREATE UNIQUE INDEX idx_signal_fact_hash   ON signal (fact_hash);
CREATE INDEX idx_signal_category_published ON signal (category, published_at DESC);
CREATE INDEX idx_signal_published_at       ON signal (published_at DESC);
CREATE INDEX idx_signal_tag_signal_id      ON signal_tag (signal_id);
CREATE INDEX idx_signal_tag_tag_id         ON signal_tag (tag_id);
CREATE UNIQUE INDEX idx_tag_name                  ON tag (name);
```

---

## Data Retention

```sql
-- Executed by server/tasks/purge-old.ts on the 1st of each month
DELETE FROM signal WHERE published_at < NOW() - INTERVAL '3 months';
-- signal_tag rows cascade automatically.
-- Orphaned tag rows cleaned up in the same job via:
DELETE FROM tag WHERE id NOT IN (SELECT DISTINCT tag_id FROM signal_tag);
```