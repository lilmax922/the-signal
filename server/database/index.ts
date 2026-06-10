import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import env from '../../shared/env'
import * as schema from './schema'

const client = postgres(env.DATABASE_URL, { prepare: false })

export const db = drizzle(client, {
  casing: 'snake_case',
  schema,
})

export type DbClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0]
