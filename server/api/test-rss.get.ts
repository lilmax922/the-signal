export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const category = (query.category as string) || 'tech'
  const items = await fetchRssFeed(category as any)
  return { category, count: items.length, items }
})
