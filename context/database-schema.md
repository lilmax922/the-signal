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
| `slug`            | `text`        | UNIQUE, NOT NULL                                | URL-safe identifier. Format: `{slugified-title-en}-{YYYYMMDD}`. Used in all public-facing routes. |
| `guid`            | `text`        | UNIQUE, NOT NULL                                | `guid` from RSS metadata. Pipeline deduplication key only — never exposed in URLs. |
| `category`        | `text`        | NOT NULL, CHECK IN (`finance`, `tech`, `world`) | Derived from the source RSS feed path.                                   |
| `title_en`        | `text`        | NOT NULL                                        | De-noised English headline.                             |
| `title_zh`        | `text`        | NOT NULL                                        | De-noised Traditional Chinese headline.                                  |
| `content_en`      | `text`        | NOT NULL                                        | De-noised English body. Retained for potential re-processing.            |
| `content_zh`      | `text`        | NOT NULL                                        | Translated Traditional Chinese body. Rendered in the UI.                 |
| `summary_zh`      | `text[]`      | NOT NULL                                        | Exactly 3 Traditional Chinese bullet-point summary items.                |
| `image_url`       | `text`        | nullable                                        | Supabase Storage public URL for the mirrored image.                      |
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
2. Append `-{YYYYMMDD}` from `published_at`.
3. Query DB for existing slug. If unique → use it.
4. If collision → append `-2`, `-3`, up to `-10`.
5. If still colliding after 10 attempts → log and discard the article.

Example: `nvidia-announces-blackwell-ultra-gpu-20260522`

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
  summaryEn:     text().array().notNull(),
  summaryZh:     text().array().notNull(),
  imageUrl:      text(),
  sourceUrl:     text().notNull(),
  publishedAt:   timestamp({ withTimezone: true }).notNull(),
  createdAt:     timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  pipelineRunId: text(),
}, t => [
  // Cursor pagination: composite (published_at, id) for `WHERE (published_at, id) < (?, ?)` lookups
  index('idx_signal_published_at_id').on(t.publishedAt.desc(), t.id.desc()),

  // Per-category partial indexes (filtered queries hit these instead of the full composite)
  index('idx_signal_finance_published_at_id').on(t.publishedAt.desc(), t.id.desc())
    .where(sql`${t.category} = 'finance'`),
  index('idx_signal_tech_published_at_id').on(t.publishedAt.desc(), t.id.desc())
    .where(sql`${t.category} = 'tech'`),
  index('idx_signal_world_published_at_id').on(t.publishedAt.desc(), t.id.desc())
    .where(sql`${t.category} = 'world'`),

  // Legacy index retained for any non-cursor queries that filter by category only
  index('idx_signal_category_published').on(t.category, t.publishedAt.desc()),

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
  summaryEn:     z.array(z.string().min(1)).length(3),
  summaryZh:     z.array(z.string().min(1)).length(3),
  imageUrl:      z.string().url().nullable(),
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
  summaryEn: z.array(z.string().min(1)).length(3),
  summaryZh: z.array(z.string().min(1)).length(3),
  tags:      z.array(z.string().min(1)).max(3), // English only, no translation
})

// API query params — feed list
// `cursor` is a base64-encoded `"{publishedAt-iso}|{id-uuid}"` returned by the previous page.
// It is a wire format, never stored in the database.
export const signalQuerySchema = z.object({
  category: categorySchema.optional(),
  cursor:   z.string().min(1).optional(),
  limit:    z.coerce.number().int().min(1).max(50).default(10),  // FEED_PAGE_SIZE
})

// API response — feed list (lightweight card shape used by SignalFeed)
export const signalFeedSchema = z.object({
  id:          z.string().uuid(),
  slug:        z.string().min(1),
  titleZh:     z.string().min(1),
  summaryZh:   z.array(z.string().min(1)).length(3),
  imageUrl:    z.string().url().nullable(),
  category:    categorySchema,
  publishedAt: z.string().datetime(),
  tags:        z.array(z.object({
    id:   z.string().uuid(),
    name: z.string().min(1),
  })).max(3),
})

export const feedResponseSchema = z.object({
  items:      z.array(signalFeedSchema),
  nextCursor: z.string().nullable(),
  hasMore:    z.boolean(),
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
-- Cursor pagination: composite anchor for `WHERE (published_at, id) < (?, ?)` lookups
CREATE INDEX idx_signal_published_at_id          ON signal (published_at DESC, id DESC);

-- Per-category partial indexes (filtered feed queries hit these instead of the full composite)
CREATE INDEX idx_signal_finance_published_at_id  ON signal (published_at DESC, id DESC) WHERE category = 'finance';
CREATE INDEX idx_signal_tech_published_at_id     ON signal (published_at DESC, id DESC) WHERE category = 'tech';
CREATE INDEX idx_signal_world_published_at_id    ON signal (published_at DESC, id DESC) WHERE category = 'world';

-- Legacy index retained for any non-cursor queries that filter by category only
CREATE INDEX idx_signal_category_published       ON signal (category, published_at DESC);

-- signal_tag junction
CREATE INDEX idx_signal_tag_signal_id            ON signal_tag (signal_id);
CREATE INDEX idx_signal_tag_tag_id               ON signal_tag (tag_id);
```

---

## Cursor Pagination

The Signal Feed uses **cursor-based pagination** to support infinite scroll with constant-time queries at any depth.

### Cursor Format

`base64({publishedAt-iso}|{id-uuid})` — a wire format produced by the server from the last row of each page and echoed back by the client on the next request. **The cursor is never stored in the database** — it lives only on the wire between consecutive requests.

### Server Query (Postgres)

```sql
-- Filtered feed (with category)
SELECT * FROM signal
WHERE (published_at, id) < ($1, $2)
  AND category = $3
ORDER BY published_at DESC, id DESC
LIMIT 10;

-- Unfiltered feed (no category)
SELECT * FROM signal
WHERE (published_at, id) < ($1, $2)
ORDER BY published_at DESC, id DESC
LIMIT 10;
```

The composite index `(published_at DESC, id DESC)` lets Postgres seek directly to the cursor position without scanning the rows that have already been returned. The per-category partial indexes accelerate the filtered variants.

### Cursor Encoding (Reference)

```ts
// Encode (server)
const cursor = Buffer.from(`${row.publishedAt.toISOString()}|${row.id}`).toString('base64')

// Decode (server, on next request)
const [publishedAt, id] = Buffer.from(cursor, 'base64').toString('utf-8').split('|')
```

### Page Size

The default page size is `10` (constant `FEED_PAGE_SIZE` in `shared/constants/limits.ts`). Page sizes above `50` are rejected by the API.

---

## Data Retention

```sql
-- Executed by server/tasks/purge-old.ts on the 1st of each month
DELETE FROM signal WHERE published_at < NOW() - INTERVAL '3 months';
-- signal_tag rows cascade automatically via ON DELETE CASCADE.
-- Orphaned tag rows cleaned up in the same job:
DELETE FROM tag WHERE id NOT IN (SELECT DISTINCT tag_id FROM signal_tag);
```