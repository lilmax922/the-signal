# Objective

Implement the read-side Nitro API endpoints that power The Signal's master-detail UI: a cursor-paginated feed list (with an optional `?category=` filter) and a slug-based detail endpoint. Both routes are auth-gated, return Zod-validated JSON, and use the Drizzle relational query API to load `signal` rows together with their tags in a single round-trip. This spec deliberately excludes `GET /api/signals/search` (deferred to a future unit).

# Implementation

## Step 1 - Signal Feed API (`GET /api/signals`)

### Foundation (prerequisites — must land first)

- **Zod validators** in `shared/validators/signal.ts`. Add and export the following, each accompanied by an inferred `z.infer` type:
  - `signalSchema` — full signal shape (bilingual titles, bilingual content, 3-item `summaryEn` / `summaryZh`, `tags` array). Mirrors the DB row that the relational query returns.
  - `signalQuerySchema` — request query params: optional `category` (against the existing `categorySchema`), optional `cursor` (opaque `base64` string), optional `limit` coerced to int and clamped via the new limits constants.
  - `signalFeedSchema` — the lightweight card shape consumed by the feed list (drop bilingual `contentEn` / `contentZh`; keep bilingual titles, 3-item `summaryZh`, `imageUrl`, `category`, `publishedAt`, and a max-3 `tags` array of `{ id, name }`).
  - `feedResponseSchema` — envelope: `{ items: signalFeedSchema[], nextCursor: string | null, hasMore: boolean }`.
  - Rename the existing `CategorySchema` to `categorySchema` (camelCase) to align with the rest of the Zod validators and `code-standards.md`. Update every consumer in the repo to match.
- **Limits constants** in `shared/constants/limits.ts`. Export `FEED_PAGE_SIZE = 10` (default page size) and `FEED_PAGE_SIZE_MAX = 50` (hard cap, also referenced by `signalQuerySchema`). Keep the file minimal — just the two constants and a short comment block.
- **Drizzle `relations()` definitions** in the three table files so the relational query API can join `signal → signal_tag → tag` in a single round-trip:
  - `signalRelations({ tags: many(signalTag) })` in `server/database/schema/signal.ts`.
  - `tagRelations({ signals: many(signalTag) })` in `server/database/schema/tag.ts`.
  - `signalTagRelations({ signal: one(signal, …), tag: one(tag, …) })` in `server/database/schema/signal-tag.ts` — both sides use the `fields` / `references` form so the FKs are unambiguous.

### Feed query helper

- Add `findSignals` to `server/database/queries/signal.ts`. Signature: `findSignals({ category?, cursor?, limit }: { category?: Category, cursor?: string, limit: number })`.
- Decode the incoming `cursor` by base64-decoding to `"{publishedAt-iso}|{id-uuid}"`, splitting on `|`, and parsing the two halves. A malformed cursor must throw an explicit error (it is a wire-format contract violation, not a "no rows" case).
- Build the query with `db.query.signal.findMany({ with: { tags: { with: { tag: true } } }, where, orderBy, limit: limit + 1 })` — fetch one extra row so the function can detect `hasMore` without a second `COUNT(*)`.
- When `category` is provided, add the equality predicate to the cursor anchor so the per-category partial index is hit.
- After the rows come back, slice to `limit`, take the last remaining row to compute `nextCursor = base64({publishedAt.toISOString()}|{id})` only when `hasMore` is true, and map every row's `tags[].tag` into the lightweight `{ id, name }` shape used by `signalFeedSchema`. Sort tags by `name` (or by an existing deterministic column) to keep the response stable across requests.
- Validate the final return value with `feedResponseSchema.safeParse(...)` before returning — defence-in-depth so the relational query never silently drifts from the API contract.

### Route handler

- File: `server/api/signals/index.get.ts`. Export `default defineEventHandler(async (event) => { … })`.
- Verify the Supabase session with `serverSupabaseUser(event)` first; throw `createError({ statusCode: 401 })` if missing — DB access never happens before auth succeeds.
- Read query via `getQuery(event)`, validate with `signalQuerySchema.safeParse`, and on failure throw `createError({ statusCode: 400, statusMessage: 'invalid query' })`.
- Call `findSignals(parsed.data)` and return the validated response envelope.
- Wrap unexpected DB / decode failures in `createError({ statusCode: 500 })` so a server-side fault never leaks the raw stack to the client.

