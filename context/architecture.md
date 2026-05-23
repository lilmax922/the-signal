# Architecture Context

## Stack

| Layer   | Technology   | Role   |
| --- | --- | --- |
| Framework       | Nuxt.js 4 + TypeScript                  | Full-stack app with client/server boundaries.                                                                                                           |
| UI              | TailwindCSS + NuxtUI                    | Component composition and styling.                                                                                                                      |
| Auth            | @nuxtjs/supabase + Supabase Auth        | Google & GitHub OAuth. Provides `useSupabaseUser()` / `useSupabaseClient()` on the client and `serverSupabaseClient()` / `serverSupabaseUser()` on the server. No custom user or profile table needed. |
| Database        | Drizzle ORM + Supabase (PostgreSQL)     | Type-safe data operations via Drizzle. Connects directly with the service role key — bypasses Supabase RLS entirely. All access control is enforced in the Nitro server layer. |
| Storage         | Supabase Storage                        | Stores mirrored news preview images. Third-party CDN URLs (e.g. Yahoo) are never stored in the DB.                                                    |
| AI Pipeline     | Trigger.dev + OpenRouter                | Trigger.dev: long-running background jobs (de-noising, translation, tagging, media mirroring, DB persistence). OpenRouter: LLM access (e.g. Gemma 9B). |
| Scheduler       | Nitro Scheduled Tasks                   | RSS ingestion at 08:00 and 20:00 daily. Monthly data purge on the 1st of each month. Lightweight I/O only — all heavy work is delegated to Trigger.dev. |
| Package Manager | pnpm                                    | Package manager for the project.|

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
│   └── assets/
│       └── css/
│           └── main.css        # OKLCH tokens, Tailwind config
├── server/                     # Nitro backend
│   ├── api/
│   │   └── signals/            # GET /api/signals, GET /api/signals/[id], GET /api/signals/search
│   ├── tasks/                  # Nitro scheduled tasks
│   │   ├── rss-ingest.ts       # 08:00 and 20:00 daily
│   │   └── purge-old.ts        # 1st of each month
│   ├── middleware/             # Auth session middleware
│   └── utils/                  # Server-only helpers
├── trigger/                    # Trigger.dev background jobs
│   └── refinery.ts             # AI de-noise + translate + tag + media mirror + persist
├── lib/                        # Shared libraries
│   ├── db/
│   │   ├── index.ts            # Drizzle client (service role connection)
│   │   └── schema/             # Drizzle table definitions
│   │   └── migrations/         # Drizzle migrations
│   │   └── queries/            # Drizzle queries
│   └── validators/             # Zod schemas
├── shared/                     # Code shared between app/ and server/
│   ├── types/                  # TypeScript interfaces (signal.ts, tag.ts, etc.)
│   └── constants/              # Shared constants (categories, limits, etc.)
├── public/
└── nuxt.config.ts
```

## System Boundaries

- `app/` — Presentation Layer: Client-side Vue pages, components, and composables. Uses `useSupabaseUser()` for auth state. Never accesses the DB directly.
- `lib/db/` — DB client and Drizzle schema. Imported only by `server/` and `trigger/` — never by `app/`.
- `lib/validators/` — Zod schemas used at all API and pipeline boundaries.
- `shared/` — Types and constants safe to import from both client and server.
- `server/` — Nitro layer: API routes, scheduled tasks, auth middleware. Sole owner of data access logic. Uses `serverSupabaseUser()` to verify sessions; uses Drizzle for all DB reads/writes.
- `trigger/` — Intelligence Refinery: off-main-thread jobs. Handles all AI processing and DB writes for the pipeline. Never called from `app/`.

## Auth Model

- **Client**: `useSupabaseUser()` exposes the current user. Avatar and display name are read from `user.user_metadata` (populated by OAuth provider). No custom profile table exists.
- **Server**: Every API route calls `serverSupabaseUser(event)` to retrieve the authenticated user. Unauthenticated requests are rejected with 401 before any DB access.
- **No RLS**: Drizzle uses the Postgres service role key and bypasses RLS entirely. The Nitro server layer is solely responsible for enforcing access control.

## Storage Model

- **Database (PostgreSQL)**:
  - `signal` — bilingual article content, AI-generated summary, source metadata, image URL reference.
  - `tag` — normalised entity tag registry.
  - `signal_tag` — junction table linking signals to their tags (max 3 per signal).
  - No user-specific tables exist.
- **Supabase Storage**:
  - Images are downloaded during pipeline execution and re-hosted here.
  - Only the Supabase public URL is stored in `signal.image_url`.

## AI Pre-generation Workflow (The "Refinery" Pipeline)

### Stage 1 — Nitro Scheduled Task (08:00 and 20:00 daily)

1. **RSS Ingestion**: Fetch Yahoo News RSS (`/news/tech`, `/news/world`, `/news/science`).
2. **Deduplication**: Compute `fact_hash` (SHA-256 of URL + title). Query DB — skip existing hashes.
3. **Article Extraction**: `@extractus/article-extractor` per URL. Quality gate: skip if extracted text < 200 characters.
4. **Hand-off**: Trigger a Trigger.dev job with the validated article batch.

### Stage 2 — Trigger.dev Background Job (per article)

5. **Single LLM Call (OpenRouter)**: One prompt performs: de-noising, Traditional Chinese translation, entity tag extraction (max 3), 3-point summary. Output: validated JSON via Zod.
6. **Media Mirroring**: Download image → upload to Supabase Storage → obtain public URL.
7. **Persistence**: Write `signal` row + upsert `tag` rows + write `signal_tag` rows.

### Stage 3 — Nitro Scheduled Task (1st of each month)

8. **Purge**: Delete `signal` rows where `published_at < NOW() - INTERVAL '3 months'`. Cascade removes `signal_tag` rows. Orphaned `tag` rows are cleaned up in the same job.

## Error Handling
- RSS feed is unavailable
- Article extraction fails the quality gate
- LLM call returns invalid JSON
- Media mirroring fails
- DB persistence fails

## Invariants

1. **Non-Blocking Nitro**: Long-running AI tasks and media uploads must never run on the main Nitro thread — always delegate to `trigger/`.
2. **Unique Fact Rule**: `fact_hash` deduplication must occur before any AI call is made.
3. **No Third-Party CDN URLs**: Images must always be mirrored to Supabase Storage. Yahoo CDN URLs must never be stored in the DB.
4. **Single LLM Call per Article**: De-noising, translation, tag extraction, and summary must be batched into one OpenRouter request.
5. **No User-Specific Storage**: No profile, saved signals, tracked tags, or email digest tables exist. User identity is provided entirely by `@nuxtjs/supabase`.
6. **Server-Enforced Access Control**: Because RLS is disabled, every Nitro API route must verify session via `serverSupabaseUser()` before executing any DB query.
7. **Design Compliance**: All UI components must use the OKLCH tokens and spacing conventions in `ui-context.md`.