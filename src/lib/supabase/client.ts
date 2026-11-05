import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'
import { getSupabaseEnv } from './env'

/** Supabase client for Client Components. createBrowserClient returns a singleton. */
export function createClient() {
  const { url, publishableKey } = getSupabaseEnv()
  return createBrowserClient<Database>(url, publishableKey)
}
