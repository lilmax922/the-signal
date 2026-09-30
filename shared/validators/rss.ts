import { z } from 'zod'
import { categorySchema } from './signal'

const mediaThumbnailSchema = z.object({
  '@_url': z.string().optional(),
  '@url': z.string().optional(),
})

const mediaContentSchema = z.object({ '@_url': z.string() })

export const rawRssItemSchema = z.object({
  'title': z.string().min(1),
  'link': z.url(),
  'pubDate': z.string(),
  'guid': z.union([
    z.string(),
    z.object({
      '#text': z.string(),
      '@_isPermaLink': z.string().optional(),
    }),
  ]),
  // A <media:content> element may repeat; fast-xml-parser yields an array
  // in that case. Accept single-or-array so one repeated tag cannot fail
  // the whole-feed `rawRssFeedSchema.safeParse`.
  'media:content': z.union([mediaContentSchema, z.array(mediaContentSchema)]).optional(),
  // BBC News RSS carries images only as <media:thumbnail url="..."> (MRSS
  // namespace http://search.yahoo.com/mrss/). fast-xml-parser maps the `url`
  // attribute to `@_url` under the configured `attributeNamePrefix: '@_'`;
  // `@url` is accepted as a fallback if the prefix config ever changes.
  // `media:content` is kept for robustness against non-BBC feeds.
  // A <media:thumbnail> element may repeat (BBC items can carry two);
  // fast-xml-parser yields an array in that case. Accept single-or-array
  // so a repeated tag cannot fail the whole-feed parse — downstream takes
  // the first url.
  'media:thumbnail': z.union([mediaThumbnailSchema, z.array(mediaThumbnailSchema)]).optional(),
})

export const rawRssFeedSchema = z.object({
  rss: z.object({
    channel: z.object({
      item: z.array(rawRssItemSchema),
    }),
  }),
})

export const rssItemSchema = z.object({
  guid: z.string().min(1),
  title: z.string().min(1),
  sourceUrl: z.url(),
  publishedAt: z.iso.datetime(),
  imageUrl: z.url().nullable(),
  category: categorySchema,
})
export type RssItem = z.infer<typeof rssItemSchema>

export const refineryPayloadSchema = z.object({
  guid: z.string().min(1),
  title: z.string().min(1),
  sourceUrl: z.url(),
  publishedAt: z.iso.datetime(),
  imageUrl: z.url().nullable(),
  category: categorySchema,
})
export type RefineryPayload = z.infer<typeof refineryPayloadSchema>
