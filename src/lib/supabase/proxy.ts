import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from './env'

/** Paths reachable without a session. */
const PUBLIC_PATHS = ['/login', '/auth/']

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p.endsWith('/') ? p : `${p}/`))
}

/**
 * Refreshes the Supabase auth session, writes updated cookies to the response,
 * and redirects signed-out users to /login.
 */
export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabaseEnv()
  let response = NextResponse.next({ request })
  let cacheHeaders: Record<string, string> = {}

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
        cacheHeaders = headers
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
      },
    },
  })

  // Do not put code between createServerClient and getClaims():
  // getClaims() validates the token and triggers the refresh when it has expired.
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims && !isPublic(request.nextUrl.pathname)) {
    const redirect = NextResponse.redirect(new URL('/login', request.url))
    // Keep any cookie changes (e.g. cleared invalid session) on the redirect.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    Object.entries(cacheHeaders).forEach(([key, value]) => redirect.headers.set(key, value))
    return redirect
  }

  return response
}
