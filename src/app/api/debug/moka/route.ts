import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const envInfo = {
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasMokaClientId: !!process.env.MOKA_CLIENT_ID,
    hasMokaApiKey: !!process.env.MOKA_API_KEY,
  };

  const { data: anonData, error: anonError } = await supabase
    .from("moka_connections")
    .select("id, outlet_id, expires_at")
    .order("id", { ascending: false })
    .limit(3);

  const { data: connData } = await supabase
    .from("moka_connections")
    .select("access_token, outlet_id")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  let mokaTest: Record<string, unknown> = { skipped: "no token in DB" };

  if (connData?.access_token && connData?.outlet_id) {
    // Test v1 items endpoint with OAuth token
    const itemsRes = await fetch(
      `https://api.mokapos.com/v1/outlets/${connData.outlet_id}/items?page=1&per_page=5`,
      {
        headers: {
          Authorization: `Bearer ${connData.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const itemsBody = await itemsRes.json().catch(() => ({}));

    // Test v1 payment_reports with OAuth token
    const today = new Date().toISOString().split("T")[0];
    const paymentsRes = await fetch(
      `https://api.mokapos.com/v1/outlets/${connData.outlet_id}/payment_reports?start_date=${today}&end_date=${today}&per_page=5`,
      {
        headers: {
          Authorization: `Bearer ${connData.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const paymentsBody = await paymentsRes.json().catch(() => ({}));

    // Test with MOKA_API_KEY env var against v1
    let envKeyTest: Record<string, unknown> = { skipped: "no MOKA_API_KEY env" };
    if (process.env.MOKA_API_KEY) {
      const envRes = await fetch(
        `https://api.mokapos.com/v1/outlets/${connData.outlet_id}/items?page=1&per_page=5`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MOKA_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      const envBody = await envRes.json().catch(() => ({}));
      envKeyTest = { status: envRes.status, body: envBody };
    }

    mokaTest = {
      token_prefix: connData.access_token.substring(0, 60),
      outlet_id: connData.outlet_id,
      v1_items: { status: itemsRes.status, body: itemsBody },
      v1_payments: { status: paymentsRes.status, body: paymentsBody },
      env_key_v1: envKeyTest,
    };
  }

  return NextResponse.json({
    env: envInfo,
    connections: { data: anonData, error: anonError?.message },
    mokaTest,
  });
}
