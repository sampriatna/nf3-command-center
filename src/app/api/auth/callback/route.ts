import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const SUPER_ADMIN_EMAILS = ['sampriatna@gmail.com']

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // Handle OAuth errors from provider
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${error}`)
  }

  // Implicit flow: no code param, tokens are in URL hash (client-side only)
  // Just redirect to /pending - the client will parse the hash and set the session
  if (!code) {
    return NextResponse.redirect(`${origin}/pending`)
  }

  // PKCE flow: exchange code for session
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  
  if (!exchangeError && data.user) {
    const user = data.user
    const role = SUPER_ADMIN_EMAILS.includes(user.email ?? '') ? 'super_admin' : 'pending'

    try {
      await supabase.from('user_roles').upsert(
        { user_id: user.id, role, email: user.email },
        { onConflict: 'user_id', ignoreDuplicates: true }
      )
    } catch (_e) { /* non-fatal */ }

    try {
      await supabase.from('activity_log').insert({
        action: 'user_login',
        resource_type: 'auth',
        description: `User login: ${user.email}`,
      })
    } catch (_e) { /* non-fatal */ }

    return NextResponse.redirect(`${origin}/pending`)
  }

  return NextResponse.redirect(`${origin}/pending`)
}
