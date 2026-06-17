# Architecture Context

## Stack

| Layer           | Technology                          | Role                                                                                                                                                    |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Nuxt.js 4 + TypeScript              | Full-stack app with client/server boundaries.                                                                                                           |
| UI              | TailwindCSS + NuxtUI                | Component composition and styling.                                                                                                                      |
| Auth            | @nuxtjs/supabase + Supabase Auth    | Google & GitHub OAuth. Provides `useSupabaseUser()` / `useSupabaseClient()` on the client and `serverSupabaseClient()` / `serverSupabaseUser()` on the server. No custom user or profile table needed. |
| Database        | Drizzle ORM + Supabase (PostgreSQL) | Type-safe data operations via Drizzle. Connects directly with the service role key — bypasses Supabase RLS entirely. All access control is enforced in the Nitro server layer. |
| Storage         | Supabase Storage                    | Stores mirrored news preview images. Third-party CDN URLs (e.g. Yahoo) are never stored in the DB.                                                     |
| State Management | Pinia (`@pinia/nuxt`)              | Client-side reactive state (feed items, detail, category). Stores are mounted in the `[[category]].vue` parent route and persist for the entire browser session — the parent never unmounts during detail open/close, so feed state survives without KeepAlive. |
| AI Pipeline     | Trigger.dev + OpenRouter            | Trigger.dev: long-running background jobs (de-noising, translation, tagging, media mirroring, DB persistence). OpenRouter: LLM access (e.g. Gemma 9B). |
| Scheduler       | Trigger.dev Scheduled Tasks          | RSS ingestion at 01:00, 09:00, and 17:00 ET daily. Monthly data purge (Nitro task) on the 1st of each month. Lightweight I/O only — all heavy work is delegated to Trigger.dev. |
| Package Manager | pnpm                                | Package manager for the project.                                                                                                                        |

> **Cross-boundary alias bridging**: Nuxt's `#shared` alias is a Nuxt-time path mapping, but the trigger bundler (esbuild, run by the trigger.dev CLI) has no knowledge of it. Files under `server/database/*` use `#shared/...` imports (e.g. `findSignals`), so when the trigger bundle follows that import chain, esbuild cannot resolve the alias. A tiny custom esbuild plugin registered through the `build.extensions` API in `trigger.config.ts` translates `#shared[/...]` to the absolute `<root>/shared[/...].ts` path at resolve time. The plugin mirrors the Nuxt alias — any new shared alias added to `nuxt.config.ts` must be mirrored here. See the "Cross-boundary alias bridging" decision in `progress-tracker.md`.

## Directory Structure (Nuxt)

```
/
├── app/                        # Client-side (Nuxt app/ directory)
│   ├── components/
│   │   ├── signal/             # Signal feed + detail components
│   │   │   ├── signal-card.vue
│   │   │   ├── signal-feed.vue
│   │   │   ├── signal-detail.vue            # Pure rendering (no chrome)
│   │   │   └── signal-detail-overlay.vue    # USlideover (desktop) / UDrawer (mobile)
│   │   └── app/                # Reusable app-wide components (buttons, inputs, etc.)
│   ├── composables/            # Client-side Vue composables
│   ├── layouts/
│   ├── pages/
│   │   ├── login.vue           # /login
│   │   ├── confirm.vue         # /confirm
│   │   ├── [[category]].vue    # Feed parent route (hosts overlay)
│   │   └── signal/
│   │       └── [slug].vue      # SSR detail page for crawlers / direct links
│   └── assets/
│       └── css/
│           └── main.css        # OKLCH tokens, Tailwind config
├── server/                     # Nitro backend
│   ├── api/
│   │   └── signals/            # GET /api/signals, GET /api/signals/[slug], GET /api/signals/search
│   ├── middleware/             # Auth session middleware
│   ├── utils/                  # Server-only helpers
│   └── database/
│       ├── index.ts            # Drizzle client (service role connection)
│       ├── schema/             # Drizzle table definitions (one file per table)
│       ├── migrations/         # Drizzle generated migrations
│       └── queries/            # Drizzle query helpers
├── trigger/                    # Trigger.dev background jobs + scheduled tasks
│   ├── rss-ingestion.ts        # Scheduled RSS fetch + dedup + hand-off (01:00, 09:00, 17:00 ET)
│   ├── refinery-agent.ts       # AI de-noise + translate + tag + media mirror + persist
│   └── utils/                  # Trigger-only helpers (no Nuxt/Nitro dependencies)
├── shared/                     # Code shared between app/ and server/
│   ├── types/                  # TypeScript interfaces (signal.ts, tag.ts, etc.)
│   ├── constants/              # Shared constants (categories, limits, etc.)
│   ├── env.ts                  # Global environment variable definitions with validation
│   └── validators/             # Zod schemas
├── public/
└── nuxt.config.ts
```

