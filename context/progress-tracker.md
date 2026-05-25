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
- **RSS Ingestion** (`05-rss-ingestion.md`): `shared/validators/signal.ts` — `CategorySchema` (`'finance' | 'tech' | 'world'`) and `Category` type; `shared/validators/rss.ts` — `rawRssItemSchema`, `rawRssFeedSchema`, `rssItemSchema`, `RssItem` type; `server/utils/fetch-rss.ts` — `fetchRssFeed(category: Category)` returning `Promise<RssItem[]>` with full error handling, Zod validation, and RFC822→ISO8601 date transformation


## In Progress

- None.

## Next Up

- Nitro API routes (`/api/signals`, `/api/signals/[id]`, `/api/signals/search`)
- Supabase Auth session middleware (`server/middleware/auth.ts`)
- Trigger.dev refinery pipeline (`trigger/refinery.ts`)

## Open Questions

- None yet.

## Architecture Decisions

- **ESLint Configuration Strategy**: Use separate config objects in the flat config array to target specific file types for rules that rely on specific parsers (e.g., Vue rules). This prevents crashes when linting non-target files like Markdown.
- **Design System Configuration**: Use `app.config.ts` for color palette selection (`primary: 'brand'`, `neutral: 'neutral'`) and CSS `@theme static` block for custom color definitions with OKLCH values.
- **Layout Component Strategy**: Desktop shows header with search and avatar dropdown; mobile header collapses on scroll with hysteresis threshold, shows search bar and category filter below title.
- **Scroll Collapse Pattern**: Created generic `useScrollCollapse` composable and `AppScrollCollapseSection` wrapper component to handle scroll-based show/hide behavior. This keeps scroll logic encapsulated and reusable. CategoryFilter remains a pure presentational component without scroll awareness.
- **Objective Minimalist Typography System**: Configured a clinical, language-agnostic typography system in `ui-context.md` pairing standard readable sans-serif fonts with a monospace stack (`JetBrains Mono` / `Fira Code`). The system uses the standard Tailwind CSS size scale (`text-xs` to `text-2xl`), restricts weights to a maximum of `600` (Semi-Bold), and forbids bold text and italics in de-noised content to preserve neutrality. Enforces tabular figures (`tabular-nums`) for column alignment and specifies background-color-free entity tags for clean typography.

## Session Notes

- ESLint is now fully functional and passing.
- Design system is configured with brand color as primary, dark-only theme, black background, and 0.375rem border radius.
- Layout components implemented: AppHeader (desktop/mobile responsive), CategoryFilter (horizontal scroll), MobileBottomNavbar (mobile-only fixed bottom nav).
- All components use NuxtUI semantic color tokens (`border-default`, `text-highlighted`, etc.) and OKLCH brand color system.
- Typography system fully documented and unified with the design-system context using standard Tailwind default classes and background-color-free entity tags.
- Updated app to follow Typography guidelines: `--font-mono` added to main.css for monospace stack; layout components use appropriate font scales and weights per the "Objective Minimalist" design philosophy.
- Drizzle ORM fully configured with Supabase direct connection. `server/database/` is server-only (never imported from `app/`). All 3 tables created in Supabase with proper indexes, enums, and foreign keys. CamelCase → snake_case mapping handled by Drizzle's `casing: 'snake_case'` option.
