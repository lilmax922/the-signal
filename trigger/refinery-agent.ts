import type { LlmOutput } from '../shared/validators/llm'
import { OpenRouter } from '@openrouter/sdk'
import { logger, schemaTask } from '@trigger.dev/sdk'
import env from '../shared/env'
import { llmOutputSchema } from '../shared/validators/llm'
import { refineryPayloadSchema } from '../shared/validators/rss'
import { buildPrompt } from './utils/build-prompt'
import { extractArticleContent } from './utils/extractor'

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

    return {
      guid,
      title: payload.title,
      sourceUrl: payload.sourceUrl,
      category: payload.category,
      contentLength: extractedContent.length,
      timestamp: new Date().toISOString(),
      llmOutput,
    }
  },
})
