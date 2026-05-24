import { defineConfig } from 'drizzle-kit'
import env from './shared/env'

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/database/schema/index.ts',
  out: './server/database/migrations',
  casing: 'snake_case',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
