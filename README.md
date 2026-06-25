# The Signal

> an AI-powered news refinery that cuts through the noise

## Vision

The goal of [The Signal](https://the-signal-news.vercel.app) is to let users understand the truth of a news in under 10 seconds.

What the-signal offers:

- **Instant insights** &ndash; Get the information under 10 seconds with intuitive UI.
- **Up-to-date news** &ndash; Automatically scrapes multiple news sources daily, offering fresh content.
- **De-noised fact** &ndash; No emotional bias, just facts.
- **Shareable URLs** &ndash; Every signal is shareable through the URL, making sharing a breeze.
- **Semantic search** &ndash; Find signals by tags or topic via the command palette.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 4 + Nitro (TypeScript) |
| UI | Tailwind CSS 4 + Nuxt UI |
| Auth | Supabase Auth (Google / GitHub OAuth) |
| Database | PostgreSQL on Supabase (via Drizzle ORM) |
| Storage | Supabase Storage |
| AI Pipeline | Trigger.dev + OpenRouter |
| Deployment | Vercel (frontend), Trigger.dev (background jobs) |

## Further Reading

- [Project Overview](context/project-overview.md)
- [Architecture](context/architecture.md)
- [UI & Design System](context/ui-context.md)
- [Code Standards](context/code-standards.md)
- [Database Schema](context/database-schema.md)
