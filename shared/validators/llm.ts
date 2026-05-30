import { z } from 'zod'

export const llmOutputSchema = z.object({
  titleEn: z.string().min(1),
  titleZh: z.string().min(1),
  contentEn: z.string().min(1),
  contentZh: z.string().min(1),
  summaryEn: z.array(z.string().min(1)).length(3),
  summaryZh: z.array(z.string().min(1)).length(3),
  tags: z.array(z.string().min(1)).min(1).max(3),
})

export type LlmOutput = z.infer<typeof llmOutputSchema>
