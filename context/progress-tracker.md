# Progress Tracker

## Current Phase

- [x] Design system configuration

## Current Goal

- [x] Configure Nuxt UI design system with dark theme, brand colors, and semantic colors

## Completed

- Fixed ESLint crash by restricting `vue/max-attributes-per-line` rule to `.vue` files only.
- Ran `pnpm lint --fix` to clean up the codebase.
- Configured design system:
  - Dark theme only (forced via `colorMode.preference: 'dark'`)
  - Black (#000000) as application background
  - Brand color (OKLCH-based) as primary color via `app.config.ts`
  - Default border-radius set to 0.375rem via `--ui-radius`
  - Inter font for English and Noto Sans TC for Traditional Chinese configured as `--font-sans`
  - Neutral palette set to 'neutral' (balanced gray)

## In Progress

- None.

## Next Up

- Begin core feature implementation according to `project-overview.md`.

## Open Questions

- None yet.

## Architecture Decisions

- **ESLint Configuration Strategy**: Use separate config objects in the flat config array to target specific file types for rules that rely on specific parsers (e.g., Vue rules). This prevents crashes when linting non-target files like Markdown.
- **Design System Configuration**: Use `app.config.ts` for color palette selection (`primary: 'brand'`, `neutral: 'neutral'`) and CSS `@theme static` block for custom color definitions with OKLCH values.

## Session Notes

- ESLint is now fully functional and passing.
- Design system is configured with brand color as primary, dark-only theme, black background, and 0.375rem border radius.
