import type { DbClient } from '../index'
import type { InsertTag as InsertTagType } from '../schema'
import { sql } from 'drizzle-orm'
import { db } from '../index'
import { InsertTag, tag } from '../schema'

export async function insertTag(
  insertable: InsertTagType,
  client: DbClient = db,
) {
  const parsed = InsertTag.safeParse(insertable)
  if (!parsed.success) {
    throw new Error(`insertTag: invalid payload — ${parsed.error.message}`)
  }

  const [inserted] = await client
    .insert(tag)
    .values(parsed.data)
    .onConflictDoUpdate({
      target: tag.name,
      set: { name: sql`excluded.name` },
    })
    .returning()
  if (!inserted) {
    throw new Error('insertTag: no row returned')
  }
  return inserted
}
