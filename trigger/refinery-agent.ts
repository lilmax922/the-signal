import { logger, schemaTask } from '@trigger.dev/sdk'
import { extractArticleContent } from '../shared/utils/extractor'
import { refineryPayloadSchema } from '../shared/validators/rss'

export const refineryAgentTask = schemaTask({
  id: 'refinery-agent',
  schema: refineryPayloadSchema,
  run: async (payload) => {
    logger.info(`[refinery-agent] Extracting content from: ${payload.sourceUrl}`)

    const cleanedContent = await extractArticleContent(payload.sourceUrl)

    logger.info(`[refinery-agent] Extracted content (${cleanedContent.length} chars): ${cleanedContent.slice(0, 200)}...`)

    return {
      guid: payload.guid,
      title: payload.title,
      sourceUrl: payload.sourceUrl,
      category: payload.category,
      contentLength: cleanedContent.length,
      timestamp: new Date().toISOString(),
    }
  },
})
