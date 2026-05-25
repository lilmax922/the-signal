import type { RssItem } from '#shared/validators/rss'
import type { Category } from '#shared/validators/signal'
import { XMLParser } from 'fast-xml-parser'
import { rawRssFeedSchema, rssItemSchema } from '#shared/validators/rss'
import { CategorySchema } from '#shared/validators/signal'

const RSS_URLS: Record<Category, string> = {
  finance: 'https://finance.yahoo.com/news/rssindex',
  tech: 'https://news.yahoo.com/rss/tech',
  world: 'https://news.yahoo.com/rss/world',
}

function extractGuid(guid: string | { '#text': string }): string {
  return typeof guid === 'string' ? guid : guid['#text']
}

export async function fetchRssFeed(category: Category): Promise<RssItem[]> {
  const validatedCategory = CategorySchema.parse(category)

  const xml = await $fetch(RSS_URLS[validatedCategory], {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; The-Signal/1.0)',
      'Accept': 'application/rss+xml, application/xml, text/xml',
    },
  })

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  })

  const parsed = parser.parse(xml as string)

  const feed = rawRssFeedSchema.safeParse(parsed)
  if (!feed.success) {
    throw new Error(`RSS parse error for ${category}: ${feed.error.message}`)
  }

  const items = feed.data.rss.channel.item.flatMap((item): RssItem[] => {
    const result = rssItemSchema.safeParse({
      guid: extractGuid(item.guid),
      title: item.title,
      sourceUrl: item.link,
      publishedAt: new Date(item.pubDate).toISOString(),
      imageUrl: item['media:content']?.['@_url'] ?? null,
      category: validatedCategory,
    })

    if (!result.success)
      return []
    return [result.data]
  })

  console.log(`[fetchRssFeed] Fetched ${items.length} items for category "${category}":`, items)

  return items
}
