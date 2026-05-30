# Objective

We need to call Free LLMs under the Trigger.dev task using the OpenRouter TypeScript SDK to generate de-noising news content.

The `@openrouter/sdk` package is already installed and api key is configured in the env file.

# Implementation

## Step 1 - Add LLM output validator

- Create `shared/validators/llm.ts`.
- Schema:
  - titleEn:   z.string().min(1),   // de-noised English title → used for slug generation
  - titleZh:   z.string().min(1),
  - contentEn: z.string().min(1),
  - contentZh: z.string().min(1),
  - summaryEn: z.array(z.string().min(1)).length(3),
  - summaryZh: z.array(z.string().min(1)).length(3),
  - tags:      z.array(z.string().min(1)).max(3),
- Export the `llmOutputSchema` and `LlmOutput` type.

## Step 2 - Create BuildPrompt utility function

- Create `trigger/utils/build-prompt.ts` file that will contain a utility function to build the prompt for the LLM call.
- The function accepts `title` and `content` params.
- Clearly assign LLM an role of a professional neutral news analyzer and tasks to be performed.
- De-noise title and content to new title, content with following rules, then generate tags, finally translate to traditional chinese.
- Prompt rules:
    - Remove emotional language, clickbait, and hyperbole.
    - Preserve all facts: numbers, names, dates, locations.
    - Translate to Traditional Chinese (zh-TW).
    - Never fabricate facts not in the source.
    - Tags: named entities only (company name, person name, or ticker symbol). Max 3.
- JSON output format by following `llmOutputSchema`.

## Step 3 - Single LLM Call

- Use `openrouter/typescript-sdk` in `trigger/refinery-agent.ts` to call LLM.
- Use `google/gemma-4-31b-it:free` model.
- Use `buildPrompt` utility function to build the prompt for the LLM call.
- Error handling with clear information:
  - Use `logger.error()` to log errors to the `trigger.dev` task, including clear error name, `guid`, `pipelineRunId`, and `err`.

# Out of Scope

- Store data to database.

# Check When Done

- The LLM output must match to `llmOutputSchema`.
- Title and content should de-noise with no clickbait, repetitive phrasing and emotional adjectives.
- Summary must each contain exactly 3 items.
- Tags must contain 1–3 items.
- Translate into Traditional Chinese.