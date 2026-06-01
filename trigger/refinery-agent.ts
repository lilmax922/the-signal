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

const LOG = {
  START: 'refinery.start',
  EXTRACT_OK: 'refinery.extract.ok',
  REFINE_OK: 'refinery.refine.ok',
  SLUG_OK: 'refinery.slug.ok',
  MIRROR_OK: 'refinery.mirror.ok',
  MIRROR_SKIP: 'refinery.mirror.skipped',
  MIRROR_ERR: 'refinery.mirror.err',
  PERSIST_OK: 'refinery.persist.ok',
  COMPLETE: 'refinery.complete',
} as const

export type RefineryResult = {
  status: 'success'
  slug: string
  signalId: string
  tagCount: number
  imageMirrored: boolean
}

class RefineryError extends Error {
  constructor(
    public readonly code: 'EXTRACT_FAILED' | 'LLM_FAILED' | 'SLUG_FAILED' | 'PERSIST_FAILED',
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'RefineryError'
  }
}

const openrouter = new OpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
})

export const refineryAgentTask = schemaTask({
  id: 'refinery-agent',
  schema: refineryPayloadSchema,
  run: async (payload, { ctx: taskCtx }) => {
    const pipelineRunId = taskCtx.run.id
    const { guid } = payload
    const log = (stage: string) => ({ pipelineRunId, guid, stage })

    logger.info(LOG.START, log('start'))

    // Step 1 — Extract article content
    let content: string
    try {
      content = await extractArticleContent(payload.sourceUrl)
    }
    catch (err) {
      throw new RefineryError('EXTRACT_FAILED', 'article extraction failed', err)
    }
    logger.info(LOG.EXTRACT_OK, { ...log('extract'), contentLength: content.length })

    // Step 2 — LLM de-noise + translate + tag + summary
    let llmOutput: LlmOutput
    try {
      const response = await openrouter.chat.send({
        chatRequest: {
          model: 'google/gemma-4-31b-it:free',
          messages: [{ role: 'user', content: buildPrompt(payload.title, content) }],
          temperature: 0.1,
        },
      })
      const responseText: string = response.choices?.[0]?.message?.content ?? ''
      llmOutput = llmOutputSchema.parse(JSON.parse(responseText))
    }
    catch (err) {
      throw new RefineryError('LLM_FAILED', 'LLM call failed or returned invalid output', err)
    }
    logger.info(LOG.REFINE_OK, {
      ...log('refine'),
      titleLength: llmOutput.titleEn.length,
      summaryPointCount: llmOutput.summaryEn.length,
      tagCount: llmOutput.tags.length,
    })

    // Step 3 — Slug generation
    let slug: string
    try {
      slug = generateSlug(llmOutput.titleEn, payload.publishedAt)
    }
    catch (err) {
      throw new RefineryError('SLUG_FAILED', 'slug generation failed', err)
    }
    logger.info(LOG.SLUG_OK, { ...log('slug'), slug })

    // Step 4 — Image mirroring (soft-fail per architecture.md)
    let mirroredImageUrl: string | null = null
    if (payload.imageUrl) {
      try {
        mirroredImageUrl = await mirrorImage(payload.imageUrl)
        logger.info(LOG.MIRROR_OK, log('mirror'))
      }
      catch (err) {
        logger.warn(LOG.MIRROR_ERR, { ...log('mirror'), err })
      }
    }
    else {
      logger.info(LOG.MIRROR_SKIP, log('mirror'))
    }

    // Step 5 — Persist signal, tags, signal_tag junctions
    let persisted: { signalId: string, tagCount: number }
    try {
      const result = await db.transaction(async (tx) => {
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

        let tagCount = 0
        for (const name of llmOutput.tags) {
          const insertedTag = await insertTag({ name }, tx)
          await insertSignalTag({ signalId: insertedSignal.id, tagId: insertedTag.id }, tx)
          tagCount++
        }

        return { signalId: insertedSignal.id, tagCount }
      })
      persisted = result
    }
    catch (err) {
      throw new RefineryError('PERSIST_FAILED', 'database persistence failed', err)
    }
    logger.info(LOG.PERSIST_OK, { ...log('persist'), ...persisted })

    const result: RefineryResult = {
      status: 'success',
      slug,
      signalId: persisted.signalId,
      tagCount: persisted.tagCount,
      imageMirrored: mirroredImageUrl !== null,
    }
    logger.info(LOG.COMPLETE, { ...log('complete'), ...result })
    return result
  },
})
