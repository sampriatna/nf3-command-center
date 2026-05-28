import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)
  }

  // For both PKCE (code param) and implicit (hash) flows:
  // Redirect to /pending and let the Supabase client handle session setup.
  // PKCE: client will exchange ?code= automatically via detectSessionInUrl.
  // Implicit: client will parse the hash fragment.
  const code = searchParams.get('code')
  if (code) {
    // Pass code to pending page so Supabase client can exchange it
    return NextResponse.redirect(`${origin}/pending?code=${code}`)
  }

  return NextResponse.redirect(`${origin}/pending`)
}
