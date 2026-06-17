# Objective

Replace the Nitro scheduled task / Vercel cron (`server/tasks/rss-ingestion.ts`) with a Trigger.dev `schedules.task` that runs three times daily at 01:00, 09:00, and 17:00 (America/New_York). The Trigger.dev task must contain the same RSS fetch → deduplicate → trigger refinery-agent logic as the current Nitro task, removing the Nitro task as a cron target while keeping the `fetchRssFeed` utility and DB queries intact.

# Implementation

## Step 1 — Create `trigger/rss-ingestion.ts`

Create a new Trigger.dev scheduled task in the `trigger/` directory that owns the cron schedule directly. This replaces the Nitro task.

- Use `schedules.task` from `@trigger.dev/sdk` (not `defineTask`).
- Set cron pattern to `{ pattern: "0 1,9,17 * * *", timezone: "America/New_York" }` for three daily runs.
- Import `fetchRssFeed` from `#shared/validators/rss` but note: since Trigger.dev's esbuild bundler doesn't resolve `#shared` natively, the import path must use relative imports or go through the existing nuxt alias resolver plugin in `trigger.config.ts`. The `refinery-agent.ts` file already uses relative imports (`../shared/...`) for `shared/` references — follow the same pattern.
- Import `findSignalByGuid` from `../server/database/queries/signal` (relative path, same as `refinery-agent.ts` imports `../server/database`).
- Import `refineryPayloadSchema` from `../shared/validators/rss`.
- Import `tasks` from `@trigger.dev/sdk` to trigger `refinery-agent`.
- Import `Category` type and `CATEGORIES` constant — define categories inline or use `../shared/validators/signal`.

### Task logic (mirrors the existing Nitro task):

- Loop over `['finance', 'tech', 'world']` categories.
- Call `fetchRssFeed(category)` — catches errors per-category, logs, and continues.
- For each `RssItem`, call `findSignalByGuid(item.guid)` to deduplicate.
- Validate each new item with `refineryPayloadSchema.safeParse(item)`.
- Trigger `refinery-agent` task via `tasks.trigger<typeof refineryAgentTask>('refinery-agent', validated.data)`.
- Cap at 5 new articles per category.
- Return `{ result: { total, new, duplicate, errors } }` for observability.
- Use `logger.info` / `logger.warn` from `@trigger.dev/sdk` instead of `console.error`.

```ts
// trigger/rss-ingestion.ts — replaces server/tasks/rss-ingestion.ts
import { schedules, tasks, logger } from '@trigger.dev/sdk'
import type { RssItem } from '../shared/validators/rss'
import type { Category } from '../shared/validators/signal'
import type { refineryAgentTask } from './refinery-agent'
import { refineryPayloadSchema } from '../shared/validators/rss'
import { findSignalByGuid } from '../server/database/queries/signal'
import { fetchRssFeed } from '../server/utils/fetch-rss'

const CATEGORIES: Category[] = ['finance', 'tech', 'world']

export const rssIngestionTask = schedules.task({
  id: 'rss-ingestion',
  cron: { pattern: '0 1,9,17 * * *', timezone: 'America/New_York' },
  run: async (payload) => {
    const results = { total: 0, new: 0, duplicate: 0, errors: 0 }

    for (const category of CATEGORIES) {
      let items: RssItem[]
      try {
        items = await fetchRssFeed(category)
      } catch (error) {
        logger.error(`Failed to fetch "${category}"`, { error })
        results.errors++
        continue
      }

      let newCount = 0
      for (const item of items) {
        const existing = await findSignalByGuid(item.guid)
        if (existing) {
          results.duplicate++
          continue
        }

        const validated = refineryPayloadSchema.safeParse(item)
        if (!validated.success) {
          logger.error(`Invalid payload for guid=${item.guid}`, { error: validated.error })
          continue
        }

        logger.info(`Trigger refinery for guid=${item.guid}`)
        await tasks.trigger<typeof refineryAgentTask>('refinery-agent', validated.data)
        results.new++
        newCount++

        if (newCount >= 5) {
          logger.warn(`Reached limit of 5 for "${category}"`)
          break
        }
      }

      results.total += items.length
    }

    return { result: results }
  },
})
```

## Step 2 — Remove the Nitro task cron configuration

- Delete or repurpose `server/tasks/rss-ingestion.ts`. Since Nitro will still bundle the directory, removing the file is cleanest. The `fetchRssFeed` utility lives at `server/utils/fetch-rss.ts` and is used by the new Trigger.dev task via relative import — it should remain untouched.
- Remove `server/tasks/rss-ingestion.ts` from the filesystem.
- In `nuxt.config.ts`:
  - Remove the `nitro.scheduledTasks` entry for `'0 8,20 * * *': ['rss-ingestion']`.
  - Remove the `nitro.vercel.config.crons` entry for `/api/cron/rss-ingestion`.
- Ensure the `nitro.experimental.tasks: true` flag remains if other tasks (e.g. `purge-old`) still use it.

## Step 3 — Update Context Files

Update all Nitro tasks content to Trigger.dev schedule tasks.

# Out of Scope

- Refactoring the `purge-old` Nitro task (monthly data purge) — this task is not in scope.
- Changing the `fetchRssFeed` utility logic or the `findSignalByGuid` query.
- Changing the `refinery-agent` task itself.
- Adding any Vercel-specific configuration — Trigger.dev handles the cron scheduling independently.

# Check When Done

- `trigger/rss-ingestion.ts` exists with the `schedules.task` definition and cron `0 1,9,17 * * *` timezone `America/New_York`.
- `server/tasks/rss-ingestion.ts` is deleted.
- `nuxt.config.ts` no longer references `rss-ingestion` in `nitro.scheduledTasks` or `nitro.vercel.config.crons`.
- `pnpm run lint:fix` passes.
- `pnpm run build` passes.
- `context/architecture.md` is updated to reflect Trigger.dev as the scheduler for RSS ingestion.
- Trigger.dev dev server (`trigger dev`) recognizes the new scheduled task and shows the cron schedule during deployment.
