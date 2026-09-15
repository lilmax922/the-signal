import type { PurgeStorage } from './utils/purge'
import { logger, schedules } from '@trigger.dev/sdk'
import { db } from '../server/database'
import env from '../shared/env'
import { createStorageClient } from '../shared/utils/create-storage-client'
import { createDrizzlePurgeDeps, PURGE_BATCH_SIZE_DEFAULT, PURGE_RETENTION_MONTHS, runPurge } from './utils/purge'

const LOG = {
  START: 'purge.start',
  BATCH: 'purge.batch',
  ORPHANS: 'purge.orphans',
  IMAGES: 'purge.images',
  DRY_RUN: 'purge.dry-run',
  COMPLETE: 'purge.complete',
} as const

// Monthly purge of signals older than 3 months (context/database-schema.md
// "Data Retention"). Runs at 05:00 ET on the 1st — after the 01:00 ingestion
// window so the two jobs never contend on the signal table.
export const purgeOldTask = schedules.task({
  id: 'purge-old',
  cron: {
    pattern: '0 5 1 * *',
    timezone: 'America/New_York',
  },
  run: async () => {
    // Safe by default: scheduled runs only count until PURGE_DRY_RUN=false is
    // set in the Trigger.dev environment — the first production run therefore
    // reports counts and deletes nothing.
    const dryRun = env.PURGE_DRY_RUN !== 'false'

    logger.info(LOG.START, {
      dryRun,
      batchSize: PURGE_BATCH_SIZE_DEFAULT,
      retentionMonths: PURGE_RETENTION_MONTHS,
    })

    const supabase = createStorageClient()
    const storage: PurgeStorage = {
      async removeObjects(bucket, keys) {
        const { error } = await supabase.storage.from(bucket).remove(keys)
        if (error)
          throw new Error(`purge storage remove failed for ${keys.length} objects in bucket "${bucket}": ${error.message}`)
      },
    }

    const result = await runPurge(createDrizzlePurgeDeps(db, storage), {
      dryRun,
      batchSize: PURGE_BATCH_SIZE_DEFAULT,
      onBatch: async ({ batchIndex, signals, signalTags, images, imagesSkipped }) => {
        logger.info(LOG.BATCH, { batchIndex, signals, signalTags, images, imagesSkipped })
      },
    })

    logger.info(LOG.ORPHANS, { tags: result.tags })
    logger.info(LOG.IMAGES, { images: result.images, imagesSkipped: result.imagesSkipped })

    if (result.dryRun) {
      logger.warn(LOG.DRY_RUN, result)
    }

    logger.info(LOG.COMPLETE, result)
    return result
  },
})
