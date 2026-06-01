# Objective

## Spec 01 — Drizzle ORM Setup & Initial Migration

Configure Drizzle ORM to connect to the Supabase PostgreSQL database using the service role key. Define the application schema (`signal`, `tag`, `signal_tag`) and run the first migration to create all tables in Supabase.

`Drizzle ORM` related and `postgres` are already installed

- `drizzle-orm` — query builder and schema definition
- `postgres` — the Postgres.js driver (recommended for Drizzle + Supabase)
- `drizzle-kit` — CLI for generating and running migrations

---

## Environment Variables

`DATABASE_URL` already added to `.env` and `.env.example`

```bash
# Supabase direct connection string (NOT the pooler URL)
# Found in: Supabase dashboard → Project Settings → Database → Connection string → URI
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```
> **Important**: Use the **direct connection** URI, not the Supabase connection pooler (port 6543). Drizzle migrations require a direct connection. The pooler can be optionally used at runtime, but start with direct for simplicity.

### Validation

Add `DATABASE_URL` to `./shared/env.ts` for type-safe access across the codebase.

---

## Implementation

### 1. Drizzle client — `server/database/index.ts`

```ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const client = postgres(env.DATABASE_URL)

export const db = drizzle(client, {
  casing: 'snake_case',
  schema,
})
```

### 2. Schema — `server/database/schema/*.ts`

Follows `database-schema.md` exactly, with three tables: `signal`, `tag`, and `signal_tag`. Each table is defined in its own file and re-exported from `index.ts`.

```ts
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  primaryKey,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const categoryEnum = pgEnum('category', ['finance', 'tech', 'world'])

export const signal = pgTable('signal', {
  id:            uuid().primaryKey().defaultRandom(),
  guid:          text().notNull().unique(),
  category:      categoryEnum().notNull(),
  titleEn:       text().notNull(),
  titleZh:       text().notNull(),
  contentEn:     text().notNull(),
  contentZh:     text().notNull(),
  summaryZh:     text().array().notNull(),
  imageUrl:      text(),
  sourceUrl:     text().notNull(),
  publishedAt:   timestamp({ withTimezone: true }).notNull(),
  createdAt:     timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  pipelineRunId: text(),
}, t => [
  index('idx_signal_category_published').on(t.category, t.publishedAt.desc()),
  index('idx_signal_published_at').on(t.publishedAt.desc()),
])

export const tag = pgTable('tag', {
  id:        uuid().primaryKey().defaultRandom(),
  name:      text().notNull().unique(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
})

export const signalTag = pgTable('signal_tag', {
  signalId: uuid().notNull().references(() => signal.id, { onDelete: 'cascade' }),
  tagId:    uuid().notNull().references(() => tag.id, { onDelete: 'cascade' }),
}, t => [
  index('idx_signal_tag_signal_id').on(t.signalId),
  index('idx_signal_tag_tag_id').on(t.tagId),
  primaryKey({ columns: [t.signalId, t.tagId] }),
])
```

### 3. Drizzle config — `drizzle.config.ts` (project root)

```ts
import { defineConfig } from 'drizzle-kit'
import { env } from './shared/env'

export default defineConfig({
  dialect: 'postgresql',
  schema:  './server/database/schema/index.ts',
  out:     './server/database/migrations',
  casing:  'snake_case',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
```

### 4. npm scripts — `package.json`

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate":  "drizzle-kit migrate",
    "db:studio":   "drizzle-kit studio"
  }
}
```

---

## Migrations

Run in order:

```bash
# 1. Generate SQL from schema
pnpm db:generate

# 2. Apply to Supabase
pnpm db:migrate
```

Inspect `server/database/migrations/` — a `.sql` file should appear containing `CREATE TABLE` statements for `signal`, `tag`, and `signal_tag`.

---

## Notes

- `server/database/` must **never** be imported from `app/`. It is server-only.
- Do not use `drizzle-kit push` in production. Always use `generate` + `migrate` to keep a versioned migration history in `server/database/migrations/`.
- The `postgres` client is initialized once at module load. In a Nitro serverless context, keep `max: 1` to avoid exhausting Supabase's connection limit.
- `DATABASE_URL` must be added to the deployment environment (Vercel / Cloudflare / etc.) separately from the Supabase anon key already used by `@nuxtjs/supabase`.
- Do not add `DATABASE_URL` to `runtimeConfig` in `nuxt.config.ts` — it is consumed directly by `server/database/index.ts` at the Node.js level, not at the Nuxt runtime config level.

---

## Checklist

- [ ] `drizzle-orm`, `postgres`, and `drizzle-kit` are installed.
- [ ] `DATABASE_URL` is set in `.env` using the direct connection URI.
- [ ] `server/database/index.ts` exports `db`.
- [ ] `server/database/schema/index.ts` defines `signal`, `tag`, and `signal_tag` exactly as specified.
- [ ] `drizzle.config.ts` is present at project root and points to the correct schema and migrations paths.
- [ ] `pnpm db:generate` produces a valid `.sql` file in `server/database/migrations/`.
- [ ] `pnpm db:migrate` runs without error.
- [ ] All three tables are visible in the Supabase dashboard (Table Editor or SQL Editor: `SELECT * FROM signal LIMIT 1`).
- [ ] `server/database/` is not imported from any file inside `app/`.
- [ ] No TypeScript errors (`pnpm typecheck` or `pnpm build`).
- [ ] `pnpm lint --fix` passes.