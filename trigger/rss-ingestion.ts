import type { RssItem } from '../shared/validators/rss'
import type { Category } from '../shared/validators/signal'
import type { refineryAgentTask } from './refinery-agent'
import { logger, schedules, tasks } from '@trigger.dev/sdk'
import { findSignalByGuid } from '../server/database/queries/signal'
import { refineryPayloadSchema } from '../shared/validators/rss'
import { fetchRssFeed } from './utils/fetch-rss'

const CATEGORIES: Category[] = ['finance', 'tech', 'world']

export const rssIngestionTask = schedules.task({
  id: 'rss-ingestion',
  cron: {
    pattern: '0 1,9,17 * * *',
    timezone: 'America/New_York',
  },
  run: async () => {
    const results = { total: 0, new: 0, duplicate: 0, errors: 0 }

    for (const category of CATEGORIES) {
      let items: RssItem[]
      try {
        items = await fetchRssFeed(category)
      }
      catch (error) {
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
