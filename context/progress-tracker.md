# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- [x] Design system configuration
- [x] Layout components
- [x] Auth
- [x] Drizzle ORM setup & initial migration
- [x] Refinery pipeline (ingest → extract → de-noise → slug → mirror)
- [x] Signal persistence (DB write stage of pipeline)

## Current Goal

- Core feature implementation per `project-overview.md`

## Completed

- **Design System** (`01-design-system.md`): Dark theme, OKLCH brand color, bilingual fonts, typography system
- **Layout** (`02-layout.md`): Desktop/mobile responsive layout, header, CategoryFilter, MobileBottomNavbar, scroll-collapse
- **Auth** (`03-auth.md`): Login page with OAuth (Google/GitHub) via `@nuxtjs/supabase`
- **Drizzle ORM** (`04-setup-drizzle.md` + `database-schema.md`): Supabase direct connection, `server/database/` schema with `pgEnum` for `category`, `slug` column, `postgres(max: 1)`, `casing: 'snake_case'`, clean initial migration applied
- **RSS Nitro Task** (`06-rss-nitro-task.md`): `server/database/queries/signal.ts` — `findSignalByGuid(guid)` query with Drizzle ORM relational query API; `shared/validators/rss.ts` — added `refineryPayloadSchema` and `RefineryPayload` type; `server/tasks/rss-ingestion.ts` — Nitro task with `name: "rss-ingestion"`, fetches Yahoo RSS feeds for finance/tech/world categories, de-duplicates by guid, validates against `refineryPayloadSchema`, limits to 5 new articles per category, placeholder for Trigger.dev pipeline; `nuxt.config.ts` scheduled tasks for `0 8,20 * * *` (08:00 and 20:00 daily)
- **Trigger.dev Setup** (`07-trigger-dev.md`): Installed `@trigger.dev/sdk` (v4.4.6), created `trigger.config.ts` with node-22 runtime, retries disabled in dev; created `trigger/` directory with `example.ts` (example task) and `refinery.ts` (schemaTask for article processing with Zod validation)
- **Extract Detail Content** (`07-extract-detail-content.md`): Installed `@extractus/article-extractor` (v8.1.0) and `undici`; created `trigger/refinery-agent.ts` — schemaTask that validates payloads against `refineryPayloadSchema`, extracts article content via `@extractus/article-extractor`, strips HTML tags, and logs extracted content; updated `server/tasks/rss-ingestion.ts` to trigger `refinery-agent` task with validated payload data; created `shared/utils/extractor.ts` using `undici`'s `setGlobalDispatcher` with `maxHeaderSize: 32768` — needed because Trigger.dev tasks run outside the Nuxt Nitro context where `$fetch` auto-imports aren't available, and to bypass Yahoo Finance's `HeadersOverflowError` (16KB default limit); uses browser User-Agent headers to bypass anti-bot blocking
- **Slug Generation and Image Mirroring** (`09-slug-generation-and-image-mirroring.md`): Added `SUPABASE_SERVICE_ROLE_KEY` to `shared/env.ts` (and `.env.example`); added `@supabase/supabase-js@^2.106.1` to `package.json` (transitive from `@nuxtjs/supabase`, declared explicitly because pnpm's strict mode blocks importing undeclared packages); created `shared/utils/create-storage-client.ts` exporting a memoized `createStorageClient()` Supabase client configured with the service role key and session persistence disabled (suitable for backend-only use); created `trigger/utils/slug.ts` with `generateSlug(title, publishedAt)` that lowercases, normalises (NFKD + diacritic strip), collapses non-alphanumerics to single hyphens, and appends `YYYYMMDD` from UTC components; created `trigger/utils/mirror-image.ts` with `mirrorImage(imageUrl)` that downloads via `undici` (15s timeout, browser UA), re-encodes to **WebP via `sharp`** (quality 80, max width 1280 px, with a quality-65 retry when the result exceeds a 95 KB soft target — the smaller of the two buffers is uploaded), uploads to the `signal-images` bucket using a `crypto.randomUUID()` filename, and returns the public URL; `sharp` failures fall back to uploading the original bytes; updated `trigger/refinery-agent.ts` to compute `slug` after LLM success, attempt mirroring (logging but not aborting on failure per architecture invariant), and return `{ slug, mirroredImageUrl, …existing }`; updated `architecture.md` and `database-scheme.md` to use `YYYYMMDD` (was `YYYY-MM-DD`) for consistency with the spec
- **Store Signal Data** (`10-store-signal-data.md`): Added `drizzle-zod@0.8.3` (compatible with `drizzle-orm@0.45.2` and `zod@4.4.3`); appended Zod **insert schemas** to the existing table files — `InsertSignal` in `server/database/schema/signal.ts` (with `summaryEn`/`summaryZh` length-3 refinements to mirror the LLM contract, and `.omit({ id, createdAt, updatedAt })`), `InsertTag` in `server/database/schema/tag.ts` (same `.omit`), and `InsertSignalTag` in `server/database/schema/signal-tag.ts` (no fields to omit — only `signalId` + `tagId`); inferred `InsertSignal` / `InsertTag` / `InsertSignalTag` types via `z.infer`; created three query helpers in `server/database/queries/` — `insertSignal`, **`insertTag`** (uses `onConflictDoUpdate({ target: tag.name, set: { name: sql\`excluded.name\` } })` internally so the same row is returned whether the tag already existed or was just inserted — no `SELECT` fallback required; the function is named `insertTag` for naming consistency with the other helpers even though the underlying SQL is an upsert), and `insertSignalTag`; all three validate the incoming payload via `safeParse(...)` of their respective Zod insert schema and throw an explicit error when the insert returns no row (no `!` non-null assertion operator); all three accept an optional `DbClient` (derived as `typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0]`) so they participate transparently in a `db.transaction(async (tx) => …)` boundary; marked `categoryEnum` in `signal.ts` as module-private (no longer re-exported from `schema/index.ts`) so the schema namespace satisfies the `TablesRelationalConfig` constraint that `PostgresJsTransaction` requires; updated `trigger/refinery-agent.ts` to call the three helpers inside a `db.transaction` block — `insertSignal` → loop `insertTag` + `insertSignalTag` per `llmOutput.tags` entry — and return `{ …existing, persisted: { insertedSignal, insertedTags, insertedSignalTags } }` so the stored rows are visible in the trigger.dev dashboard for manual verification


## In Progress

- None.

## Next Up

- Nitro API routes (`/api/signals`, `/api/signals/[id]`, `/api/signals/search`)
- Supabase Auth session middleware (`server/middleware/auth.ts`)

## Open Questions

- **Slug uniqueness retry**: The current `refinery-agent.ts` calls `insertSignal` with the base `generateSlug(...)` output. If two articles happen to produce the same `{slugified-title-en}-{YYYYMMDD}` on the same day, the second insert will hit the `slug` unique constraint and bubble up as a task failure (Trigger.dev retries, but the retry is likely to hit the same conflict). Architecture.md mandates `-2` / `-3` / … / `-10` retry-with-suffix. Defer to a follow-up feature unit — no production impact right now (the rss-ingestion dedup by `guid` already covers the common case).
- **Postgres advisory lock or named constraint for the refinery transaction**: Currently `refinery-agent.ts` runs `db.transaction(...)` inside the Trigger.dev worker. Trigger.dev already provides run-level isolation via `ctx.run.id`, but two concurrent runs that happen to share a `guid` (very unlikely given the rss-ingestion dedup, but possible during a manual re-trigger) could in theory race. The `guid` unique constraint makes the loser fail safely. No action needed.

## Architecture Decisions

- **ESLint Configuration Strategy**: Use separate config objects in the flat config array to target specific file types for rules that rely on specific parsers (e.g., Vue rules). This prevents crashes when linting non-target files like Markdown.
- **Design System Configuration**: Use `app.config.ts` for color palette selection (`primary: 'brand'`, `neutral: 'neutral'`) and CSS `@theme static` block for custom color definitions with OKLCH values.
- **Layout Component Strategy**: Desktop shows header with search and avatar dropdown; mobile header collapses on scroll with hysteresis threshold, shows search bar and category filter below title.
- **Scroll Collapse Pattern**: Created generic `useScrollCollapse` composable and `AppScrollCollapseSection` wrapper component to handle scroll-based show/hide behavior. This keeps scroll logic encapsulated and reusable. CategoryFilter remains a pure presentational component without scroll awareness.
- **Objective Minimalist Typography System**: Configured a clinical, language-agnostic typography system in `ui-context.md` pairing standard readable sans-serif fonts with a monospace stack (`JetBrains Mono` / `Fira Code`). The system uses the standard Tailwind CSS size scale (`text-xs` to `text-2xl`), restricts weights to a maximum of `600` (Semi-Bold), and forbids bold text and italics in de-noised content to preserve neutrality. Enforces tabular figures (`tabular-nums`) for column alignment and specifies background-color-free entity tags for clean typography.
- **Trigger.dev Configuration**: Uses `trigger.config.ts` with `dirs: ["./trigger"]`, node-22 runtime, and retries disabled in development. Tasks are schemaTask with Zod validation for type-safe payloads. The Nitro RSS ingestion task acts as the orchestrator, triggering the Trigger.dev refinery pipeline for article processing.
- **Transactional DB Writes in the Pipeline**: All three persistence steps (insertSignal → insertTag → insertSignalTag) run inside a single `db.transaction(async (tx) => …)` inside `refinery-agent.ts`. Helpers accept an optional `DbClient` (`typeof db | transaction client`) so they remain composable. Each helper validates the incoming payload with `InsertXxxSchema.safeParse(...)` (throwing on failure) and replaces the previous `!` non-null assertion on the `.returning()` row with an explicit `if (!inserted) throw` check. Returning the inserted rows from the transaction gives the caller full IDs in one round-trip and surfaces any failure to the Trigger.dev retry path.
- **Tag Insert (Internally Upsert)**: The `insertTag` helper calls `onConflictDoUpdate({ target: tag.name, set: { name: sql\`excluded.name\` } })` internally. The `set` clause is a no-op (assigning `name` to its own value), and Drizzle's `$onUpdate(() => new Date())` callback does not fire on the `onConflictDoUpdate` path — so `updated_at` is never touched spuriously, and `.returning()` always yields the row (no `findTagByName` fallback needed). The function is named `insertTag` for consistency with the other insert helpers; the upsert nature is an internal implementation detail.
- **Insert Schemas Co-located with Drizzle Tables**: `drizzle-zod`'s `createInsertSchema(table).omit(...)` derives the insertable shape from the same source of truth as the table definition, so column name casing and nullability stay in lock-step. The schemas live in the same files as the table definitions (`server/database/schema/{signal,tag,signal-tag}.ts`) rather than a separate `schemas/` directory — matches `architecture.md` and `code-standards.md`, both of which prescribe a singular `schema/`.

## Session Notes

- ESLint is now fully functional and passing.
- Design system is configured with brand color as primary, dark-only theme, black background, and 0.375rem border radius.
- Layout components implemented: AppHeader (desktop/mobile responsive), CategoryFilter (horizontal scroll), MobileBottomNavbar (mobile-only fixed bottom nav).
- All components use NuxtUI semantic color tokens (`border-default`, `text-highlighted`, etc.) and OKLCH brand color system.
- Typography system fully documented and unified with the design-system context using standard Tailwind default classes and background-color-free entity tags.
- Updated app to follow Typography guidelines: `--font-mono` added to main.css for monospace stack; layout components use appropriate font scales and weights per the "Objective Minimalist" design philosophy.
- Drizzle ORM fully configured with Supabase direct connection. `server/database/` is server-only (never imported from `app/`). All 3 tables created in Supabase with proper indexes, enums, and foreign keys. CamelCase → snake_case mapping handled by Drizzle's `casing: 'snake_case'` option.
- Fixed `TypeError: fetch failed` / `HeadersOverflowError` when fetching Yahoo Finance articles: `@extractus/article-extractor`'s built-in `retrieve()` uses Node's native undici fetch with a 16KB header limit, which Yahoo Finance exceeds. Solved by using `undici` directly in `shared/utils/extractor.ts` with `setGlobalDispatcher(new Agent({ maxHeaderSize: 32768 }))` to configure a 32KB header limit globally. Uses browser User-Agent headers to bypass anti-bot measures.
