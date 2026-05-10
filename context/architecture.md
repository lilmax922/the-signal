# Architecture Context

## Stack

| Layer     | Technology                         | Role   |
| --------- | ---------------------------------- | ------ |
| Framework | Nuxt.js 4 + TypeScript             | Full-stack app with client/server boundaries. |
| UI        | TailwindCSS + NuxtUI               | Component composition and styling. |
| Auth      | Supabase Auth                      | Handles Google & GitHub OAuth integration and manages user sessions and identity. |
| Database  | Drizzle ORM + Supabase(PostgreSQL) | Primary structured storage using Drizzle ORM for type-safe data operations (Signals, Tags, Profiles). |
| Storage   | Supabase Storage                   | Stores large binary artifacts like news thumbnail blobs and static media assets. |
| AI Pipeline  | Trigger.dev + OpenRouter        | Trigger.dev: Long-running background jobs (Scraping, De-noising).<br>OpenRouter: Access to LLMs (e.g., Gemma 9B) for factual extraction. |
| Email     | Resend                             | Transactional email service for the "Morning Pulse" personalized digest. |
| Package Manager | pnpm                         | Package manager for the project. |

## System Boundaries

- `app/` — Presentation Layer: Client-side Nuxt 4 directory containing pages, components, and composables. Uses useState for lightweight state management.
- `lib/` — Shared Infrastructure: Drizzle schemas, database client initialization.
- `shared/` - Contains the shared code that can be used in both the Vue app and the Nitro server such as constants, types.
- `server/` — Nitro Backend: Handles API routes, server-side permission checks, and 3rd-party integrations (Resend). Follows the "Thin API" pattern.
- `trigger/` — Intelligence Refinery: Off-main-thread background refinery. Responsible for RSS ingestion, AI de-noising, fact translation, and tag pre-generation.

## Storage Model

- **Database (PostgreSQL)**:
    - Metadata: Stores bilingual signal content, AI-generated tags, and source metadata.
    - Relationships: Manages user-to-tag "Tracked Interests" and "Saved Signals" mappings.
    - Task Records: Logs Trigger.dev run states and fact_hash for deduplication.
- **Supabase Storage**:
    - Media Blobs: Stores actual image files (news thumbnails).
    - References: Only the public URLs or paths to these blobs are stored in the PostgreSQL signals table.

## Auth and Access Model

- Identity: Every user is identified by a unique UUID issued via Supabase Auth.
- Access Control:
    - Public: Global Fact Stream is readable by all users.
    - Private: Personal collections and interest settings are strictly isolated.
- Data Security: Implements PostgreSQL Row Level Security (RLS) to enforce data isolation at the database level.

## AI Pre-generation Workflow (The "Refinery" Pipeline)

To ensure high-speed consumption, all content is processed before reaching the user:

1. Ingestion: Trigger.dev periodically fetches the Yahoo Finance RSS Feed and extracts meta-data.
2. De-noising (Extraction): AI strips emotional bias and hyperbolic language to extract core structural facts.
3. Translation: Executes objective fact-based translation (English to Chinese) on the cleaned data.
4. Pre-tagging: AI identifies entities and maps them to tags while generating a fact_hash for uniqueness.
5. Persistence: The final Signal Card object is saved to the database for instant user access.

## Invariants

1. Non-Blocking Nitro: Long-running AI tasks must never run on the main Nitro thread; always delegate to trigger/.
2. Unique Fact Rule: Every signal must have a unique fact_hash to prevent duplicate reporting of the same event.
3. Design Compliance: All UI components must strictly utilize the OKLCH variables defined in `/context/ui-context.md`.
