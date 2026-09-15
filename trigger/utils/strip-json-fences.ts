/**
 * Strip a single Markdown code fence (``` or ```json) wrapping LLM output.
 * Returns the input unchanged when it is not fenced, so bare JSON
 * passes through untouched. Non-JSON content still fails at JSON.parse
 * downstream with LLM_OUTPUT_INVALID.
 */
export function stripJsonFences(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('```') || !trimmed.endsWith('```') || trimmed.length < 6)
    return trimmed
  return trimmed
    .slice(3, -3) // drop the opening and closing fences
    .replace(/^[a-z]+\s*/i, '') // drop the optional language tag (e.g. json)
    .trim()
}
