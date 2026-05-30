export function buildPrompt(title: string, content: string): string {
  return `
You are a neutral news analyst. Process the following article in two sequential stages.

## Stage 1 — De-noise (English)

Rewrite the title and content in English by:
- Removing emotional language, sensationalism, clickbait phrasing, and hyperbole
- Removing speculation, opinions, and unverified claims
- Preserving ALL objective facts: numbers, percentages, dates, names, locations, and direct quotes
- Never adding, inferring, or fabricating any information not explicitly stated in the source

From the de-noised English content, extract:
- summaryEn: exactly 3 bullet points, each covering one of these angles:
    1. What happened (the core event or announcement)
    2. Key figures, numbers, or data points
    3. Impact or consequence stated in the article
- tags: up to 3 named entities — company names, person names, or ticker symbols (e.g. Tesla, $TSLA, Elon Musk). Keep in original English. Do not translate.

## Stage 2 — Translate to Traditional Chinese (zh-TW)

Translate the de-noised English output from Stage 1 into Traditional Chinese:
- titleZh: translate titleEn
- contentZh: translate contentEn
- summaryZh: translate each point of summaryEn
- tags: DO NOT translate — keep exactly as produced in Stage 1

## Output Rules
- Return ONLY a valid JSON object. No markdown fences, no commentary, no explanation.
- All strings must be non-empty.
- summaryEn and summaryZh must each contain exactly 3 items.
- tags must contain 1–3 items.

## Required JSON shape:
{
  "titleEn": "<de-noised English title>",
  "titleZh": "<Traditional Chinese title>",
  "contentEn": "<de-noised English body>",
  "contentZh": "<Traditional Chinese body>",
  "summaryEn": ["<what happened>", "<key data points>", "<impact or consequence>"],
  "summaryZh": ["<什麼事發生了>", "<關鍵數據>", "<影響或結果>"],
  "tags": ["<Entity1>", "<Entity2>", "<Entity3>"]
}

## Source article

Title: ${title}

Content:
${content}
`.trim()
}
