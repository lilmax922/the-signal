# Architecture Context

## Stack

| Layer           | Technology                          | Role                                                                                                                                                    |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Nuxt.js 4 + TypeScript              | Full-stack app with client/server boundaries.                                                                                                           |
| UI              | TailwindCSS + NuxtUI                | Component composition and styling.                                                                                                                      |
| Auth            | @nuxtjs/supabase + Supabase Auth    | Google & GitHub OAuth. Provides `useSupabaseUser()` / `useSupabaseClient()` on the client and `serverSupabaseClient()` / `serverSupabaseUser()` on the server. No custom user or profile table needed. |
| Database        | Drizzle ORM + Supabase (PostgreSQL) | Type-safe data operations via Drizzle. Connects directly with the service role key — bypasses Supabase RLS entirely. All access control is enforced in the Nitro server layer. |
| Storage         | Supabase Storage                    | Stores mirrored news preview images. Third-party CDN URLs (e.g. Yahoo) are never stored in the DB.                                                     |
| AI Pipeline     | Trigger.dev + OpenRouter            | Trigger.dev: long-running background jobs (de-noising, translation, tagging, media mirroring, DB persistence). OpenRouter: LLM access (e.g. Gemma 9B). |
| Scheduler       | Nitro Scheduled Tasks               | RSS ingestion at 08:00 and 20:00 daily. Monthly data purge on the 1st of each month. Lightweight I/O only — all heavy work is delegated to Trigger.dev. |
| Package Manager | pnpm                                | Package manager for the project.                                                                                                                        |

## Directory Structure (Nuxt 4)

```
/
├── app/                        # Client-side (Nuxt 4 app/ directory)
│   ├── components/
│   │   ├── signal/             # Signal feed components
│   │   └── app/                # Reusable app-wide components (buttons, inputs, etc.)
│   ├── composables/            # Client-side Vue composables
│   ├── layouts/
│   ├── pages/
│   │   ├── index.vue           # Feed page (/)
│   │   └── signal/
│   │       └── [slug].vue      # Signal detail page (/signal/[slug])
│   └── assets/
│       └── css/
│           └── main.css        # OKLCH tokens, Tailwind config
├── server/                     # Nitro backend
│   ├── api/
│   │   └── signals/            # GET /api/signals, GET /api/signals/[slug], GET /api/signals/search
│   ├── tasks/                  # Nitro scheduled tasks
│   │   ├── rss-ingest.ts       # 08:00 and 20:00 daily
│   │   └── purge-old.ts        # 1st of each month
│   ├── middleware/             # Auth session middleware
│   ├── utils/                  # Server-only helpers
│   └── database/
│       ├── index.ts            # Drizzle client (service role connection)
│       ├── schema/             # Drizzle table definitions (one file per table)
│       ├── migrations/         # Drizzle generated migrations
│       └── queries/            # Drizzle query helpers
├── trigger/                    # Trigger.dev background jobs
│   └── refinery.ts             # AI de-noise + translate + tag + media mirror + persist
├── shared/                     # Code shared between app/ and server/
│   ├── types/                  # TypeScript interfaces (signal.ts, tag.ts, etc.)
│   ├── constants/              # Shared constants (categories, limits, etc.)
│   ├── env.ts                    # Global environment variable definitions with validation
│   └── validators/             # Zod schemas
├── public/
└── nuxt.config.ts
```

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

Signal detail content is rendered in a Drawer (mobile) or Right-Side Pane (desktop) without full page navigation. The URL is always updated to reflect the open signal so that shared links work correctly.

| Scenario | URL | Behaviour |
| --- | --- | --- |
| Feed (no signal open) | `/` | Two-column feed, no pane/drawer. |
| Signal open via feed click | `/signal/[slug]` | URL updated via `router.push` (no scroll reset). Drawer or pane opens in-place. |
| User navigates directly to `/signal/[slug]` | `/signal/[slug]` | Feed renders in background; signal detail opens immediately based on viewport size — drawer on mobile, Right-Side Pane on desktop. |
| User shares `/signal/[slug]` with another user | `/signal/[slug]` | Recipient lands on the same view: feed in background, signal detail open. |

- Routing is handled by `app/pages/signal/[slug].vue`, which detects viewport size on mount and opens the appropriate detail component.
- Closing the drawer/pane navigates back to `/` using `router.push('/')` (no full reload).
- The `slug` is the canonical identifier for client-side routing. The API route `GET /api/signals/[slug]` resolves signal detail by slug.

## Storage Model

- **Database (PostgreSQL)**:
  - `signal` — bilingual article content, AI-generated summary, source metadata, slug, image URL reference.
  - `tag` — normalised entity tag registry.
  - `signal_tag` — junction table linking signals to their tags (max 3 per signal).
  - No user-specific tables exist.
- **Supabase Storage**:
  - Images are downloaded during pipeline execution and re-hosted here.
  - Only the Supabase public URL is stored in `signal.image_url`.

## AI Pre-generation Workflow (The "Refinery" Pipeline)

### Stage 1 — Nitro Scheduled Task (08:00 and 20:00 daily)

1. **RSS Ingestion**: Fetch Yahoo News RSS (`finance`, `tech`, `world`).
2. **Deduplication**: Use `guid` from RSS metadata. Query DB — skip existing guids.
3. **Article Extraction**: `@extractus/article-extractor` per URL. Quality gate: skip if extracted text < 200 characters.
4. **Hand-off**: Trigger a Trigger.dev job with the validated article batch.

### Stage 2 — Trigger.dev Background Job (per article)

5. **Single LLM Call (OpenRouter)**: One prompt performs: de-noising, Traditional Chinese translation, entity tag extraction (max 3), 3-point summary. Output: validated JSON via Zod.
6. **Slug Generation**: Slugify `title_en` + append `YYYY-MM-DD` from `published_at`. If collision exists in DB, append `-2`, `-3`, etc.
7. **Media Mirroring**: Download image → upload to Supabase Storage → obtain public URL.
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
7. **Slug as Canonical URL Identifier**: Every signal must have a unique slug before persistence. The slug is the sole identifier used in public-facing URLs and API routes.
8. **Design Compliance**: All UI components must use the OKLCH tokens and spacing conventions in `ui-context.md`.