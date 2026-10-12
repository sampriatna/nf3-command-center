import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Client } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Verified Catatin business IDs. Do not write to this source.
const BUSINESSES = [
  { id: "e23ed572-234c-4995-acad-fa6bff7c58d2", name: "Nusa Food" },
  { id: "e37505c1-f5b8-480f-810e-6c1e8c288933", name: "NF Nusa Fishing" },
] as const;

type FlowType = "in" | "out" | "transfer";
type AggregateRow = {
  business_id: string;
  day: string;
  flow_type: FlowType;
  outlet: string;
  transaction_count: number;
  total_rp: string;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

function jakartaToday() {
  const shifted = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function dateMinusDays(day: string, days: number) {
  const value = new Date(day + "T00:00:00.000Z");
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  // Fail closed. Do not infer owner privileges from mutable user_metadata
  // or the legacy user_roles table (its historical update policy is broad).
  const allowedEmails = (process.env.NF3_FINANCE_OWNER_EMAILS ?? "")
    .split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  const allowedIds = (process.env.NF3_FINANCE_OWNER_USER_IDS ?? "")
    .split(",").map((item) => item.trim()).filter(Boolean);

  if (allowedEmails.length === 0 && allowedIds.length === 0) {
    return json({ code: "OWNER_NOT_CONFIGURED", error: "Akses owner Finance belum dikonfigurasi." }, 503);
  }

  const cookieStore = await cookies();
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(changes) {
          changes.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError || !user) return json({ code: "UNAUTHENTICATED", error: "Login terlebih dahulu." }, 401);

  const ownerById = allowedIds.includes(user.id);
  const ownerByEmail = Boolean(
    user.email_confirmed_at && user.email && allowedEmails.includes(user.email.toLowerCase())
  );
  if (!ownerById && !ownerByEmail) {
    return json({ code: "FORBIDDEN", error: "Laporan Catatin khusus owner." }, 403);
  }

  const readonlyDatabaseUrl = process.env.CATATIN_READONLY_DATABASE_URL;
  if (!readonlyDatabaseUrl) {
    return json({
      code: "NOT_CONFIGURED",
      error: "Koneksi read-only Catatin belum dikonfigurasi; tidak ada perubahan ke Catatin.",
    }, 503);
  }

  const selectedDays = Number(new URL(request.url).searchParams.get("days") ?? "30");
  if (![7, 30, 90].includes(selectedDays)) {
    return json({ code: "BAD_RANGE", error: "Rentang hanya 7, 30, atau 90 hari." }, 400);
  }

  const through = jakartaToday();
  const from = dateMinusDays(through, selectedDays - 1);
  const client = new Client({
    connectionString: readonlyDatabaseUrl,
    connectionTimeoutMillis: 6000,
    query_timeout: 8000,
    statement_timeout: 8000,
    application_name: "nf3_catatin_finance_readonly",
    ssl: { rejectUnauthorized: true },
  });

  let began = false;
  try {
    await client.connect();
    // Database-enforced READ ONLY, even if the supplied credential is overprivileged.
    // Production setup must ALSO use a dedicated SELECT-only database role.
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    began = true;

    const result = await client.query<AggregateRow>(
      `SELECT
          business_id::text,
          data->>'date' AS day,
          data->>'type' AS flow_type,
          COALESCE(NULLIF(data->>'outletCode', ''), 'Tidak ditentukan') AS outlet,
          COUNT(*)::integer AS transaction_count,
          SUM((data->>'amount')::numeric)::text AS total_rp
        FROM public.app_transactions
        WHERE business_id IN ($1::uuid, $2::uuid)
          AND data->>'date' BETWEEN $3 AND $4
          AND data->>'date' ~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$'
          AND data->>'amount' ~ '^[0-9]+(\\.[0-9]+)?$'
          AND data->>'type' IN ('in', 'out', 'transfer')
        GROUP BY business_id, day, flow_type, outlet
        ORDER BY day DESC, business_id, outlet`,
      [BUSINESSES[0].id, BUSINESSES[1].id, from, through]
    );

    await client.query("COMMIT");
    began = false;

    const byBusiness = BUSINESSES.map((business) => {
      const records = result.rows.filter((row) => row.business_id === business.id);
      const sum = (type: FlowType) => records
        .filter((row) => row.flow_type === type)
        .reduce((acc, row) => acc + Number(row.total_rp), 0);
      const count = (type: FlowType) => records
        .filter((row) => row.flow_type === type)
        .reduce((acc, row) => acc + row.transaction_count, 0);

      return {
        businessId: business.id,
        business: business.name,
        cashIn: sum("in"),
        cashOut: sum("out"),
        cashDifference: sum("in") - sum("out"),
        excludedTransfers: count("transfer"),
        recordedTransactions: count("in") + count("out"),
      };
    });

    const daily = result.rows
      .filter((row) => row.flow_type !== "transfer")
      .map((row) => ({
        business: BUSINESSES.find((item) => item.id === row.business_id)?.name ?? "Tidak dikenal",
        date: row.day,
        outlet: row.outlet,
        type: row.flow_type,
        count: row.transaction_count,
        amount: Number(row.total_rp),
      }));

    return json({
      source: "Catatin · live read-only",
      from,
      through,
      days: selectedDays,
      business: byBusiness,
      daily,
      disclaimer: "Arus kas tercatat, bukan omzet POS atau laba bersih. Transfer internal dikeluarkan.",
    });
  } catch {
    if (began) {
      try { await client.query("ROLLBACK"); } catch { /* preserve original failure */ }
    }
    // Do not expose credentials, SQL errors, or financial records in logs or responses.
    return json({
      code: "CATATIN_READ_FAILED",
      error: "Data Catatin belum dapat dibaca. Periksa izin SELECT/RLS dan koneksi read-only.",
    }, 502);
  } finally {
    try { await client.end(); } catch { /* disconnected */ }
  }
}
