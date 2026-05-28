# Objective

Implement a Nitro task that runs twice daily (08:00 and 20:00) to fetch the Yahoo News RSS feeds for `finance`, `tech`, and `world` categories. The task should parse the RSS XML, de-duplicate and transform the validated data.

For testing, the nitro task can manually be triggered directly to verify that it correctly fetches the RSS feed, processes the articles, and applies deduplication logic based on the `guid` field.

Nitro task is enabled in `nuxt.config.ts` under `nitro.experimental.tasks`.

# Implementation

## Step 1 - Extract database query for guid deduplication

- Create `server/database/queries/signal.ts` with a function `findSignalByGuid` that queries the `signal` table for an existing row with the same `guid`.

## Step 2 - Define the RSS item validator for the refinery payload

- Add `refineryPayloadSchema` to `shared/validators/rss.ts` to validate the shape of the data being sent to the refinery pipeline.
- It should include the following fields:
  - guid
  - title
  - sourceUrl
  - publishedAt (datetime string)
  - imageUrl (nullable string)
  - category

## Step 3 - Implement Nitro Task for RSS Ingestion

In the Nitro task, use `guid` de-duplication to prevent duplicate signals from appearing in the feed when the same article is scraped multiple times.

- Add meta name: "rss-ingestion" and description: "Fetch Yahoo News RSS feeds and trigger the refinery pipeline for new articles."
- Processing the RSS feed by using `fetchRssFeed` utility function to fetch and parse the RSS XML for each category.
- De-duplicate articles by using `findSignalByGuid`.
- Limit the number of RSS feeds fetched per category to 5.
- Validate the data against `refineryPayloadSchema` before triggering the refinery pipeline.
- Add human readable logging with information about the processing steps and any skipped duplicates.

# Out of Scope

- Insert any data into the database.
- Implement the Trigger.dev job that processes each article (this will be covered in the next task).

# Check When Done

- The Nitro task successfully fetches and parses the RSS feed.
- The deduplication logic correctly identifies and skips articles with duplicate `guid`.
- Total counts of RSS items should under or equal to 5 per category.
- A test task is available to run the RSS fetching and processing logic directly for verification.