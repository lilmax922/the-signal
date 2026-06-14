# Objective

Implement Search API and wire it with the command palette using asynchronous fetching. Ensure all database indexes are defined via TypeScript code-first schema and migrations are generated via Drizzle Kit.

## Step 1 — DB Query Helper

**File**: `server/database/queries/signal.ts`

Add `searchSignals({ q, limit }): Promise<SignalFeed[]>`.

- LEFT JOIN signal_tag → LEFT JOIN tag
- WHERE with or() across:
  - signal.titleZh ILIKE `%q%`
  - signal.titleEn ILIKE `%q%`
  - tag.name ILIKE `%q%`
  - sql`array_to_string(${signal.summaryZh}, ' ')` ILIKE `%q%`
  - sql`array_to_string(${signal.summaryEn}, ' ')` ILIKE `%q%`
- GROUP BY signal.id, orderBy publishedAt DESC, limit
- tags aggregated via json_agg(...) FILTER (WHERE tag.id IS NOT NULL)
- Parse json_agg result with tagSchema.array().safeParse(), fallback to []
- Normalise publishedAt to ISO string
- Return type: Promise<SignalFeed[]>

## Step 2 — Search API

**File**: `server/api/signals/search.get.ts` (new)

`GET /api/signals/search?q=spacex&limit=15`

- Validate query via `signalSearchSchema`
- Graceful Empty Query: If `q` is empty or only whitespace, immediately return [] with a `200 OK` status (do not return `400`, as it breaks the UX when users clear the Command Palette input).
- Call `searchSignals({ q, limit })`.
- Validate and parse response rows via `signalFeedSchema.array()`.
- Return `SignalFeed[]`.

## Step 3 — Wire Search API with Command Palette Component

**File**: `app/components/search-command-palette.vue` (modify)

Refactor the component to remove mock data and implement live async fetching based on Nuxt UI `UCommandPalette` specs:
- Add `immediate: false` to `useLazyFetch` to only fetch data when the Modal opens.
- The loading state checks for both `pending` and `idle` status to display a loading indicator before and during the fetch.
- Use `refDebounced` to debounce the API calls.
- Transform search result into the reactive `:groups` object structure categorized by `category`.

Reference: https://ui.nuxt.com/docs/components/command-palette#with-fetched-items

## Step 4 — GIN Index Schema Definition

1. Add GIN trigram index definitions to signal.ts and tag.ts schema files.
2. Run pnpm db:generate — Drizzle auto-generates the CREATE INDEX ... USING gin SQL.
3. Manually prepend `CREATE EXTENSION IF NOT EXISTS pg_trgm;` to the generated migration file.

Define the extension and indexes directly in the `server/database/schema/{signal, tag}.ts`.

- Signal:
  - index('idx_signal_title_zh_trgm').using('gin', sql`${t.titleZh} gin_trgm_ops`)
  - index('idx_signal_title_en_trgm').using('gin', sql`${t.titleEn} gin_trgm_ops`)
- Tag:
  - index('idx_tag_name_trgm').using('gin', sql`${t.name} gin_trgm_ops`)

## Out of Scope

- Full-text search (`tsvector` / `plainto_tsquery`) — `ILIKE` + GIN trigram is sufficient.
- Search history / recent searches.
- Category-scoped search filter tabs.
- Automatic migration execution.

## Check When Done

- Running `pnpm db:generate` successfully produces a new SQL migration file containing CREATE EXTENSION "pg_trgm" and the USING gin index statements
- Running pnpm db:migrate (executed manually by the developer) applies the GIN indexes without errors.
- `GET /api/signals/search?q=spacex` returns deduplicated results in order of `publishedAt DESC`.
- Same article never appears twice when title AND tag both match.
- The `SearchCommandPalette` loading indicator shows during fetch.
- Clearing the command palette search input clears the results gracefully without console errors or 400 bad requests.
