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
| DB column names                   | `snake_case` | `hash`, `published_at`, `image_url`           |
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

- Follow the Nuxt 4 `app/` directory structure. See https://nuxt.com/docs/4.x/directory-structure.
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

- Signal detail is rendered at `/signal/[slug]`.
- Opening a signal from the feed uses `router.push('/signal/[slug]')` — no full page reload.
- Closing the detail view uses `router.push('/')` — no full page reload.
- `app/pages/signal/[slug].vue` detects viewport size on mount and opens either the bottom drawer (mobile) or the Right-Side Pane (desktop).
- Direct navigation to `/signal/[slug]` (e.g. from a shared link) must render the feed in the background with the signal detail open immediately.

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
    signal/         # Signal feed components (signal-card.vue, signal-feed.vue, etc.)
    app/            # Reusable app-wide components (buttons, inputs, etc.)
  composables/      # Client-side composables (use-*.ts)
  layouts/
  pages/
    index.vue           # Feed page (/)
    signal/
      [slug].vue        # Signal detail page (/signal/[slug])
  assets/css/
    main.css            # OKLCH tokens, Tailwind config

server/
  api/
    signals/
      index.get.ts      # GET /api/signals (feed list)
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

## Agent Task Protocol

- Coding agents must pass all TypeScript and lint checks before completing a task.
- All code must be processed through `pnpm lint --fix` before completing a task.
- `pnpm build` must pass before marking a unit complete.