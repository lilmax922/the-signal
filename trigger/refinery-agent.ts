import type { LlmOutput } from '../shared/validators/llm'
import { OpenRouter } from '@openrouter/sdk'
import { logger, schemaTask } from '@trigger.dev/sdk'
import { db } from '../server/database'
import { insertSignal } from '../server/database/queries/signal'
import { insertSignalTag } from '../server/database/queries/signal-tag'
import { insertTag } from '../server/database/queries/tag'
import env from '../shared/env'
import { llmOutputSchema } from '../shared/validators/llm'
import { refineryPayloadSchema } from '../shared/validators/rss'
import { buildPrompt } from './utils/build-prompt'
import { extractArticleContent } from './utils/extractor'
import { mirrorImage } from './utils/mirror-image'
import { generateSlug } from './utils/slug'

const openrouter = new OpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
})

export const refineryAgentTask = schemaTask({
  id: 'refinery-agent',
  schema: refineryPayloadSchema,
  run: async (payload, { ctx }) => {
    const guid = payload.guid
    const pipelineRunId = ctx.run.id

    logger.info('Refinery started', { guid, pipelineRunId })

    const extractedContent = await extractArticleContent(payload.sourceUrl)

    logger.info(`Extracted content (${extractedContent.length} chars): ${extractedContent.slice(0, 200)}...`)

    logger.info(`Calling LLM for guid: ${guid}`)

    let llmOutput: LlmOutput

    try {
      const response = await openrouter.chat.send({
        chatRequest: {
          model: 'google/gemma-4-31b-it:free',
          messages: [{
            role: 'user',
            content: buildPrompt(payload.title, extractedContent),
          }],
          temperature: 0.1,
        },
      })

      const responseText: string = response.choices?.[0]?.message?.content ?? ''
      llmOutput = llmOutputSchema.parse(JSON.parse(responseText))

      logger.info('LLM output', { llmOutput })
    }
    catch (err) {
      logger.error('LLM call failed or returned invalid JSON', {
        guid,
        pipelineRunId,
        err,
      })
      throw err
    }

    const slug = generateSlug(llmOutput.titleEn, payload.publishedAt)

    let mirroredImageUrl: string | null = null
    if (payload.imageUrl) {
      try {
        mirroredImageUrl = await mirrorImage(payload.imageUrl)
      }
      catch (err) {
        logger.error('Image mirroring failed', { guid, pipelineRunId, err })
      }
    }

    logger.info('Persisting signal, tags, and signal_tag rows', { guid, pipelineRunId })

    const persisted = await db.transaction(async (tx) => {
      const insertedSignal = await insertSignal({
        slug,
        guid: payload.guid,
        category: payload.category,
        titleEn: llmOutput.titleEn,
        titleZh: llmOutput.titleZh,
        contentEn: llmOutput.contentEn,
        contentZh: llmOutput.contentZh,
        summaryEn: llmOutput.summaryEn,
        summaryZh: llmOutput.summaryZh,
        imageUrl: mirroredImageUrl,
        sourceUrl: payload.sourceUrl,
        publishedAt: new Date(payload.publishedAt),
        pipelineRunId,
      }, tx)

      const insertedTags = []
      const insertedSignalTags = []
      for (const name of llmOutput.tags) {
        const insertedTag = await insertTag({ name }, tx)
        insertedTags.push(insertedTag)
        const junction = await insertSignalTag(
          { signalId: insertedSignal.id, tagId: insertedTag.id },
          tx,
        )
        insertedSignalTags.push(junction)
      }

      return { insertedSignal, insertedTags, insertedSignalTags }
    })

    logger.info('Persisted', {
      guid,
      pipelineRunId,
      signalId: persisted.insertedSignal.id,
      tagCount: persisted.insertedTags.length,
      junctionCount: persisted.insertedSignalTags.length,
    })

    return {
      guid,
      title: payload.title,
      sourceUrl: payload.sourceUrl,
      category: payload.category,
      contentLength: extractedContent.length,
      timestamp: new Date().toISOString(),
      llmOutput,
      slug,
      mirroredImageUrl,
      persisted,
    }
  },
})
