import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

/**
 * Discord → Supabase → here with `?code=...`.
 * Exchanges the code for a session (PKCE verifier lives in a cookie) and sets auth cookies.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
    console.error('auth callback: exchangeCodeForSession failed', error.message);
  } else {
    // User cancelled on Discord, or the provider returned an error.
    console.error('auth callback: no code', searchParams.get('error_description') ?? searchParams.get('error'));
  }

  const reason = searchParams.get('error') === 'access_denied' ? 'denied' : 'failed';
  return NextResponse.redirect(`${origin}/login?error=${reason}`);
}
