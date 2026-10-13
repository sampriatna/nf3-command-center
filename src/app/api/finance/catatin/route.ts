import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Catatin data is provided only as a reviewed aggregate snapshot stored
// in an ENCRYPTED, SERVER-ONLY Vercel environment variable.
// This route performs ZERO Catatin network requests and ZERO database writes.
const BUSINESSES = [
  "e23ed572-234c-4995-acad-fa6bff7c58d2",
  "e37505c1-f5b8-480f-810e-6c1e8c288933",
] as const;

type Business = {
  businessId: string; business: string;
  cashIn: number; cashOut: number; cashDifference: number;
  excludedTransfers: number; recordedTransactions: number;
  excludedAdjustmentsIn: number; excludedAdjustmentsOut: number;
  excludedAdjustmentCount: number;
};
type Category = {
  businessId: string; business: string; type: "in" | "out";
  name: string; accountingGroup: string;
  mapped: boolean; amount: number; count: number;
};
type Trend = { businessId: string; date: string; cashIn: number; cashOut: number };
type Period = {
  from: string; through: string; days: number;
  business: Business[]; categories: Category[]; trend: Trend[];
};
type Snapshot = {
  version: 1; asOf: string; capturedAt: string;
  source: string; reports: Record<string, Period>;
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
const isoDay = (day: unknown): day is string =>
  typeof day === "string" && /^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(day);

function validPeriod(p: Period, days: number, asOf: string) {
  if (!p || p.days !== days || !isoDay(p.from) || p.through !== asOf) return false;
  if (!Array.isArray(p.business) || !Array.isArray(p.categories) || !Array.isArray(p.trend)) return false;
  if (!p.business.every((r) =>
    BUSINESSES.includes(r.businessId as typeof BUSINESSES[number]) &&
    ["cashIn", "cashOut", "cashDifference", "excludedTransfers", "recordedTransactions",
      "excludedAdjustmentsIn", "excludedAdjustmentsOut", "excludedAdjustmentCount"]
      .every((field) => Number.isFinite(r[field as keyof Business]))
  )) return false;
  if (!p.categories.every((r) =>
    BUSINESSES.includes(r.businessId as typeof BUSINESSES[number]) &&
    (r.type === "in" || r.type === "out") &&
    typeof r.name === "string" && r.name.length < 160 &&
    typeof r.mapped === "boolean" &&
    Number.isFinite(r.amount) && Number.isFinite(r.count) &&
    r.amount >= 0 && r.count >= 0
  )) return false;
  return p.trend.every((r) =>
    BUSINESSES.includes(r.businessId as typeof BUSINESSES[number]) &&
    isoDay(r.date) && Number.isFinite(r.cashIn) && Number.isFinite(r.cashOut)
  );
}

export async function GET(request: NextRequest) {
  // Allow only a verified NF3 Auth owner. Do NOT trust user_metadata or
  // editable role tables for finance access.
  const allowEmails = (process.env.NF3_FINANCE_OWNER_EMAILS ?? "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const allowIds = (process.env.NF3_FINANCE_OWNER_USER_IDS ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  if (!allowEmails.length && !allowIds.length) {
    return json({ code: "OWNER_NOT_CONFIGURED", error: "Akses Finance owner belum disiapkan." }, 503);
  }

  const store = await cookies();
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return store.getAll(); },
        setAll(changes: { name: string; value: string; options?: CookieOptions }[]) {
          for (const { name, value, options } of changes) store.set(name, value, options);
        },
      },
    }
  );
  const { data: { user }, error } = await auth.auth.getUser();
  if (error || !user) return json({ code: "UNAUTHENTICATED", error: "Login terlebih dahulu." }, 401);
  const matchId = allowIds.includes(user.id);
  const matchEmail = Boolean(
    user.email_confirmed_at && user.email &&
    allowEmails.includes(user.email.toLowerCase())
  );
  if (!matchId && !matchEmail) {
    return json({ code: "FORBIDDEN", error: "Laporan hanya untuk owner." }, 403);
  }

  const selectedDays = Number(new URL(request.url).searchParams.get("days") ?? "30");
  if (![7, 30, 90].includes(selectedDays)) {
    return json({ code: "BAD_RANGE", error: "Periode tersedia: 7, 30, atau 90 hari." }, 400);
  }

  const rawSnapshot = process.env.CATATIN_FINANCE_SNAPSHOT_JSON;
  if (!rawSnapshot) {
    return json({
      code: "SNAPSHOT_NOT_CONFIGURED",
      error: "Snapshot kategori Catatin belum tersedia. Tidak ada data Catatin yang diubah.",
    }, 503);
  }
  try {
    const snapshot = JSON.parse(rawSnapshot) as Snapshot;
    if (
      snapshot.version !== 1 || !isoDay(snapshot.asOf) ||
      typeof snapshot.capturedAt !== "string" ||
      !snapshot.reports ||
      ![7, 30, 90].every((days) =>
        validPeriod(snapshot.reports[String(days)], days, snapshot.asOf)
      )
    ) throw new Error("invalid snapshot");

    const result = snapshot.reports[String(selectedDays)];
    return json({
      source: "Catatin · snapshot read-only (tidak real-time)",
      asOf: snapshot.asOf,
      capturedAt: snapshot.capturedAt,
      from: result.from,
      through: result.through,
      days: selectedDays,
      business: result.business,
      categories: result.categories,
      trend: result.trend,
      disclaimer: "Ringkasan kas tercatat tanpa transfer antar-dompet dan koreksi Sesuaikan Saldo. Bukan laporan live, omzet POS, atau laba bersih. Kategori belum dipetakan tetap ditampilkan.",
    });
  } catch {
    return json({
      code: "INVALID_SNAPSHOT",
      error: "Format snapshot Catatin tidak valid. Data tidak ditampilkan untuk mencegah salah hitung.",
    }, 503);
  }
}
