# Objective

Implement robust database persistence for signals and related entities using Drizzle ORM with Supabase, ensuring efficient data storage, retrieval, and management to support the core features of the application.

# Implementation

## Step 1 - DB persistence

- Add `drizzle-zod` to `package.json` (compatible with the project's `drizzle-orm` + `zod` versions).
- Extract a shared `DbClient` type in `server/database/index.ts`. The type is the union of the standalone `db` connection and the transaction client that Drizzle hands to a `db.transaction(async (tx) => …)` callback. The union is derived programmatically (the transaction-client side comes from `Parameters<Parameters<typeof db.transaction>[0]>[0]`) so it always tracks Drizzle's internal types and never drifts. This is the single source of truth used by every query helper so they can run standalone (using `db`) or inside a transaction (using `tx`) without any wrapping logic in the caller.
- Append a Zod **insert schema** and an inferred **insert type** to the existing Drizzle table file (no new directory). The `InsertSignal` schema in `server/database/schema/signal.ts` is produced via `createInsertSchema` from `drizzle-zod` and carries two refinements: `summaryEn` and `summaryZh` are constrained to arrays of length `3` (mirroring the LLM contract). The schema omits `id`, `createdAt`, and `updatedAt` via `.omit({ id: true, createdAt: true, updatedAt: true })` so callers cannot accidentally overwrite the server-managed identity and timestamp columns. The exported `InsertSignal` type is `z.infer<typeof InsertSignal>`.
- Implement `insertSignal` in `server/database/queries/signal.ts` with the signature `(insertable: InsertSignal, client: DbClient = db)`. The helper validates the incoming payload by calling `InsertSignalSchema.safeParse(insertable)`; a validation failure throws an explicit error carrying the Zod message (so the failure surfaces to the Trigger.dev retry path with useful context). On success the helper runs `client.insert(signal).values(parsed.data).returning()`, and if the returned array is empty it throws a clear error rather than relying on a non-null assertion operator. The `client` default of `db` keeps the helper ergonomic for standalone callers; pass `tx` to participate in a transaction.

## Step 2 - Insert tags + signal_tag junction (atomic transaction)

All three inserts MUST run inside a single `db.transaction(async (tx) => …)` block in `trigger/refinery-agent.ts`. This is non-negotiable: the helpers accept a `client` parameter for exactly this reason — Drizzle does not provide an ambient transaction context, so `tx` must be threaded explicitly. Inlining the inserts in the trigger task instead of going through the helpers is also valid; the helpers are the canonical, reusable entry point.

### Tag table

- Append a Zod insert schema and inferred insert type to the existing table file. The `InsertTag` schema in `server/database/schema/tag.ts` is produced via `createInsertSchema` and applies the same `.omit({ id: true, createdAt: true, updatedAt: true })` pattern as the signal schema. The exported `InsertTag` type is `z.infer<typeof InsertTag>`.
- Implement `insertTag` in `server/database/queries/tag.ts` with the signature `(insertable: InsertTag, client: DbClient = db)`. The helper validates the payload via `InsertTagSchema.safeParse(insertable)` and throws on failure. On success the helper runs `client.insert(tag).values(parsed.data).onConflictDoUpdate({ target: tag.name, set: { name: sql\`excluded.name\` } }).returning()` — a single round-trip that returns the row whether the tag was just created or already existed, with no `findTagByName` fallback. If the returned array is empty, the helper throws an explicit error (no non-null assertion operator). The `set` clause is intentionally a no-op (assigning `name` to its own value), and Drizzle's `$onUpdate(() => new Date())` callback does not fire on the `onConflictDoUpdate` path, so the server-managed `updated_at` is never touched spuriously. **The function is named `insertTag`** (not `upsertTag`) for naming consistency with the other insert helpers; the upsert nature is an internal implementation detail.

### Signal_Tag junction table

- Append a Zod insert schema and inferred insert type to the existing table file. The `InsertSignalTag` schema in `server/database/schema/signal-tag.ts` is produced via `createInsertSchema` with **no** `.omit` — the table has no `id` / `createdAt` / `updatedAt` columns, only the composite `signalId` + `tagId` primary key. The exported `InsertSignalTag` type is `z.infer<typeof InsertSignalTag>`.
- Implement `insertSignalTag` in `server/database/queries/signal-tag.ts` with the signature `(insertable: InsertSignalTag, client: DbClient = db)`. The helper validates the payload via `InsertSignalTagSchema.safeParse(insertable)` and throws on failure. On success the helper runs `client.insert(signalTag).values(parsed.data).returning()`; an empty returned array causes an explicit error throw.

### Pipeline integration

- In `trigger/refinery-agent.ts`, after image mirroring and the `generateSlug(...)` step, open a transaction and run the three helpers in order: first `insertSignal` (passing `tx`), then for each `name` in `llmOutput.tags` call `insertTag` (passing `tx`) followed by `insertSignalTag` (passing `tx`) with the freshly-returned `insertedSignal.id` and `insertedTag.id`. Collect the returned rows into two local arrays (`insertedTags` and `insertedSignalTags`) and return `{ insertedSignal, insertedTags, insertedSignalTags }` from the transaction closure. Capture that return value in a `persisted` local so the function's outer return can surface it.
- The outer task return MUST include `persisted: { insertedSignal, insertedTags, insertedSignalTags }` alongside the existing fields (`guid`, `title`, `sourceUrl`, `category`, `contentLength`, `timestamp`, `llmOutput`, `slug`, `mirroredImageUrl`) so the operator can inspect the stored rows in the Trigger.dev dashboard.

## Schema file naming

- Insert schemas live in the existing singular `server/database/schema/` directory (matching `architecture.md` / `code-standards.md`), co-located with the Drizzle table definition they derive from. Do not create a parallel `schemas/` directory.
- Use kebab-case for file names (`signal-tag.ts`), matching the existing Drizzle table file and `code-standards.md`.

## Schema namespace hygiene

- `categoryEnum` in `server/database/schema/signal.ts` MUST be a module-private `const`, NOT exported. Keeping it out of the schema namespace is what lets `typeof schema` satisfy the `TablesRelationalConfig` constraint that `PostgresJsTransaction` requires for its type parameters.

## Validation contract for every insert helper

- Each of `insertSignal`, `insertTag`, `insertSignalTag` MUST call its respective Zod insert schema's `safeParse` on the incoming `insertable` argument. On a failed parse, the helper MUST throw an `Error` whose message includes the Zod error message — never return a partial result.
- Each helper MUST destructure the first element of the `.returning()` array and check it explicitly. On an empty result the helper MUST throw an `Error` (e.g. `"insertXxx: no row returned"`). The `!` non-null assertion operator is forbidden in these helpers.
- These two checks make the helpers safe to call inside a Trigger.dev transaction: any failure (bad payload or database rejection) is surfaced as a thrown error and the surrounding `db.transaction` rolls back, with the error propagating to the Trigger.dev retry path.

# Out of Scope

- API routes for creating signals and tags.
- Query functions for retrieving signals with their associated tags.
- Slug uniqueness retries (`-2`, `-3`, …). If a slug collision occurs, the insert fails and the Trigger.dev retry path handles it; the `-2`-suffix retry is deferred to a future feature.
- Test infrastructure (Vitest) and automated tests for the insert helpers.

# Check When Done

- `InsertSignal` / `InsertTag` / `InsertSignalTag` are exported from `server/database/schema/{signal,tag,signal-tag}.ts`, with `id` / `createdAt` / `updatedAt` omitted from the first two.
- `InsertSignal` / `InsertTag` / `InsertSignalTag` types are inferred via `z.infer<typeof …>` and re-exported from the same files.
- `insertSignal` / `insertTag` / `insertSignalTag` exist in `server/database/queries/{signal,tag,signal-tag}.ts`, each accepting `(insertable, client: DbClient = db)`, validating via `safeParse`, and returning the inserted row from `.returning()` (or throwing on an empty result).
- `DbClient` is declared exactly once in `server/database/index.ts` and imported by every query helper.
- The three inserts run inside a single `db.transaction(async (tx) => …)` in `trigger/refinery-agent.ts`, with `tx` passed to each helper.
- `pnpm lint`, `pnpm typecheck`, and `pnpm build` all pass.
- The Trigger.dev job output includes `persisted: { insertedSignal, insertedTags, insertedSignalTags }` for manual verification.
