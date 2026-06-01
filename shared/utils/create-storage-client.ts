import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import env from '../env'

let cachedClient: SupabaseClient | undefined

export function createStorageClient(): SupabaseClient {
  if (!cachedClient) {
    cachedClient = createClient(env.NUXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
  return cachedClient
}
