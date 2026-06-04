import type { Signal } from '#shared/validators/signal'
import { findSignalBySlug } from '~~/server/database/queries/signal'
import { signalSchema } from '#shared/validators/signal'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event): Promise<Signal> => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  }

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
