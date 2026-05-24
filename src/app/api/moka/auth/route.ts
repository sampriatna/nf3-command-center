import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.MOKA_CLIENT_ID || process.env.MOKA_API_KEY || '';
  const redirectUri = 'https://nf3-command-center.vercel.app/api/moka/callback';
  
  const authUrl = new URL('https://api.mokapos.com/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  
  return NextResponse.redirect(authUrl.toString());
}
