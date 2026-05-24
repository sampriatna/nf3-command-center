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
                                                    headers: {
                                                            'Content-Type': 'application/json',
                                                                    'Accept': 'application/json'
                                                                          },
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
                                                                                                                                              console.log('Token response body preview:', responseText.substring(0, 300));

                                                                                                                                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                                                                                                      let tokenData: any;
                                                                                                                                                          try {
                                                                                                                                                                tokenData = JSON.parse(responseText);
                                                                                                                                                                    } catch {
                                                                                                                                                                          console.error('JSON parse failed, raw response:', responseText.substring(0, 500));
                                                                                                                                                                                return NextResponse.redirect('https://nf3-command-center.vercel.app/settings?moka=error');
                                                                                                                                                                                    }

                                                                                                                                                                                        if (!tokenData.access_token) {
                                                                                                                                                                                              console.error('No access_token in response:', JSON.stringify(tokenData).substring(0, 200));
                                                                                                                                                                                                    return NextResponse.redirect('https://nf3-command-center.vercel.app/settings?moka=error');
                                                                                                                                                                                                        }

                                                                                                                                                                                                            let outletId = String(tokenData.outlet_id || '');
                                                                                                                                                                                                                if (!outletId) {
                                                                                                                                                                                                                      try {
                                                                                                                                                                                                                              const outletResponse = await fetch('https://api.mokapos.com/v2/outlets', {
                                                                                                                                                                                                                                        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
                                                                                                                                                                                                                                                });
                                                                                                                                                                                                                                                        const outletData = await outletResponse.json();
                                                                                                                                                                                                                                                                outletId = String(outletData?.data?.[0]?.id || outletData?.data?.[0]?.outlet_id || '');
                                                                                                                                                                                                                                                                      } catch (e) {
                                                                                                                                                                                                                                                                              console.error('Failed to get outlet:', e);
                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                        }

                                                                                                                                                                                                                                                                                            await supabase.from('moka_connections').delete().neq('id', 0);
                                                                                                                                                                                                                                                                                                const { error: insertError } = await supabase.from('moka_connections').insert({
                                                                                                                                                                                                                                                                                                      access_token: tokenData.access_token,
                                                                                                                                                                                                                                                                                                            refresh_token: tokenData.refresh_token || '',
                                                                                                                                                                                                                                                                                                                  outlet_id: outletId,
                                                                                                                                                                                                                                                                                                                        business_id: String(tokenData.business_id || ''),
                                                                                                                                                                                                                                                                                                                              expires_at: tokenData.expires_in
                                                                                                                                                                                                                                                                                                                                      ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
                                                                                                                                                                                                                                                                                                                                              : null,
                                                                                                                                                                                                                                                                                                                                                    updated_at: new Date().toISOString(),
                                                                                                                                                                                                                                                                                                                                                        });

                                                                                                                                                                                                                                                                                                                                                            if (insertError) {
                                                                                                                                                                                                                                                                                                                                                                  console.error('Supabase insert error:', insertError);
                                                                                                                                                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                                                                                                                                                          return NextResponse.redirect('https://nf3-command-center.vercel.app/settings?moka=connected');
                                                                                                                                                                                                                                                                                                                                                                            } catch (err) {
                                                                                                                                                                                                                                                                                                                                                                                console.error('Moka callback error:', err);
                                                                                                                                                                                                                                                                                                                                                                                    return NextResponse.redirect('https://nf3-command-center.vercel.app/settings?moka=error');
                                                                                                                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                                                                                                                      }