> **Note on `[[category]]` route file**: The optional dynamic segment `[[category]]` in `app/pages/[[category]].vue` is the parent route that hosts the feed and the signal detail overlay. There is **no** `app/pages/index.vue` — the parent optional route replaces it. The overlay (`signal-detail-overlay.vue`) is a sibling component rendered by the parent, not a child route.

## System Boundaries

- `app/` — Presentation Layer: Client-side Vue pages, components, and composables. Uses `useSupabaseUser()` for auth state. Never accesses the DB directly.
- `shared/` — Types, constants, env config, and Zod validators safe to import from both client and server.
- `shared/validators/` — Zod schemas used at all API and pipeline boundaries.
- `server/` — Nitro layer: API routes, scheduled tasks, auth middleware. Sole owner of data access logic. Uses `serverSupabaseUser()` to verify sessions; uses Drizzle for all DB reads/writes.
- `server/database/` — DB client and Drizzle schema. Imported only by `server/` and `trigger/` — never by `app/`.
- `trigger/` — Intelligence Refinery: off-main-thread jobs. Handles all AI processing and DB writes for the pipeline. Never called from `app/`.

## Auth Model

- **Client**: `useSupabaseUser()` exposes the current user. Avatar and display name are read from `user.user_metadata` (populated by OAuth provider). No custom profile table exists.
- **Server**: Every API route calls `serverSupabaseUser(event)` to retrieve the authenticated user. Unauthenticated requests are rejected with 401 before any DB access.
- **No RLS**: Drizzle uses the Postgres service role key and bypasses RLS entirely. The Nitro server layer is solely responsible for enforcing access control.

## Routing & URL Model

The Signal Feed uses a **query-based overlay** pattern. The feed layout is the parent route (`app/pages/[[category]].vue`) and the signal detail is a sibling overlay component (`signal-detail-overlay.vue`) rendered conditionally when a `?signal=slug` query param is present. The parent component mounts exactly once per browser session and is never unmounted during detail open/close — this preserves feed state (items, scroll position, current category) without needing `<KeepAlive>`.

A separate SSR page at `/signal/[slug]` serves crawlers and direct links.

The URL is always updated to reflect the open signal so that shared links work correctly.

| Scenario | URL | Behaviour |
| --- | --- | --- |
| Feed (no filter) | `/` | Parent route only. `route.params.category` is `undefined`. Three-column feed (desktop), two-column (tablet), single-column (mobile). No overlay. |
| Feed (filtered) | `/{category}` | Parent route with `route.params.category = '{category}'`. Validated against the category enum. Feed filtered to that category. No overlay. |
| Signal open (from feed) | `/?signal={slug}` or `/{category}?signal={slug}` | URL updated via `router.push`. Parent reads `route.query.signal` and renders `<SignalDetailOverlay :slug="slug" />`. Overlay opens as USlideover (desktop ≥1024px) or UDrawer (mobile <1024px). Parent stays mounted — no feed refetch. |
| Direct nav to signal | `/signal/{slug}` | SSR renders the standalone detail page. Full content visible on first paint. Close button navigates to `/`. |
| User shares `?signal={slug}` URL | `/?signal={slug}` or `/{category}?signal={slug}` | Recipient lands on the same view: feed in background, signal detail overlay open. |
| Closing detail | — | `router.push` removing the `?signal` query param (e.g. `router.push({ query: { signal: undefined } })`). Overlay closes. Parent stays mounted. Feed state, scroll position, and category are all preserved. **No refetch occurs.** |

### URL Construction Rules

- **Open from feed**: `router.push({ query: { ...route.query, signal: slug } })` — preserves existing query params (e.g. category filter).
- **Close detail**: `router.push({ query: { signal: undefined } })` — removes the signal query param, creates a history entry so browser back/forward works.
- **Never use `router.replace`** — it removes the previous history entry and breaks browser back navigation. Both open and close must use `router.push`.
- The overlay is triggered by `route.query.signal` being a non-empty string. The parent reads this and passes it as a prop to `<SignalDetailOverlay>`.

### Canonical URL

- The **canonical share URL** for a signal is the SSR page: `/signal/{slug}`, e.g. `/signal/bitcoin-etf-20261105`.
- When the recipient opens the canonical URL, they see the full detail page (SSR-rendered). The feed is not shown.
- Query-based URLs (`/?signal={slug}` or `/{category}?signal={slug}`) are valid for in-app navigation and sharing, but the SSR page is the canonical form for crawlers.

## Storage Model

