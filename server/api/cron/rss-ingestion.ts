export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization')
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { result } = await runTask('rss-ingestion')
  return { success: true, result }
})
