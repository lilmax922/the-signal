import { z } from 'zod'
import { categorySchema } from './signal'

export const rawRssItemSchema = z.object({
  'title': z.string().min(1),
  'link': z.url(),
  'pubDate': z.string(),
  'guid': z.union([
    z.string(),
    z.object({ '#text': z.string() }),
  ]),
  'media:content': z.object({ '@_url': z.string() }).optional(),
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
