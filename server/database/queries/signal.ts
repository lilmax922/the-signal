import { eq } from 'drizzle-orm'
import { db } from '../index'
import { signal } from '../schema'

export async function findSignalByGuid(guid: string) {
  return db.query.signal.findFirst({
    columns: { id: true },
    where: eq(signal.guid, guid),
  })
}
