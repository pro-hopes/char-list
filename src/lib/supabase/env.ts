// Literal `process.env.NEXT_PUBLIC_*` accesses are required so Next.js can
// inline them into the client bundle.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export function getSupabaseEnv() {
  if (!url || !publishableKey) {
    throw new Error(
      'Supabase env is missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    )
  }
  return { url, publishableKey }
}