- **Database (PostgreSQL)**:
  - `signal` — bilingual article content, AI-generated summary, source metadata, slug, image URL reference.
  - `tag` — normalised entity tag registry.
  - `signal_tag` — junction table linking signals to their tags (max 3 per signal).
  - No user-specific tables exist.
- **Supabase Storage**:
  - Images are downloaded during pipeline execution and re-hosted here.
  - Only the Supabase public URL is stored in `signal.image_url`.

### Cursor Pagination Indexes

The feed uses **cursor-based pagination** (encoded as `base64({publishedAt}|{id})`) for infinite scroll. To make cursor queries `O(log n)` at any depth, the following indexes are required:

- **Composite index** on `(published_at DESC, id DESC)` — supports the `WHERE (published_at, id) < (?, ?)` lookup that anchors each page after the first.
- **Per-category partial indexes** on the same composite — accelerate filtered queries without paying the cost of scanning unrelated categories.

Schema details live in `context/database-schema.md` (see the "Cursor Pagination" section).

## AI Pre-generation Workflow (The "Refinery" Pipeline)

### Stage 1 — Trigger.dev Scheduled Task (01:00, 09:00, 17:00 ET)

1. **RSS Ingestion**: Fetch Yahoo News RSS (`finance`, `tech`, `world`).
2. **Deduplication**: Use `guid` from RSS metadata. Query DB — skip existing guids.
3. **Trigger Refinery**: Directly call the refinery pipeline for each new article.

### Stage 2 — Trigger.dev Background Job (per article)

4. **Article Extraction**: `@extractus/article-extractor` per URL. Quality gate: skip if extracted text < 200 characters.
5. **Single LLM Call (OpenRouter)**: One prompt performs: de-noising, Traditional Chinese translation, entity tag extraction (max 3), 3-point summary. Output: validated JSON via Zod.
6. **Slug Generation**: Slugify `title_en` + append `YYYYMMDD` from `published_at`. If collision exists in DB, append `-2`, `-3`, etc.
7. **Image Mirroring**: Download image → re-encode as WebP via `sharp` (quality 80, capped at 1280 px width; falls back to quality 65 if the result still exceeds a 95 KB soft target) → upload to Supabase Storage → obtain public URL. If `sharp` throws (unrecognised format, etc.), the original bytes are uploaded unchanged.
8. **Persistence**: Write `signal` row + upsert `tag` rows + write `signal_tag` rows.

### Stage 3 — Nitro Scheduled Task (1st of each month)

9. **Purge**: Delete `signal` rows where `published_at < NOW() - INTERVAL '3 months'`. Cascade removes `signal_tag` rows. Orphaned `tag` rows are cleaned up in the same job.

## Error Handling

- RSS feed is unavailable → log and skip the run, do not throw.
- Article extraction fails the quality gate → discard article, continue batch.
- LLM call returns invalid JSON → Zod parse fails, log `pipeline_run_id`, discard article.
- Slug collision after 10 retries → log and discard article.
- Media mirroring fails → persist signal with `image_url: null`, do not abort.
- DB persistence fails → log error with `pipeline_run_id`, do not retry automatically.

## Invariants

1. **Non-Blocking Nitro**: Long-running AI tasks and media uploads must never run on the main Nitro thread — always delegate to `trigger/`.
2. **Unique Fact Rule**: `guid` deduplication must occur before any AI call is made.
3. **No Third-Party CDN URLs**: Images must always be mirrored to Supabase Storage. Yahoo CDN URLs must never be stored in the DB.
4. **Single LLM Call per Article**: De-noising, translation, tag extraction, and summary must be batched into one OpenRouter request.
5. **No User-Specific Storage**: No profile, saved signals, tracked tags, or email digest tables exist. User identity is provided entirely by `@nuxtjs/supabase`.
6. **Server-Enforced Access Control**: Because RLS is disabled, every Nitro API route must verify session via `serverSupabaseUser()` before executing any DB query.
7. **Slug as URL Identifier**: Every signal must have a unique slug before persistence. Public-facing URLs use the query-based pattern `?signal={slug}` for in-app navigation. The canonical share URL is the SSR page `/signal/{slug}`. API endpoints that take a single resource identifier use `slug`, never `id`. The query param approach avoids ambiguous route matching that the nested-route pattern had with Nuxt 4's optional-dynamic `[[category]]` segment.
8. **Design Compliance**: All UI components must use the OKLCH tokens and spacing conventions in `ui-context.md`.
9. **Parent Route Mount Persistence**: The `[[category]].vue` parent route is mounted exactly once per browser session. It hosts both the feed and the signal detail overlay (a sibling component, not a child route). Feed state, scroll position, and current category are preserved across detail open/close without `<KeepAlive>` — this is a framework guarantee, not a workaround. Any code that depends on the parent component being always present may rely on this invariant.