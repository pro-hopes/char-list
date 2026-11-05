import type { NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    // Skip Next.js assets and any file with an extension (icons, images,
    // manifest.webmanifest) so the PWA can load them without a session.
    '/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)',
  ],
}
