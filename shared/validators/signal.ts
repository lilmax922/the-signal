import { z } from 'zod'

export const CategorySchema = z.enum(['finance', 'tech', 'world'])

export type Category = z.infer<typeof CategorySchema>
