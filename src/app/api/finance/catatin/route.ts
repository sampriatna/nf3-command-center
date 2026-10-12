import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
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
  category_name: string;
  accounting_group: string;
  is_mapped: boolean;
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
        setAll(changes: { name: string; value: string; options?: CookieOptions }[]) {
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

  // Deliberate extra switch: a credential alone must never activate Catatin access.
  if (process.env.NF3_FINANCE_CATATIN_ENABLE_READONLY !== "1") {
    return json({
      code: "CATATIN_INTEGRATION_DISABLED",
      error: "Integrasi Catatin belum diaktifkan karena pemeriksaan keamanan masih berlangsung.",
    }, 503);
  }

  const readonlyDatabaseUrl = process.env.CATATIN_READONLY_DATABASE_URL;
  if (!readonlyDatabaseUrl) {
    return json({
      code: "NOT_CONFIGURED",
      error: "Koneksi read-only Catatin belum dikonfigurasi; tidak ada perubahan ke Catatin.",
    }, 503);
  }

  // Reject privileged or misdirected credentials before opening any database connection.
  // Supabase direct: nf3_catatin_cashflow_ro@db.<project-ref>.supabase.co.
  // Supavisor pooler: nf3_catatin_cashflow_ro.<project-ref>@<region>.pooler.supabase.com.
  let safeConnection = false;
  try {
    const address = new URL(readonlyDatabaseUrl);
    const username = decodeURIComponent(address.username);
    const projectRef = "odugkllatrpxjerrjjxo";
    const hostname = address.hostname.toLowerCase();
    const direct =
      hostname === `db.${projectRef}.supabase.co` &&
      username === "nf3_catatin_cashflow_ro";
    const pooler =
      hostname.endsWith(".pooler.supabase.com") &&
      username === `nf3_catatin_cashflow_ro.${projectRef}`;
    safeConnection =
      ["postgres:", "postgresql:"].includes(address.protocol) && (direct || pooler);
  } catch {
    safeConnection = false;
  }
  if (!safeConnection) {
    return json({
      code: "UNSAFE_CATATIN_CREDENTIALS",
      error: "Kredensial laporan tidak cocok dengan akun baca-terbatas Catatin.",
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

    // Private daily CATEGORY aggregates only: no raw Catatin transactions.
    const result = await client.query<AggregateRow>(
      `SELECT business_id, day, flow_type, outlet, category_name,
              accounting_group, is_mapped, transaction_count, total_rp
         FROM nf3_finance_reporting.category_cashflow_v1
        WHERE business_id IN ($1::text, $2::text)
          AND day BETWEEN $3 AND $4
        ORDER BY day DESC, business_id, category_name`,
      [BUSINESSES[0].id, BUSINESSES[1].id, from, through]
    );

    await client.query("COMMIT");
    began = false;

    const byBusiness = BUSINESSES.map((business) => {
      const rows = result.rows.filter((r) => r.business_id === business.id);
      const sum = (type: FlowType) => rows.filter((r) => r.flow_type === type)
        .reduce((total, r) => total + Number(r.total_rp), 0);
      const count = (type: FlowType) => rows.filter((r) => r.flow_type === type)
        .reduce((total, r) => total + r.transaction_count, 0);
      return {
        businessId: business.id, business: business.name,
        cashIn: sum("in"), cashOut: sum("out"),
        cashDifference: sum("in") - sum("out"),
        excludedTransfers: count("transfer"),
        recordedTransactions: count("in") + count("out"),
      };
    });

    type CategoryTotal = {
      businessId: string; business: string; type: "in" | "out";
      name: string; accountingGroup: string; mapped: boolean;
      amount: number; count: number;
    };
    const categoryMap = new Map<string, CategoryTotal>();
    const trendMap = new Map<string, { businessId: string; date: string; cashIn: number; cashOut: number }>();
    for (const row of result.rows) {
      if (row.flow_type === "transfer") continue;
      const business = BUSINESSES.find((item) => item.id === row.business_id);
      if (!business) continue;
      const key = JSON.stringify([row.business_id, row.flow_type, row.category_name, row.accounting_group, row.is_mapped]);
      let entry = categoryMap.get(key);
      if (!entry) {
        entry = { businessId: business.id, business: business.name,
          type: row.flow_type, name: row.category_name,
          accountingGroup: row.accounting_group, mapped: row.is_mapped, amount: 0, count: 0 };
        categoryMap.set(key, entry);
      }
      entry.amount += Number(row.total_rp);
      entry.count += row.transaction_count;

      const trendKey = row.business_id + "|" + row.day;
      let trend = trendMap.get(trendKey);
      if (!trend) {
        trend = { businessId: business.id, date: row.day, cashIn: 0, cashOut: 0 };
        trendMap.set(trendKey, trend);
      }
      if (row.flow_type === "in") trend.cashIn += Number(row.total_rp);
      else trend.cashOut += Number(row.total_rp);
    }

    return json({
      source: "Catatin · ringkasan kategori read-only",
      from, through, days: selectedDays,
      business: byBusiness,
      categories: [...categoryMap.values()],
      trend: [...trendMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
      disclaimer: "Arus kas tercatat, bukan omzet POS atau laba bersih. Transfer internal dikecualikan. Kategori belum dipetakan ditampilkan terpisah.",
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
