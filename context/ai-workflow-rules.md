# AI Workflow Rules

## Approach

Build this project incrementally using a spec-driven workflow. Context files define what to build, how to build it, and the current state of progress. Always implement against these specs — do not infer or invent behavior from scratch.

## Scoping Rules

- Work on one feature unit at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in a single implementation step.

## When to Split Work

Split an implementation step if it combines:

- UI changes and background task changes
- Multiple unrelated API routes
- Behavior not clearly defined in the context files

If a change cannot be verified end to end quickly, the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files.
- If a requirement is ambiguous, resolve it in the relevant context file before implementing.
- If a requirement is missing, add it as an open question in `progress-tracker.md` before continuing.

## Reference Order for Context Files

When implementing a feature, resolve ambiguity in this priority order:

1. `architecture.md` — system boundaries and invariants are the highest authority.
2. `database-schema.md` — source of truth for all table and column names, Drizzle schema, and Zod validators.
3. `code-standards.md` — governs how all code is written (naming, validation, auth pattern, routing).
4. `ui-context.md` — governs how UI is built and styled.
5. `project-overview.md` — product intent; consult when behavior is ambiguous.

## Protected Files

Do not modify the following unless explicitly instructed:

- Any third-party library internals.
- Context files not relevant to the current implementation unit.

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes affect:

- System architecture or directory boundaries
- Storage model decisions
- Naming conventions or code standards
- Routing or URL structure
- Feature scope (in scope / out of scope)

## Key Constraints to Enforce on Every Task

- **No RLS**: every API route must call `serverSupabaseUser(event)` before any DB access.
- **No direct DB access from `app/`**: only `server/` and `trigger/` import from `server/database/`.
- **No third-party CDN URLs in DB**: images must be mirrored to Supabase Storage.
- **Zod validation at every external boundary**: API inputs, LLM outputs, RSS payloads.
- **Naming**: singular table names, `snake_case` columns, `camelCase` TS variables, `kebab-case` files.
- **Slug as URL identifier**: public-facing routes and API endpoints use `slug`, never `id`.
- **Slug uniqueness before persistence**: generate and verify slug uniqueness in Trigger.dev Stage 2 before any DB write.

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope.
2. No invariant defined in `architecture.md` was violated.
3. `progress-tracker.md` reflects the completed work.
4. No TypeScript errors, no lint errors; code formatted with ESLint via `pnpm lint --fix`.
5. `pnpm build` passes.