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

| Column            | Type          | Constraints                                     | Description                                                              |
| ----------------- | ------------- | ----------------------------------------------- | ------------------------------------------------------------------------ |
| `id`              | `uuid`        | PK, default `gen_random_uuid()`                 | Unique internal identifier.                                              |
| `slug`            | `text`        | UNIQUE, NOT NULL                                | URL-safe identifier. Format: `{slugified-title-en}-{YYYY-MM-DD}`. Used in all public-facing routes. |
| `guid`            | `text`        | UNIQUE, NOT NULL                                | `guid` from RSS metadata. Pipeline deduplication key only — never exposed in URLs. |
| `category`        | `text`        | NOT NULL, CHECK IN (`finance`, `tech`, `world`) | Derived from the source RSS feed path.                                   |
| `title_en`        | `text`        | NOT NULL                                        | De-noised English headline.                             |
| `title_zh`        | `text`        | NOT NULL                                        | De-noised Traditional Chinese headline.                                  |
| `content_en`      | `text`        | NOT NULL                                        | De-noised English body. Retained for potential re-processing.            |
| `content_zh`      | `text`        | NOT NULL                                        | Translated Traditional Chinese body. Rendered in the UI.                 |
| `summary_zh`      | `text[]`      | NOT NULL                                        | Exactly 3 Traditional Chinese bullet-point summary items.                |
| `image_url`       | `text`        | nullable                                        | Supabase Storage public URL for the mirrored image.                      |
| `image_alt`       | `text`        | nullable                                        | Alt text for the preview image.                                          |
| `source_url`      | `text`        | NOT NULL                                        | Original article URL.                                                    |
| `published_at`    | `timestamptz` | NOT NULL                                        | Publication timestamp from RSS.                                          |
| `created_at`      | `timestamptz` | default `now()`                                 | Row creation timestamp.                                                  |
| `pipeline_run_id` | `text`        | nullable                                        | Trigger.dev run ID for traceability.                                     |

---

### `tag`

Normalised entity tag registry. One canonical row per entity.

| Column       | Type          | Constraints                     | Description                                          |
| ------------ | ------------- | ------------------------------- | ---------------------------------------------------- |
| `id`         | `uuid`        | PK, default `gen_random_uuid()` | Unique tag identifier.                               |
| `name`       | `text`        | UNIQUE, NOT NULL                | Canonical label (e.g. `NVIDIA`, `OpenAI`, `$TSLA`). |
| `created_at` | `timestamptz` | default `now()`                 | Row creation timestamp.                              |

---

### `signal_tag`

Junction table. Max 3 tags per signal — enforced at the pipeline layer before insert.

| Column      | Type   | Constraints                          | Description   |
| ----------- | ------ | ------------------------------------ | ------------- |
| `signal_id` | `uuid` | FK → `signal(id)` ON DELETE CASCADE  | —             |
| `tag_id`    | `uuid` | FK → `tag(id)` ON DELETE CASCADE     | —             |
| PRIMARY KEY | —      | (`signal_id`, `tag_id`)              | Composite PK. |

---

## Entity Relationship

```
signal ──< signal_tag >── tag
```

No user-owned tables. `auth.users` is not referenced by any application table.

---

## Slug Generation Rules

Slugs are generated during Trigger.dev Stage 2, before DB persistence.

1. Slugify `title_en`: lowercase, replace spaces and special characters with `-`, strip non-alphanumeric characters.
2. Append `-{YYYY-MM-DD}` from `published_at`.
3. Query DB for existing slug. If unique → use it.
4. If collision → append `-2`, `-3`, up to `-10`.
5. If still colliding after 10 attempts → log and discard the article.

Example: `nvidia-announces-blackwell-ultra-gpu-2026-05-22`

---

## Drizzle Schema (`server/database/schema/`)

Each table lives in its own file. `server/database/schema/index.ts` re-exports all tables.

