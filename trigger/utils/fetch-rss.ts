import type { RssItem } from '../../shared/validators/rss'
import type { Category } from '../../shared/validators/signal'
import { logger } from '@trigger.dev/sdk'
import { XMLParser } from 'fast-xml-parser'
import { rawRssFeedSchema, rssItemSchema } from '../../shared/validators/rss'
import { categorySchema } from '../../shared/validators/signal'

const RSS_URLS: Record<Category, string> = {
  finance: 'https://feeds.bbci.co.uk/news/business/rss.xml',
  tech: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
  world: 'https://feeds.bbci.co.uk/news/world/rss.xml',
}

function extractGuid(guid: string | { '#text': string }): string {
  const raw = typeof guid === 'string' ? guid : guid['#text']
  // BBC guids carry a `#0` / `#1` fragment suffix — strip it for stable dedup.
  return raw.split('#')[0]
}

function normalizeLink(link: string): string {
  // BBC links carry `?at_medium=RSS&at_campaign=rss` tracking params — strip
  // query + fragment so the stored sourceUrl is canonical.
  try {
    const url = new URL(link)
    return url.origin + url.pathname
  }
  catch {
    return link
  }
}

type MediaThumbnail = { '@_url'?: string, '@url'?: string }
type MediaContent = { '@_url'?: string }

function first<T>(value: T | T[] | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value
}

function extractImageUrl(item: {
  'media:thumbnail'?: MediaThumbnail | MediaThumbnail[]
  'media:content'?: MediaContent | MediaContent[]
}): string | null {
  // BBC provides images only via <media:thumbnail url="...">; media:content
  // is kept as a fallback for robustness. Either tag may repeat (parser
  // yields an array) — take the first url. Invalid URLs become null so the
  // item still passes `rssItemSchema` (imageUrl is nullable) instead of
  // being dropped.
  const thumbnail = first(item['media:thumbnail'])
  const content = first(item['media:content'])
  const raw = thumbnail?.['@_url']
    ?? thumbnail?.['@url']
    ?? content?.['@_url']
    ?? null
  if (!raw || !URL.canParse(raw))
    return null
  return raw
}

export async function fetchRssFeed(category: Category): Promise<RssItem[]> {
  const validatedCategory = categorySchema.parse(category)

  const response = await fetch(RSS_URLS[validatedCategory], {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; The-Signal/1.0)',
      'Accept': 'application/rss+xml, application/xml, text/xml',
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`RSS fetch failed: ${response.status} for category "${category}"`)
  }

  const xml = await response.text()

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    // A feed with a single <item> would otherwise parse as an object, not
    // an array — force the array shape so the Zod schema always matches.
    isArray: tagName => tagName === 'item',
  })

  const parsed = parser.parse(xml)

  const feed = rawRssFeedSchema.safeParse(parsed)
  if (!feed.success) {
    throw new Error(`RSS parse error for ${category}: ${feed.error.message}`)
  }

  const items = feed.data.rss.channel.item.flatMap((item): RssItem[] => {
    const guidText = typeof item.guid === 'string' ? item.guid : item.guid['#text']
    try {
      let publishedAt: string
      try {
        publishedAt = new Date(item.pubDate).toISOString()
      }
      catch {
        logger.warn(`Skipping RSS item with invalid pubDate for "${validatedCategory}"`, {
          guid: guidText,
          title: item.title,
          pubDate: item.pubDate,
        })
        return []
      }

      const sourceUrl = normalizeLink(item.link)

      // Articles-only ingestion: keep /news/articles/ links, drop videos,
      // Sounds, iPlayer, and live/blog URLs that the extractor cannot parse.
      let isArticle = false
      try {
        isArticle = new URL(sourceUrl).pathname.includes('/news/articles/')
      }
      catch {
        isArticle = false
      }
      if (!isArticle) {
        logger.warn(`Skipping non-article RSS item for "${validatedCategory}"`, {
          guid: guidText,
          title: item.title,
          link: sourceUrl,
        })
        return []
      }

      const result = rssItemSchema.safeParse({
        guid: extractGuid(item.guid),
        title: item.title,
        sourceUrl,
        publishedAt,
        imageUrl: extractImageUrl(item),
        category: validatedCategory,
      })

      if (!result.success) {
        logger.warn(`Skipping invalid RSS item for "${validatedCategory}"`, {
          guid: guidText,
          title: item.title,
          error: result.error.message,
        })
        return []
      }
      return [result.data]
    }
    catch (error) {
      logger.warn(`Skipping RSS item that failed to transform for "${validatedCategory}"`, {
        guid: guidText,
        title: item.title,
        error: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  })

  return items
}
