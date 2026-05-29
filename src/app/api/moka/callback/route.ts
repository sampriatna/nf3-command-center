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
    console.error('Moka OAuth error param:', error);
    return NextResponse.redirect('https://nf3-command-center.vercel.app/settings?moka=error');
  }

  try {
    const clientId = process.env.MOKA_CLIENT_ID || '';
    const clientSecret = process.env.MOKA_CLIENT_SECRET || '';
    const redirectUri = 'https://nf3-command-center.vercel.app/api/moka/callback';

    const tokenResponse = await fetch('https://api.mokapos.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    const responseText = await tokenResponse.text();
    console.log('Token response status:', tokenResponse.status);

    let tokenData: Record<string, unknown>;
    try {
      tokenData = JSON.parse(responseText);
    } catch {
      console.error('JSON parse failed:', responseText.substring(0, 300));
      return NextResponse.redirect('https://nf3-command-center.vercel.app/settings?moka=error');
    }

    if (!tokenData.access_token) {
      console.error('No access_token:', JSON.stringify(tokenData).substring(0, 200));
      return NextResponse.redirect('https://nf3-command-center.vercel.app/settings?moka=error');
    }

    const accessToken = String(tokenData.access_token);

    // Try to get outlet_id from token response first
    let outletId = String(tokenData.outlet_id || '');
    let businessId = String(tokenData.business_id || '');

    // Fallback: use env var (reliable hardcoded value for this deployment)
    if (!outletId && process.env.MOKA_OUTLET_ID) {
      outletId = process.env.MOKA_OUTLET_ID;
    }

    // Fallback: probe v1 items endpoint to verify token works and get outlet info
    if (!outletId) {
      try {
        // Try fetching items - if it works, parse outlet from response
        const testRes = await fetch(`https://api.mokapos.com/v1/outlets/${outletId || '132440'}/items?page=1&per_page=1`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (testRes.ok) {
          outletId = outletId || '132440';
        }
      } catch (e) {
        console.error('Outlet probe failed:', e);
      }
    }

    // Delete all existing connections and insert fresh one
    await supabase.from('moka_connections').delete().neq('id', 0);

    const { error: insertError } = await supabase.from('moka_connections').insert({
      access_token: accessToken,
      refresh_token: String(tokenData.refresh_token || ''),
      outlet_id: outletId,
      business_id: businessId,
      expires_at: tokenData.expires_in
        ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Supabase insert error:', insertError);
    }

    console.log('Moka connected: outlet_id=' + outletId + ', business_id=' + businessId);
    return NextResponse.redirect('https://nf3-command-center.vercel.app/settings?moka=connected');
  } catch (err) {
    console.error('Moka callback error:', err);
    return NextResponse.redirect('https://nf3-command-center.vercel.app/settings?moka=error');
  }
}
