import type { FeedResponse } from '#shared/validators/signal'
import { findSignals } from '~~/server/database/queries/signal'
import { signalQuerySchema } from '#shared/validators/signal'
// DEV-AUTH-DISABLED: import 與 session 驗證已停用。
// 重新啟用:取消下方 /* … */ 區塊的註解,並恢復 import。
/*
// DEV-AUTH-DISABLED: see header comment above
import { serverSupabaseUser } from '#supabase/server'
*/

export default defineEventHandler(async (event): Promise<FeedResponse> => {
  // DEV-AUTH-DISABLED: 未登入請求不再回傳 401。
  /*
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  }
  */

  const parsed = signalQuerySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'invalid query',
      data: parsed.error.flatten(),
    })
  }

  try {
    return await findSignals(parsed.data)
  }
  catch (error) {
    // Cursor decode failures bubble up as a 400 (wire-format violation).
    if (error instanceof Error && error.message.startsWith('findSignals: malformed cursor')) {
      throw createError({ statusCode: 400, statusMessage: 'invalid cursor' })
    }
    throw createError({ statusCode: 500, statusMessage: 'internal error' })
  }
})