## Step 2 - Signal Detail API (`GET /api/signals/[slug]`)

### Detail query helper

- Add `findSignalBySlug` to `server/database/queries/signal.ts`. Signature: `findSignalBySlug(slug: string)`.
- Use `db.query.signal.findFirst({ where: eq(signal.slug, slug), with: { tags: { with: { tag: true } } } })`. Return `null` when no row matches — the route handler decides between 200 and 404.
- Map the joined `tags[].tag` rows into the full `{ id, name }` shape used by `signalSchema`. Do not validate with Zod here — the route does that after deciding the status code.

### Route handler

- File: `server/api/signals/[slug].get.ts`. Export `default defineEventHandler(async (event) => { … })`.
- Auth check via `serverSupabaseUser(event)` first; 401 on missing session, identical to the feed route.
- Read the param via `getRouterParam(event, 'slug')`. Reject falsy or empty values with `createError({ statusCode: 400 })` — the Nuxt router guarantees the param shape, but the API boundary is not allowed to trust it blindly.
- Call `findSignalBySlug(slug)`. If `null`, throw `createError({ statusCode: 404, statusMessage: 'signal not found' })`. Otherwise validate the result with `signalSchema.safeParse(...)` and return the parsed data; a parse failure here means a data drift between DB and contract, and should bubble up as a 500 with the parse error attached for server-side observability.

# Out of Scope

- `GET /api/signals/search` — explicitly deferred. The route file, the `signalSearchSchema` validator, and any related query helpers are not part of this unit.
- `[[category]].vue` parent route and `[slug].vue` child route (the consumer-side wiring). Treated as a separate consumer-side spec.
- The Pinia stores (`useSignalFeedStore`, `useSignalDetailStore`) that consume these endpoints.
- Slug-collision retries (`-2`, `-3`, …) inside the API. The detail endpoint returns 404 for unknown slugs, including the (currently impossible post-dedup) case of a slug that the refinery never persisted.
- Server-side caching, rate limiting, or response compression. Not required at current scale and intentionally not in scope.
- Cursor-based pagination on any field other than `(published_at, id)` (e.g. `created_at`). The cursor format is locked to the existing composite.

# Check When Done

- `shared/validators/signal.ts` exports `categorySchema` (renamed), `signalSchema`, `signalQuerySchema`, `signalFeedSchema`, `feedResponseSchema`, plus their inferred `z.infer` types.
- `shared/constants/limits.ts` exports `FEED_PAGE_SIZE = 10` and `FEED_PAGE_SIZE_MAX = 50`, and `signalQuerySchema` references both.
- Each of the three table files (`server/database/schema/{signal,tag,signal-tag}.ts`) has a `relations()` definition that lets `db.query.signal.findMany({ with: { tags: { with: { tag: true } } } })` resolve in one round-trip.
- `server/database/queries/signal.ts` exports `findSignals({ category?, cursor?, limit })` and `findSignalBySlug(slug)`. `findSignals` returns `{ items, nextCursor, hasMore }` and `findSignalBySlug` returns either the full signal with its tags or `null`.
- `server/api/signals/index.get.ts` returns the feed envelope validated by `feedResponseSchema`. An unauthenticated request returns 401; a malformed `cursor` returns 400; an unknown `category` returns 400 (via Zod).
- `server/api/signals/[slug].get.ts` returns the full signal validated by `signalSchema`, or 404 when the slug does not exist. Auth and param checks happen before any DB call.
- A manual `pnpm dev` smoke test: `curl` both endpoints with a valid session cookie and confirm the response shapes match the Zod schemas. Repeat with an invalid `cursor` / unknown `slug` to confirm 400 / 404 paths.
- `pnpm lint`, `pnpm typecheck`, and `pnpm build` all pass.
