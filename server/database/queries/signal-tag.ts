import type { DbClient } from '../index'
import type { InsertSignalTag as InsertSignalTagType } from '../schema'
import { db } from '../index'
import { InsertSignalTag, signalTag } from '../schema'

export async function insertSignalTag(
  insertable: InsertSignalTagType,
  client: DbClient = db,
) {
  const parsed = InsertSignalTag.safeParse(insertable)
  if (!parsed.success) {
    throw new Error(`insertSignalTag: invalid payload — ${parsed.error.message}`)
  }

  const [inserted] = await client.insert(signalTag).values(parsed.data).returning()
  if (!inserted) {
    throw new Error('insertSignalTag: no row returned')
  }
  return inserted
}
