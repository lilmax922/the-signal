# Architecture Context

## Stack

| Layer           | Technology                         | Role                                                                                                                                         |
| --------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Nuxt.js 4 + TypeScript             | Full-stack app with client/server boundaries.                                                                                                |
| UI              | TailwindCSS + NuxtUI               | Component composition and styling.                                                                                                           |
| Auth            | Supabase Auth                      | Handles Google & GitHub OAuth integration and manages user sessions and identity.                                                            |
| Database        | Drizzle ORM + Supabase(PostgreSQL) | Primary structured storage using Drizzle ORM for type-safe data operations (Signals, Tags, Profiles).                                       |
| Storage         | Supabase Storage                   | Stores mirrored news thumbnail images. Yahoo CDN URLs are never stored directly due to expiry and hotlink restrictions.                      |
| AI Pipeline     | Trigger.dev + OpenRouter           | Trigger.dev: Long-running background jobs (AI De-noising, Translation, Tagging, Media Mirroring, DB persistence). OpenRouter: Access to LLMs (e.g., Gemma 9B) for factual extraction. |
| Scheduler       | Nitro Scheduled Tasks              | Triggers the RSS ingestion pipeline at 08:00 and 20:00 daily. Handles lightweight I/O: RSS fetch, deduplication check, and article extraction before handing off to Trigger.dev. |
| Email           | Resend                             | Transactional email service for the "Morning Pulse" personalized digest.                                                                     |
| Package Manager | pnpm                               | Package manager for the project.                                                                                                             |

## System Boundaries

- `app/` — Presentation Layer: Client-side Nuxt 4 directory containing pages, components, and composables. Uses useState for lightweight state management.
- `lib/` — Shared Infrastructure: Drizzle schemas, database client initialization.
- `shared/` — Contains the shared code that can be used in both the Vue app and the Nitro server such as constants, types.
- `server/` — Nitro Backend: Handles API routes, server-side permission checks, 3rd-party integrations (Resend), and scheduled ingestion tasks. Follows the "Thin API" pattern.
- `trigger/` — Intelligence Refinery: Off-main-thread background refinery. Responsible for AI de-noising, fact translation, tag pre-generation, media mirroring, and DB persistence.

## Storage Model

- **Database (PostgreSQL)**:
  - Metadata: Stores bilingual signal content, AI-generated tags, and source metadata.
  - Relationships: Manages user-to-tag "Tracked Interests" and "Saved Signals" mappings.
  - Task Records: Logs Trigger.dev run states and `fact_hash` for deduplication.
- **Supabase Storage**:
  - Media Blobs: Stores mirrored image files (news thumbnails downloaded from source during pipeline execution).
  - References: Only the Supabase public URLs are stored in the PostgreSQL signals table. Original third-party CDN URLs are never persisted.

## Auth and Access Model

- Identity: Every user is identified by a unique UUID issued via Supabase Auth.
- Access Control:
  - Public: Global Fact Stream is readable by all users.
  - Private: Personal collections and interest settings are strictly isolated.
- Data Security: Implements PostgreSQL Row Level Security (RLS) to enforce data isolation at the database level.

## AI Pre-generation Workflow (The "Refinery" Pipeline)

To ensure high-speed consumption, all content is processed before reaching the user. The pipeline is split into two execution contexts:

### Stage 1 — Nitro Scheduled Task (Lightweight I/O)
Runs at **08:00 and 20:00 daily** via `nuxt.config.ts` scheduled tasks.

1. **RSS Ingestion**: Fetch Yahoo News RSS feeds (`/news/tech`, `/news/world`, `/news/science`) and collect article metadata.
2. **Deduplication**: Compute `fact_hash` from article URL + title. Query Supabase — skip any article whose hash already exists.
3. **Article Extraction**: Use `@extractus/article-extractor` to fetch full article body from each URL.
   - Content quality gate: discard any article with fewer than 200 extracted characters.
4. **Hand-off**: Trigger a Trigger.dev background job, passing the validated article batch as payload.

### Stage 2 — Trigger.dev Background Job (Heavy Processing)
Executes off the main Nitro thread for each validated article.

5. **Single LLM Call (OpenRouter)**: Send one combined prompt per article to perform:
   - De-noising: Strip emotional bias, hyperbolic language, and clickbait phrasing.
   - Translation: Render the cleaned content into Traditional Chinese.
   - Tag extraction: Identify named entities (companies, people, tickers) and map them to tags.
   - Output: Structured JSON containing both `en` and `zh_tw` content variants plus a tags array.
6. **Media Mirroring**: Download the article's thumbnail image and upload it to Supabase Storage. Obtain a stable public URL.
7. **Persistence**: Write the final Signal Card object to the database (`signals` table + `tags` table).

## Invariants

1. **Non-Blocking Nitro**: Long-running AI tasks and media uploads must never run on the main Nitro thread; always delegate to `trigger/`.
2. **Unique Fact Rule**: Every signal must have a unique `fact_hash` (derived from URL + title) to prevent duplicate processing. Deduplication must occur before any AI call is made.
3. **No Third-Party CDN URLs**: Thumbnail images must always be mirrored to Supabase Storage. Yahoo CDN URLs must never be stored in the database due to URL expiry and hotlink blocking.
4. **Single LLM Call per Article**: De-noising, translation, and tag extraction must be batched into one OpenRouter request to minimise API quota consumption.
5. **Design Compliance**: All UI components must strictly utilise the OKLCH variables defined in `/context/ui-context.md`.