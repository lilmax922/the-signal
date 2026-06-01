import type { DbClient } from '../index'
import type { InsertSignal as InsertSignalType } from '../schema'
import { eq } from 'drizzle-orm'
import { db } from '../index'
import { InsertSignal, signal } from '../schema'

export async function findSignalByGuid(guid: string) {
  return db.query.signal.findFirst({
    columns: { id: true },
    where: eq(signal.guid, guid),
  })
}

export async function insertSignal(
  insertable: InsertSignalType,
  client: DbClient = db,
) {
  const parsed = InsertSignal.safeParse(insertable)
  if (!parsed.success) {
    throw new Error(`insertSignal: invalid payload — ${parsed.error.message}`)
  }

  const [inserted] = await client.insert(signal).values(parsed.data).returning()
  if (!inserted) {
    throw new Error('insertSignal: no row returned')
  }
  return inserted
}
