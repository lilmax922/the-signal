# Code Standards

## General

- Single responsibility: Each source file should have a clear, focused scope/purpose.
- Split large files: Break files when they become large or handle too many concerns.
- Type separation: Always separate types and interfaces into `shared/types/*.ts`.
- Constants extraction: Move constants to `shared/constants/*.ts`.
- Fix root causes, do not layer workarounds.

## Naming Conventions

| Scope                             | Convention   | Examples                                      |
| --------------------------------- | ------------ | --------------------------------------------- |
| DB table names                    | singular     | `signal`, `tag`, `signal_tag`                 |
| DB column names                   | `snake_case` | `guid`, `published_at`, `image_url`           |
| TypeScript variables / functions  | `camelCase`  | `signalId`, `fetchSignals()`                  |
| TypeScript types / interfaces     | `PascalCase` | `Signal`, `SignalTag`, `LlmOutput`            |
| Files and folders                 | `kebab-case` | `signal-card.vue`, `use-signal-feed.ts`       |
| Drizzle table variables           | `camelCase`  | `signalTag` (maps to `signal_tag` table)      |
| URL paths                         | `kebab-case` | `/api/signals`, `/api/signals/[slug]`         |
| CSS custom properties             | `kebab-case` | `--color-brand-500`                           |

## TypeScript

- Strict mode is required throughout the project.
- No implicit `any` — use explicit interfaces or narrowly scoped types for all data structures.
- Declare explicit return types on all functions where the return type is not immediately obvious.
- Extract complex inline types into dedicated type or interface declarations.
- Validate and parse all unknown external input at system boundaries using Zod before trusting it. This includes: API request parameters, LLM JSON output, RSS feed payloads, and `article-extractor` results.

## Nuxt.js

- Follow the Nuxt `app/` directory structure. See https://nuxt.com/docs/4.x/directory-structure.
- `shared/` is safe to import from both `app/` and `server/`.
- `server/database/` must never be imported from `app/`.

## Authentication & Authorization

- **Client**: Use `useSupabaseUser()` for reactive auth state. Use `user.user_metadata.avatar_url` and `user.user_metadata.full_name` for display — no custom profile table exists.
- **Server**: Use `serverSupabaseUser(event)` from `@nuxtjs/supabase` at the top of every API route and scheduled task that touches data. Reject unauthenticated requests with 401 before any DB query runs.
- **No RLS**: Drizzle connects via the Postgres service role key and bypasses Row Level Security entirely. The Nitro server layer is solely responsible for all access control.

## API Routes

- Parse and validate all request input with Zod before any logic runs. Use schemas defined in `shared/validators/`.
- Verify the Supabase Auth session via `serverSupabaseUser(event)` on every route.
- Return consistent response shapes for both success and error states.
- Signal detail routes use `slug` as the URL param — never `id`.

## Routing

The Signal Feed uses a **query-based overlay** pattern. The feed layout is the parent route (`app/pages/[[category]].vue`) and the signal detail is a sibling overlay component (`signal-detail-overlay.vue`) rendered conditionally when a `?signal=slug` query param is present.

### File Structure

```
app/pages/
├── login.vue                       # /login
├── confirm.vue                     # /confirm
├── [[category]].vue                # Feed parent route (hosts overlay)
└── signal/
    └── [slug].vue                  # SSR detail page for crawlers / direct links
```

> `[[category]]` is the Nuxt optional dynamic segment. **There is no `app/pages/index.vue`** — the parent optional route replaces it. The overlay (`signal-detail-overlay.vue`) is rendered by the parent, not by a child route.

### URL Patterns

| Scenario | URL |
|---|---|
| Root feed (no filter) | `/` |
| Filtered feed | `/{category}` |
| Signal detail (in-app) | `?signal={slug}` (appended to current URL) |
| Signal detail (canonical/SSR) | `/signal/{slug}` |

### Navigation

- **Open a signal from the feed**: `router.push({ query: { ...route.query, signal: slug } })` — preserves existing query params (e.g. category filter) and adds the signal query.
- **Close the detail view**: `router.push({ query: { signal: undefined } })` — removes the signal query param, creates a history entry so browser back/forward works.
- **Never use `router.replace`** — it removes the previous history entry and breaks browser back navigation. Both open and close must use `router.push`.
- The overlay is triggered by `route.query.signal` being a non-empty string. The parent reads this and passes it as a prop to `<SignalDetailOverlay>`.

### Constraints

- The `[[category]].vue` parent component mounts **exactly once per browser session** and stays mounted for the entire session. The feed's reactive state lives in the parent. See `architecture.md` Invariant #9 ("Parent Route Mount Persistence").
- The overlay (`signal-detail-overlay.vue`) is a sibling component rendered by the parent, not a child route. It owns the full overlay lifecycle (responsive USlideover/UDrawer via `useMediaQuery`, fetch via `useAsyncData`, close via `router.push`).
- Direct navigation to `/signal/{slug}` renders the standalone SSR detail page (`app/pages/signal/[slug].vue`). This page serves crawlers and direct links — the overlay's Reka UI Teleport does not render during SSR.
- **Do not use `<KeepAlive>`** on the feed parent. The parent route already guarantees persistence. KeepAlive would be redundant.

