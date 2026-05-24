import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect('https://nf3-command-center.vercel.app/settings?moka=error');
  }

  try {
    const clientId = process.env.MOKA_CLIENT_ID || process.env.MOKA_API_KEY || '';
    const clientSecret = process.env.MOKA_CLIENT_SECRET || process.env.MOKA_OUTLET_ID || '';
    const redirectUri = 'https://nf3-command-center.vercel.app/api/moka/callback';

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.mokapos.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      return NextResponse.redirect('https://nf3-command-center.vercel.app/settings?moka=error');
    }

    // Get outlet info
    let outletId = tokenData.outlet_id || '';
    if (!outletId) {
      const outletResponse = await fetch('https://api.mokapos.com/v2/outlets', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
      });
      const outletData = await outletResponse.json();
      outletId = outletData?.data?.[0]?.id || outletData?.data?.[0]?.outlet_id || '';
    }

    // Save to Supabase
    await supabase.from('moka_connections').delete().neq('id', 0);
    await supabase.from('moka_connections').insert({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || '',
      outlet_id: outletId,
      business_id: tokenData.business_id || '',
      expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.redirect('https://nf3-command-center.vercel.app/settings?moka=connected');
  } catch (err) {
    console.error('Moka callback error:', err);
    return NextResponse.redirect('https://nf3-command-center.vercel.app/settings?moka=error');
  }
}
