import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const client = postgres(env.DATABASE_URL, { max: 1 })

export const db = drizzle(client, {
  casing: 'snake_case',
  schema,
})
