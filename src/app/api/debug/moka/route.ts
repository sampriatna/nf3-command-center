import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasMokaClientId = !!process.env.MOKA_CLIENT_ID;
  
  // Test koneksi dengan anon key
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: anonData, error: anonError } = await anonClient
    .from("moka_connections")
    .select("id, outlet_id, expires_at")
    .limit(1);
  
  // Test koneksi dengan service role key jika ada
  let serviceData = null;
  let serviceError = null;
  if (hasServiceKey) {
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const result = await serviceClient
      .from("moka_connections")
      .select("id, outlet_id, expires_at")
      .limit(1);
    serviceData = result.data;
    serviceError = result.error?.message;
  }
  
  return NextResponse.json({
    env: { hasServiceKey, hasAnonKey, hasMokaClientId },
    anon: { data: anonData, error: anonError?.message },
    service: { data: serviceData, error: serviceError },
  });
}
