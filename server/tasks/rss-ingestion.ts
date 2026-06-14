import type { RssItem } from '#shared/validators/rss'
import type { Category } from '#shared/validators/signal'
import type { refineryAgentTask } from '../../trigger/refinery-agent'
import { tasks } from '@trigger.dev/sdk'
import { refineryPayloadSchema } from '#shared/validators/rss'
import { findSignalByGuid } from '../database/queries/signal'

const CATEGORIES: Category[] = ['finance', 'tech', 'world']

export default defineTask({
  meta: {
    name: 'rss-ingestion',
    description: 'Fetch Yahoo News RSS feeds and trigger the refinery pipeline for new articles.',
  },
  async run({ payload: _payload, context: _context }) {
    const results = { total: 0, new: 0, duplicate: 0, errors: 0 }

    for (const category of CATEGORIES) {
      let items: RssItem[]
      try {
        items = await fetchRssFeed(category)
      }
      catch (error) {
        console.error(`[rss-ingestion] Failed to fetch "${category}":`, error)
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
          console.error(`[rss-ingestion] Invalid payload for guid=${item.guid}:`, validated.error)
          continue
        }

        console.warn(`[rss-ingestion] Trigger refinery for guid=${item.guid}`)
        await tasks.trigger<typeof refineryAgentTask>('refinery-agent', validated.data)
        results.new++
        newCount++

        if (newCount >= 5) {
          console.warn(`[rss-ingestion] Reached limit of 5 new articles for "${category}"`)
          break
        }
      }

      results.total += items.length
    }

    return { result: results }
  },
})