## State Management

Client-side reactive state lives directly in the components that own it. The `[[category]].vue` parent route is the host of the feed's reactive state (items, cursor, hasMore, isLoadingMore) as local refs. The overlay owns its own fetch state via `useAsyncData`.

### Conventions

- Feed state (`items`, `cursor`, `hasMore`, `isLoadingMore`) lives as local refs in `app/pages/[[category]].vue`. The parent mounts once per browser session, so these refs persist across overlay open/close without any external store.
- The overlay (`signal-detail-overlay.vue`) owns its own fetch state via `useAsyncData` with the slug as the watch key. It is self-contained — the layout just passes the slug.
- The SSR detail page (`signal/[slug].vue`) has its own independent `useFetch` — it does not share state with the feed or overlay.
- If a future feature needs cross-route shared state (e.g. a command palette that accesses feed data from a different route), promote the parent's refs into a Pinia store at that point. Do not premature-optimize with stores.

### Reference Shapes

```ts
// app/pages/[[category]].vue — local refs
const items = ref<SignalFeed[]>([])
const cursor = ref<string | null>(null)
const hasMore = ref(false)
const isLoadingMore = ref(false)

// app/components/signal/signal-detail-overlay.vue — useAsyncData
const { data: signal, status } = await useAsyncData<Signal>(
  `signal-overlay-${slug}`,
  () => $fetch<Signal>(`/api/signals/${slug}`),
  { watch: [() => slug] },
)
```

## Styling

- Use only CSS custom property tokens defined in `app/assets/css/main.css`. No hardcoded oklch/hex values or raw Tailwind color palette classes in templates or components.
- Border radius scale: `rounded-xl` for small elements (tags, badges), `rounded-2xl` for cards and panels, `rounded-3xl` for modals and drawers.
- No green/red emotional color mapping anywhere in the UI.

## Data and Storage

- Drizzle ORM is the only way to read or write the PostgreSQL database. Never use the Supabase JS client for DB queries.
- All DB access lives in `server/` or `trigger/` — never in `app/`.
- Store only the Supabase Storage public URL in `signal.image_url`. Never store third-party CDN URLs or Base64 strings in the database.
- Do not store large generated content or binary data directly in the database.

## Zod Usage

- Define all Zod schemas in `shared/validators/`.
- Every API route input must be validated with a Zod schema before any logic runs.
- LLM JSON output must be parsed through `llmOutputSchema` before the data is trusted.
- DB insert/update payloads should be validated before being passed to Drizzle.

## File Organization

```
app/
  components/
    signal/             # Signal components (signal-card.vue, signal-feed.vue, signal-detail.vue, signal-detail-overlay.vue)
    app/                # Reusable app-wide components (buttons, inputs, etc.)
  composables/          # Client-side composables (use-*.ts)
  layouts/
  pages/
    login.vue           # /login (existing)
    confirm.vue         # /confirm (existing)
    settings.vue        # /settings (existing)
    [[category]].vue    # Feed parent route (hosts overlay)
    signal/
      [slug].vue        # SSR detail page for crawlers / direct links
  assets/css/
    main.css            # OKLCH tokens, Tailwind config

server/
  api/
    signals/
      index.get.ts      # GET /api/signals (signal list, cursor-paginated)
      [slug].get.ts     # GET /api/signals/[slug] (signal detail)
      search.get.ts     # GET /api/signals/search
  tasks/
    rss-ingest.ts       # Nitro scheduled task — 08:00 and 20:00 daily
    purge-old.ts        # Nitro scheduled task — 1st of each month
  middleware/
    auth.ts
  utils/                # Server-only helpers
  database/
    index.ts            # Drizzle client
    schema/
      {schema}.ts
      index.ts          # Re-exports all tables
    migrations/         # Drizzle generated migrations
    queries/            # Drizzle query helpers

trigger/
  refinery.ts           # AI pipeline job

shared/
  types/                # TypeScript interfaces (signal.ts, tag.ts, etc.)
  constants/            # Shared constants (categories.ts, limits.ts)
  env.ts                # Environment variable definitions with validation
  validators/           # Zod schemas (signal.ts, etc.)
```

> `app/pages/index.vue` does **not** exist. The optional dynamic parent `app/pages/[[category]].vue` replaces it. See the **Routing** section above.

## Agent Task Protocol

- Coding agents must pass all TypeScript and lint checks before completing a task.
- All code must be processed through `pnpm lint --fix` before completing a task.
- `pnpm build` must pass before marking a unit complete.