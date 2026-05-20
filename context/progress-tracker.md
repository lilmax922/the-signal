# Progress Tracker

## Current Phase

- [x] Design system configuration

## Current Goal

- [x] Implement base layout components per `feature-specs/02-layout.md`

## Completed

- Fixed ESLint crash by restricting `vue/max-attributes-per-line` rule to `.vue` files only.
- Ran `pnpm lint --fix` to clean up the codebase.
- Configured design system & Typography:
  - Dark theme only (forced via `colorMode.preference: 'dark'`)
  - Black (#000000) as application background
  - Brand color (OKLCH-based) as primary color via `app.config.ts`
  - Default border-radius set to 0.375rem via `--ui-radius`
  - Configured bilingual `--font-sans` pairing (`Inter` and `Noto Sans TC`) and a clinical `--font-mono` stack (`JetBrains Mono`, `Fira Code`) for numeric and metadata data points.
  - Neutral palette set to 'neutral' (balanced gray)
  - Designed and documented a clinical, zero-sentiment Typography System in `context/ui-context.md` featuring standard Tailwind type-scales (`text-xs` to `text-2xl`), strict weight limits, background-color-free entity tags, and layout/tabular alignment conventions unified with the design system.
- Implemented base layout components:
  - Created `app/layouts/default.vue` as root layout
  - Created `app/components/app/header.vue` with desktop/mobile responsive views
  - Created `app/components/category-filter.vue` with horizontal scrollable categories
  - Created `app/components/mobile-bottom-navbar.vue` for mobile-only bottom navigation
  - Updated `app/app.vue` to use `NuxtLayout` wrapper
- Implemented scroll-based show/hide for desktop CategoryFilter:
  - Created `app/composables/use-scroll-collapse.ts` - generic scroll collapse composable (replaces `useHeaderScroll`)
  - Created `app/components/app/scroll-collapse-section.vue` - reusable wrapper for scroll-based show/hide sections
  - Updated `app/layouts/default.vue` to place CategoryFilter at top of main content on desktop
  - CategoryFilter on desktop shows/hides based on scroll direction (scroll down = hide, scroll up = show).
  - Resolved desktop layout bug where CategoryFilter was obscured by the fixed AppHeader: Added `lg:pt-16` to the layout root container as a header spacer, shifted CategoryFilter to `sticky top-16 z-40 bg-black/80 backdrop-blur-md` to align it beneath the header with a frosted glass backdrop, and removed redundant `lg:pt-16` padding from `<main>` to maintain proper document flow and smooth transitions when collapsed.

## In Progress

- None.

## Next Up

- Begin core feature implementation according to `project-overview.md`.

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
