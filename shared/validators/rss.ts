import { z } from 'zod'
import { CategorySchema } from './signal'

export const rawRssItemSchema = z.object({
  'title': z.string().min(1),
  'link': z.string().url(),
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
  sourceUrl: z.string().url(),
  publishedAt: z.string().datetime(),
  imageUrl: z.string().url().nullable(),
  category: CategorySchema,
})

export type RssItem = z.infer<typeof rssItemSchema>
