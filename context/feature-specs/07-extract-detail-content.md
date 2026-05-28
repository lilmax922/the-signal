# Objective

`Trigger.dev` is already installed and configured in the project.

Extract news content by using `@extractus/article-extractor` from the data delivered via the nitro task.

# Implementation

## Step 1 - Create the refinery-agent task

- Create `trigger/refinery-agent.ts`.
- Validate incoming payload with `refineryPayloadSchema`.
- extract one article content using `@extractus/article-extractor` and remove any HTML tags.
- Log the extracted content.

## Step 2 - Trigger the refinery-agent task from the nitro task

- In the nitro task, trigger the refinery-agent task and pass the necessary data as payload.

# Out of Scope

- Storing any data in the database.

# Check When Done

- The nitro task successfully triggers the refinery-agent task with the correct payload.
- The refinery-agent task successfully receives the payload from the nitro task.
- The payload is validated against `refineryPayloadSchema` before processing.
- Extract one content and remove HTML tags correctly.
- Log the extracted content.