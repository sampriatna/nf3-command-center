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

  if (!connData?.access_token) return NextResponse.json({ error: "no token" });

  const token = connData.access_token;
  const outlet = connData.outlet_id;
  const today = new Date().toISOString().split("T")[0];

  const paths = [
    `https://api.mokapos.com/v2/outlets/${outlet}/payment_reports?start_date=${today}&end_date=${today}`,
    `https://api.mokapos.com/v1/outlets/${outlet}/payment_reports?start_date=${today}&end_date=${today}&per_page=5`,
    `https://api.mokapos.com/v1/payment_reports?outlet_id=${outlet}&start_date=${today}&end_date=${today}`,
    `https://api.mokapos.com/v1/outlets/${outlet}/sales_summary?start_date=${today}&end_date=${today}`,
    `https://api.mokapos.com/v1/outlets/${outlet}/shifts?start_date=${today}&end_date=${today}`,
    `https://api.mokapos.com/v1/outlets`,
  ];

  const results: Record<string, unknown> = {};
  for (const url of paths) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const body = await r.json().catch(() => ({}));
    const key = url.replace(`https://api.mokapos.com`, "").split("?")[0];
    results[key] = { status: r.status, preview: JSON.stringify(body).substring(0, 200) };
  }

  return NextResponse.json({ outlet, today, results });
}
