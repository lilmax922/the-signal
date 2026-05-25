# Objective

We're adding the signal api to ingestion of yahoo news rss for testing purpose, which categories are `tech`, `world` and `finance`. The endpoint will be called by a Nitro task in the future, but for now we can just test it by calling the API route directly.


Category: `tech`, `world`, `finance`

Yahoo News RSS: `https://news.yahoo.com/rss/{category}`, 
Finance RSS: `https://finance.yahoo.com/news/rssindex`

## Packages to Install

- `fast-xml-parser` for parsing RSS XML.

### Step 1 - Shared Types & Validators

- Create `shared/validators/signal.ts` with `CategorySchema`('finance', 'tech', 'world') enum and inferred `Category` type.

- Create `shared/validators/rss.ts` with Zod schema for validating the parsed RSS item and feed data, it contains:
  - `rawRssItemSchema`: Raw shape coming out of fast-xml-parser before transformation
  - `rawRssFeedSchema`: Raw shape coming out of fast-xml-parser for the entire feed
  - `rssItemSchema`(title, guid, sourceUrl, publishedAt, imageUrl, category): Validated, transformed shape passed to Trigger.dev

```ts
import { z } from 'zod'
import { categorySchema } from './signal'

// Raw shape out of fast-xml-parser before transformation
export const rawRssItemSchema = z.object({
  title:           z.string().min(1),
  link:            z.string().url(),
  pubDate:         z.string(),
  guid:            z.union([
    z.string(),
    z.object({ '#text': z.string() }),  // guid may be an object when isPermaLink attr is present
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

// Validated, normalised shape after transformation
export const rssItemSchema = z.object({
  guid:        z.string().min(1),
  title:       z.string().min(1),
  sourceUrl:   z.string().url(),
  publishedAt: z.string().datetime(),
  imageUrl:    z.string().url().nullable(),
  category:    categorySchema,
})

export type RssItem = z.infer<typeof rssItemSchema>
```

### Step 2 — RSS Fetch Utility

Create `server/utils/fetch-rss.ts`: Fetches and parses one RSS feed. Returns validated `RssItem[]`.

- Requirements:
  - Predefine the `RSS_URLS` constant mapping category to its RSS feed URL.
  - Inline `extractGuid` function for extracting the GUID from the RSS item.
  - Main async `fetchRssFeed` function accepts category:Category which we've defined as a parameter.
  - Error handling for network issues and invalid responses.
  - Parses XML with `fast-xml-parser`.
  - Validates and transforms parsed data into `RssItem[]` using Zod schemas.

Currently add log for manual call debugging, later the Nitro task will call this utility and pass the results to Trigger.dev.

## Out of scope

- Nitro task integration
- Persisting the ingested items into the database
- Building a UI for displaying signals

## Check When Done

- Validators for RSS feed and items are implemented.
- Fetch RSS utility successfully retrieves, parses, validates, and transforms RSS feed data into the expected format.
- Fully typesafe with no TypeScript errors.
- `pnpm run lint:fix` passes
- `pnpm run build` passes.