# Code Standards

## General

- Single responsibility: Each source file should have a clear, focused scope/purpose.
- Split large files: Break files when they become large or handle too many concerns.
- Type separation: Always separate types and interfaces into `shared/types/*.ts`.
- Constants extraction: Move constants to `shared/constants/*.ts`.
- Fix root causes, do not layer workarounds.

## Naming Conventions

| Scope                        | Convention   | Examples                                 |
| ---------------------------- | ------------ | ---------------------------------------- |
| DB table names               | singular     | `signal`, `tag`, `signal_tag`            |
| DB column names              | `snake_case` | `fact_hash`, `published_at`              |
| TypeScript variables / functions | `camelCase`  | `signalId`, `fetchSignals()`             |
| TypeScript types / interfaces | `PascalCase` | `Signal`, `SignalTag`, `LlmOutput`       |
| Files and folders            | `kebab-case` | `signal-card.vue`, `use-signal-feed.ts`  |
| Drizzle table variables      | `camelCase`  | `signalTag` (maps to `signal_tag` table) |
| URL paths                    | `kebab-case` | `/api/signals`, `/api/signals/[id]`      |
| CSS custom properties        | `kebab-case` | `--color-brand-500`                      |

## TypeScript

- Strict mode is required throughout the project.
- No implicit `any` — use explicit interfaces or narrowly scoped types for all data structures.
- Declare explicit return types on all functions where the return type is not immediately obvious.
- Extract complex inline types into dedicated type or interface declarations.
- Validate and parse all unknown external input at system boundaries using Zod before trusting it. This includes: API request parameters, LLM JSON output, RSS feed payloads, and `article-extractor` results.

## Nuxt.js

- Follow the Nuxt 4 `app/` directory structure. See https://nuxt.com/docs/4.x/directory-structure.
- `shared/` is safe to import from both `app/` and `server/`.

## Authentication & Authorization

- **Client**: Use `useSupabaseUser()` for reactive auth state. Use `user.user_metadata.avatar_url` and `user.user_metadata.full_name` for display — no custom profile table exists.
- **Server**: Use `serverSupabaseUser(event)` from `@nuxtjs/supabase` at the top of every API route and scheduled task that touches data. Reject unauthenticated requests with 401 before any DB query runs.
- **No RLS**: Drizzle connects via the Postgres service role key and bypasses Row Level Security entirely. The Nitro server layer is solely responsible for all access control.

## API Routes

- Parse and validate all request input with Zod before any logic runs. Use schemas defined in `lib/validators/`.
- Verify the Supabase Auth session via `serverSupabaseUser(event)` on every route.
- Return consistent response shapes for both success and error states.

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

- Define all Zod schemas in `lib/validators/`.
- Every API route input must be validated with a Zod schema before any logic runs.
- LLM JSON output must be parsed through `llmOutputSchema` before the data is trusted.
- DB insert/update payloads should be validated before being passed to Drizzle.

## File Organization

```
app/
  components/
    signal/       # Signal feed components (signal-card.vue, signal-feed.vue, etc.)
  app/            # Reusable app-wide components (buttons, inputs, etc.)
  composables/    # Client-side composables (use-*.ts)
  layouts/
  pages/
  assets/css/     # main.css — OKLCH tokens

server/
  api/
    signals/      # index.get.ts, [id].get.ts, search.get.ts
  tasks/          # rss-ingest.ts, purge-old.ts
  middleware/     # auth.ts
  utils/          # server-only helpers

trigger/
  refinery.ts     # AI pipeline job

lib/
  db/
    index.ts      # Drizzle client
    schema/       # Table definitions
    migrations/   # Drizzle migrations
    queries/      # Drizzle queries
  validators/     # Zod schemas (signal.ts, etc.)

shared/
  types/          # TypeScript interfaces
  constants/      # Shared constants (categories.ts, limits.ts)
```

## Agent Task Protocol

- Coding agents must pass all TypeScript and lint checks before completing a task.
- All code must be processed through `pnpm lint --fix` before completing a task.
- `pnpm build` must pass before marking a unit complete.