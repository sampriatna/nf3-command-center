import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data: connData } = await supabase
    .from("moka_connections")
    .select("access_token, outlet_id")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  if (!connData?.access_token) {
    return NextResponse.json({ error: "no token" });
  }

  const token = connData.access_token;
  const outlet = connData.outlet_id;
  const today = new Date().toISOString().split("T")[0];

  const endpoints = [
    `/v1/outlets/${outlet}/payment_reports?start_date=${today}&end_date=${today}`,
    `/v1/outlets/${outlet}/transactions?start_date=${today}&end_date=${today}`,
    `/v1/outlets/${outlet}/reports/payments?start_date=${today}&end_date=${today}`,
    `/v1/outlets/${outlet}/sales?start_date=${today}&end_date=${today}`,
    `/v1/outlets/${outlet}/receipts?start_date=${today}&end_date=${today}`,
    `/v1/outlets/${outlet}/items?page=1&per_page=3`,
  ];

  const results: Record<string, unknown> = {};
  for (const path of endpoints) {
    const r = await fetch(`https://api.mokapos.com${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await r.json().catch(() => ({}));
    results[path.split("?")[0].replace(`/v1/outlets/${outlet}/`, "")] = {
      status: r.status,
      preview: JSON.stringify(body).substring(0, 200)
    };
  }

  return NextResponse.json({ outlet, today, results });
}
