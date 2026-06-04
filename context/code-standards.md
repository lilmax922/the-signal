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

The Signal Feed uses Nuxt **nested routes** to implement the master-detail pattern. The feed layout is the **parent route** (`app/pages/[[category]].vue`) and the signal detail is a **child route** (`app/pages/[[category]]/[slug].vue`) rendered inside the parent's `<NuxtPage />` slot.

### File Structure

```
app/pages/
├── login.vue                       # /login
├── confirm.vue                     # /confirm
└── [[category]]/
    ├── [slug].vue                  # Child route: detail modal
    └── (parent handled by app/pages/[[category]].vue file)
```

> `[[category]]` is the Nuxt optional dynamic segment. **There is no `app/pages/index.vue`** — the parent optional route replaces it. A `[[category]]/` directory may or may not exist alongside the file; both layouts are equivalent in Nuxt.

### URL Patterns

| Scenario | URL |
|---|---|
| Root feed (no filter) | `/` |
| Filtered feed | `/{category}` |
| Signal detail | `/{category?}/{slug}` |

### Navigation

- **Open a signal from the feed**: `router.push(\`/\${category ?? ''}\${category ? '/' : ''}\${slug}\`)` — preserves the current category in the URL when present.
- **Close the detail view**: `router.push(\`/\${category ?? ''}\`)` (or `router.push('/')` if there is no category).
- **Never use `router.replace`** — it removes the previous history entry and breaks browser back navigation. Use `router.push` for both open and close.
- The optional `category` segment, if present, must be validated against the category enum (`finance | tech | world`). Invalid values render a 404.

### Constraints

- The `[[category]].vue` parent component mounts **exactly once per browser session** and stays mounted for the entire session. The feed's reactive state lives in the parent. See `architecture.md` Invariant #9 ("Parent Route Mount Persistence").
- The child `[slug].vue` is rendered in the parent's `<NuxtPage />` slot. It does not own any feed state.
- Direct navigation to `/{category?}/{slug}` must render the parent + child together. SSR must produce a page that shows the feed in the background and the detail modal on top.
- The parent template conditionally renders the modal wrapper based on the presence of `route.params.slug`:
  ```vue
  <div v-if="route.params.slug" class="fixed inset-0 z-50 ..." @click.self="closeDetail">
    <NuxtPage />
  </div>
  ```
- **Do not use `<KeepAlive>`** on the feed parent. The nested route pattern already guarantees the parent stays mounted. KeepAlive would be redundant and may cause subtle issues with the `<NuxtPage />` slot.

## State Management

Use Pinia stores for client-side reactive state that needs to outlive a single page component. `@pinia/nuxt` auto-imports stores from `app/stores/`.

### Conventions

- Store files live in `app/stores/` and use the `use*Store` naming pattern: `useSignalFeedStore`, `useSignalDetailStore`.
- Each store defines its own state, getters, and actions. Components access state via `storeToRefs(store)` to preserve reactivity.
- **The `[[category]].vue` parent route is the host of the feed store instance.** The store is created on first mount and persists for the session because the parent never unmounts.
- The detail store is owned by the child `[slug].vue` route, but it reads its data independently of the feed (the child composable fetches `GET /api/signals/[slug]` rather than looking up the feed store).

### Reference Shapes

```ts
// app/stores/use-signal-feed-store.ts
useSignalFeedStore: {
  state:   { items, cursor, isLoading, isLoadingMore, hasMore, error, category }
  actions: { loadMore(), reset(), setCategory(c) }
}

// app/stores/use-signal-detail-store.ts
useSignalDetailStore: {
  state:   { signal, isLoading, notFound, error }
  actions: { loadBySlug(slug), clear() }
}
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
    signal/             # Signal components (signal-card.vue, signal-feed.vue, etc.)
    app/                # Reusable app-wide components (buttons, inputs, etc.)
  composables/          # Client-side composables (use-*.ts)
  stores/               # Pinia stores (use-signal-feed-store.ts, use-signal-detail-store.ts)
  layouts/
  pages/
    login.vue           # /login (existing)
    confirm.vue         # /confirm (existing)
    settings.vue        # /settings (existing)
    [[category]]/
      [slug].vue        # Child route: signal detail modal
      # (parent handled by app/pages/[[category]].vue)
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