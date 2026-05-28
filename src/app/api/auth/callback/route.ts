import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const SUPER_ADMIN_EMAILS = ['sampriatna@gmail.com']

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${error}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // PKCE: exchange code for session server-side
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: 'pkce' } }
  )

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const user = data.user
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user.email ?? '')
  const role = isSuperAdmin ? 'super_admin' : 'pending'

  // Upsert role — non-fatal
  try {
    await supabase.from('user_roles').upsert(
      { user_id: user.id, role, email: user.email },
      { onConflict: 'user_id', ignoreDuplicates: false }
    )
  } catch (_e) {}

  // Log activity — non-fatal
  try {
    await supabase.from('activity_log').insert({
      action: 'user_login',
      resource_type: 'auth',
      description: `User login: ${user.email}`,
    })
  } catch (_e) {}

  // Super admin goes straight to dashboard, others wait for approval
  if (isSuperAdmin) {
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // Check if existing role is already approved
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleData && roleData.role !== 'pending') {
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  return NextResponse.redirect(`${origin}/pending`)
}
