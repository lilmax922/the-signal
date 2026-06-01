# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- [x] Design system configuration
- [x] Layout components
- [x] Auth
- [x] Drizzle ORM setup & initial migration

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


## In Progress

- None.

## Next Up

- Nitro API routes (`/api/signals`, `/api/signals/[id]`, `/api/signals/search`)
- Supabase Auth session middleware (`server/middleware/auth.ts`)

## Open Questions

- None yet.

## Architecture Decisions

- **ESLint Configuration Strategy**: Use separate config objects in the flat config array to target specific file types for rules that rely on specific parsers (e.g., Vue rules). This prevents crashes when linting non-target files like Markdown.
- **Design System Configuration**: Use `app.config.ts` for color palette selection (`primary: 'brand'`, `neutral: 'neutral'`) and CSS `@theme static` block for custom color definitions with OKLCH values.
- **Layout Component Strategy**: Desktop shows header with search and avatar dropdown; mobile header collapses on scroll with hysteresis threshold, shows search bar and category filter below title.
- **Scroll Collapse Pattern**: Created generic `useScrollCollapse` composable and `AppScrollCollapseSection` wrapper component to handle scroll-based show/hide behavior. This keeps scroll logic encapsulated and reusable. CategoryFilter remains a pure presentational component without scroll awareness.
- **Objective Minimalist Typography System**: Configured a clinical, language-agnostic typography system in `ui-context.md` pairing standard readable sans-serif fonts with a monospace stack (`JetBrains Mono` / `Fira Code`). The system uses the standard Tailwind CSS size scale (`text-xs` to `text-2xl`), restricts weights to a maximum of `600` (Semi-Bold), and forbids bold text and italics in de-noised content to preserve neutrality. Enforces tabular figures (`tabular-nums`) for column alignment and specifies background-color-free entity tags for clean typography.
- **Trigger.dev Configuration**: Uses `trigger.config.ts` with `dirs: ["./trigger"]`, node-22 runtime, and retries disabled in development. Tasks are schemaTask with Zod validation for type-safe payloads. The Nitro RSS ingestion task acts as the orchestrator, triggering the Trigger.dev refinery pipeline for article processing.

## Session Notes

- ESLint is now fully functional and passing.
- Design system is configured with brand color as primary, dark-only theme, black background, and 0.375rem border radius.
- Layout components implemented: AppHeader (desktop/mobile responsive), CategoryFilter (horizontal scroll), MobileBottomNavbar (mobile-only fixed bottom nav).
- All components use NuxtUI semantic color tokens (`border-default`, `text-highlighted`, etc.) and OKLCH brand color system.
- Typography system fully documented and unified with the design-system context using standard Tailwind default classes and background-color-free entity tags.
- Updated app to follow Typography guidelines: `--font-mono` added to main.css for monospace stack; layout components use appropriate font scales and weights per the "Objective Minimalist" design philosophy.
- Drizzle ORM fully configured with Supabase direct connection. `server/database/` is server-only (never imported from `app/`). All 3 tables created in Supabase with proper indexes, enums, and foreign keys. CamelCase → snake_case mapping handled by Drizzle's `casing: 'snake_case'` option.
- Fixed `TypeError: fetch failed` / `HeadersOverflowError` when fetching Yahoo Finance articles: `@extractus/article-extractor`'s built-in `retrieve()` uses Node's native undici fetch with a 16KB header limit, which Yahoo Finance exceeds. Solved by using `undici` directly in `shared/utils/extractor.ts` with `setGlobalDispatcher(new Agent({ maxHeaderSize: 32768 }))` to configure a 32KB header limit globally. Uses browser User-Agent headers to bypass anti-bot measures.
