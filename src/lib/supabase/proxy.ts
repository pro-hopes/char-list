import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from './env'

/** Refreshes the Supabase auth session and writes updated cookies to the response. */
export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabaseEnv()
  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
      },
    },
  })

  // Do not put code between createServerClient and getClaims():
  // getClaims() validates the token and triggers the refresh when it has expired.
  await supabase.auth.getClaims()

  return response
}
