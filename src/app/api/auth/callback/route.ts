import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const SUPER_ADMIN_EMAILS = ['sampriatna@gmail.com']

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const user = data.user
      const role = SUPER_ADMIN_EMAILS.includes(user.email ?? '') ? 'super_admin' : 'pending'

      // Upsert user_roles — insert on first login, skip update if already assigned
      try {
        await supabase.from('user_roles').upsert(
          { user_id: user.id, role, email: user.email },
          { onConflict: 'user_id', ignoreDuplicates: true }
        )
      } catch (_e) {
        // non-fatal
      }

      // Log activity
      try {
        await supabase.from('activity_log').insert({
          action: 'user_login',
          resource_type: 'auth',
          description: `User login: ${user.email}`,
        })
      } catch (_e) {
        // non-fatal
      }

      return NextResponse.redirect(`${origin}/pending`)
    }
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
