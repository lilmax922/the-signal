# Code Standards

## General

- Single responsibility: Each source file should have a clear, focused scope/purpose.
- Split large files: Break files when they become large or handle too many concerns.
- Type separation: Always separate types and interfaces into types.ts or types/*.ts.
- Constants extraction: Move constants to a dedicated constants.ts file.
- Fix root causes, do not layer workarounds.

## TypeScript

- Strict Mode: Strict mode is required throughout the project.
- No Implicit Any: Avoid `any`—use explicit interfaces or narrowly scoped types for all data structures.
- Explicit return types: Declare return types explicitly when possible.
- Avoid complex inline types: Extract complex types into dedicated type or interface declarations.
- Boundary Validation: Validate and parse unknown external input at system boundaries before trusting it.

## Nuxt.js

- Reference `nuxt` skill for best practices.

## Styling

- Token Consistency: Use CSS custom property tokens defined in `main.css`—no hardcoded oklch/hex values or raw Tailwind color classes.
- Design Compliance: Follow the exact border radius scale: rounded-xl for small elements, rounded-2xl for cards, and rounded-3xl for modals.
- Zero-Sentiment Palette: Strictly use neutral and functional accent colors as defined in the UI specification.

## API Routes

- Schema Validation: Validate and parse request input using Zod before any logic runs.
- Auth Enforcement: Enforce Supabase Auth session and RLS ownership checks before any data mutation.
- Predictable Shapes: Return consistent, predictable response shapes for both success and error states.

## Data and Storage

- Relational Metadata: Project metadata, relationships, and task run records belong in PostgreSQL via Drizzle.
- Blob Management: Large artifacts (news thumbnails/blobs) belong in Supabase Storage; store only the public URL reference in the database.
- Database Hygiene: Do not store large generated content or Base64 strings directly in the database.

## File Organization

See [Nuxt 4 Directory Structure](https://nuxt.com/docs/4.x/directory-structure) for more details.

- `app/` — Client-side Vue components, pages, and UI-state composables.
- `lib/` — Shared infrastructure: Drizzle schemas, database clients.
- `shared/` - Contains the shared code that can be used in both the Vue app and the Nitro server such as constants, types.
- `server/` — Nitro API routes and server-side middleware.
- `trigger/` — Long-running background jobs: RSS scraping, AI de-noising, and translation

## Agent Task Protocol

- Error-Free Delivery: Coding agents must pass all TypeScript and Lint checks before completing a task.
- Automated Formatting: All code must be processed through `pnpm lint --fix` before completing a task.
