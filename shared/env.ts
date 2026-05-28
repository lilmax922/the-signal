import { z } from 'zod'
import tryParseEnv from './try-parse-env'

const EnvSchema = z.object({
  NUXT_PUBLIC_SUPABASE_URL: z.string(),
  NUXT_PUBLIC_SUPABASE_KEY: z.string(),
  DATABASE_URL: z.string(),
  TRIGGER_PROJECT_REF: z.string(),
  TRIGGER_SECRET_KEY: z.string(),
})

export type EnvSchema = z.infer<typeof EnvSchema>

tryParseEnv(EnvSchema)

// eslint-disable-next-line node/no-process-env
export default EnvSchema.parse(process.env)