```ts
// server/database/schema/signal.ts
import { pgTable, uuid, text, timestamp, index, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const signal = pgTable('signal', {
  id:            uuid().primaryKey().defaultRandom(),
  slug:          text().notNull().unique(),
  guid:          text().notNull().unique(),
  category:      text().notNull(),
  titleEn:       text().notNull(),
  titleZh:       text().notNull(),
  contentEn:     text().notNull(),
  contentZh:     text().notNull(),
  summaryZh:     text().array().notNull(),
  imageUrl:      text(),
  imageAlt:      text(),
  sourceUrl:     text().notNull(),
  publishedAt:   timestamp({ withTimezone: true }).notNull(),
  createdAt:     timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  pipelineRunId: text(),
}, t => [
  index('idx_signal_category_published').on(t.category, t.publishedAt.desc()),
  index('idx_signal_published_at').on(t.publishedAt.desc()),
  check('signal_category_check', sql`${t.category} IN ('finance', 'tech', 'world')`),
])
```

```ts
// server/database/schema/tag.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const tag = pgTable('tag', {
  id:        uuid().primaryKey().defaultRandom(),
  name:      text().notNull().unique(),
  createdAt:     timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
})
```

```ts
// server/database/schema/signal-tag.ts
import { pgTable, uuid, index, primaryKey } from 'drizzle-orm/pg-core'
import { signal } from './signal'
import { tag } from './tag'

export const signalTag = pgTable('signal_tag', {
  signalId: uuid().notNull().references(() => signal.id, { onDelete: 'cascade' }),
  tagId:    uuid().notNull().references(() => tag.id, { onDelete: 'cascade' }),
}, t => [
  index('idx_signal_tag_signal_id').on(t.signalId),
  index('idx_signal_tag_tag_id').on(t.tagId),
  primaryKey({ columns: [t.signalId, t.tagId] }),
])
```

```ts
// server/database/schema/index.ts
export * from './signal'
export * from './tag'
export * from './signal-tag'
```

---

## Zod Validators (`shared/validators/signal.ts`)

```ts
import { z } from 'zod'

export const categorySchema = z.enum(['finance', 'tech', 'world'])

export const signalSchema = z.object({
  id:            z.string().uuid(),
  slug:          z.string().min(1),
  guid:          z.string().min(1),
  category:      categorySchema,
  titleEn:       z.string().min(1),
  titleZh:       z.string().min(1),
  contentEn:     z.string().min(1),
  contentZh:     z.string().min(1),
  summaryZh:     z.array(z.string().min(1)).length(3),
  imageUrl:      z.string().url().nullable(),
  imageAlt:      z.string().nullable(),
  sourceUrl:     z.string().url(),
  publishedAt:   z.string().datetime(),
  createdAt:     z.string().datetime().nullable(),
  pipelineRunId: z.string().nullable(),
})

// LLM output shape from OpenRouter
export const llmOutputSchema = z.object({
  titleZh:   z.string().min(1),
  contentEn: z.string().min(1),
  contentZh: z.string().min(1),
  summaryZh: z.array(z.string().min(1)).length(3),
  tags:      z.array(z.string().min(1)).max(3),
})

// API query params — feed list
export const signalQuerySchema = z.object({
  category: categorySchema.optional(),
  cursor:   z.string().uuid().optional(),
  limit:    z.coerce.number().int().min(1).max(50).default(20),
})

// API query params — search
export const signalSearchSchema = z.object({
  q:     z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(20).default(10),
})
```

---

## Indexes

```sql
CREATE INDEX        idx_signal_category_published ON signal (category, published_at DESC);
CREATE INDEX        idx_signal_published_at     ON signal (published_at DESC);
CREATE INDEX        idx_signal_tag_signal_id    ON signal_tag (signal_id);
CREATE INDEX        idx_signal_tag_tag_id       ON signal_tag (tag_id);
```

---

## Data Retention

```sql
-- Executed by server/tasks/purge-old.ts on the 1st of each month
DELETE FROM signal WHERE published_at < NOW() - INTERVAL '3 months';
-- signal_tag rows cascade automatically via ON DELETE CASCADE.
-- Orphaned tag rows cleaned up in the same job:
DELETE FROM tag WHERE id NOT IN (SELECT DISTINCT tag_id FROM signal_tag);
```