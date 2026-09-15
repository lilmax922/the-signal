import { z } from 'zod'
import tryParseEnv from './try-parse-env'

const EnvSchema = z.object({
  NUXT_PUBLIC_SUPABASE_URL: z.string(),
  NUXT_PUBLIC_SUPABASE_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  DATABASE_URL: z.string(),
  DATABASE_URL_DIRECT: z.string(),
  TRIGGER_PROJECT_REF: z.string(),
  TRIGGER_SECRET_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string(),
  // Monthly purge mode: 'true' (default) counts only and deletes nothing;
  // set to 'false' in the Trigger.dev environment to arm real deletes after
  // reviewing a dry-run's reported counts.
  PURGE_DRY_RUN: z.enum(['true', 'false']).default('true'),
})

export type EnvSchema = z.infer<typeof EnvSchema>

tryParseEnv(EnvSchema)

// eslint-disable-next-line node/no-process-env
export default EnvSchema.parse(process.env)
