import type { Signal } from '#shared/validators/signal'
import { findSignalBySlug } from '~~/server/database/queries/signal'
import { signalSchema } from '#shared/validators/signal'
// DEV-AUTH-DISABLED: import 與 session 驗證已停用。
// 重新啟用:取消下方 /* … */ 區塊的註解,並恢復 import。
/*
// DEV-AUTH-DISABLED: see header comment above
import { serverSupabaseUser } from '#supabase/server'
*/

export default defineEventHandler(async (event): Promise<Signal> => {
  // DEV-AUTH-DISABLED: 未登入請求不再回傳 401。
  /*
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  }
  */

  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'invalid slug' })
  }

  const row = await findSignalBySlug(slug)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'signal not found' })
  }

  const parsed = signalSchema.safeParse(row)
  if (!parsed.success) {
    // A parse failure here means the DB row drifted from the API contract.
    // Surface as 500 with the error attached for server-side observability.
    throw createError({
      statusCode: 500,
      statusMessage: 'response drifted from contract',
      data: parsed.error.flatten(),
    })
  }

  return parsed.data
})
