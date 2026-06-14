import type { SignalFeed } from '#shared/validators/signal'
import { searchSignals } from '~~/server/database/queries/signal'
import { signalFeedSchema, signalSearchSchema } from '#shared/validators/signal'
// DEV-AUTH-DISABLED: import 與 session 驗證已停用。
// 重新啟用:取消下方 /* … */ 區塊的註解,並恢復 import。
/*
// DEV-AUTH-DISABLED: see header comment above
import { serverSupabaseUser } from '#supabase/server'
*/

export default defineEventHandler(async (event): Promise<SignalFeed[]> => {
  // DEV-AUTH-DISABLED: 未登入請求不再回傳 401。
  /*
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  }
  */

  const query = getQuery(event)

  const rawQ = typeof query.q === 'string' ? query.q : ''
  if (!rawQ || !rawQ.trim()) {
    return []
  }

  const parsed = signalSearchSchema.safeParse(query)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'invalid query',
      data: parsed.error.flatten(),
    })
  }

  const { q, limit } = parsed.data

  try {
    const rows = await searchSignals({ q: q.trim(), limit })
    const result = signalFeedSchema.array().safeParse(rows)
    if (!result.success) {
      throw new Error(`search: response drifted from contract — ${result.error.message}`)
    }
    return result.data
  }
  catch (error) {
    console.error({ error })
    throw createError({ statusCode: 500, statusMessage: 'internal error' })
  }
})
