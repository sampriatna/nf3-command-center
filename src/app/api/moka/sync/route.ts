import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type MokaPayment = {
  id: string;
  created_at: string;
  total: number;
  payment_type: string;
  outlet_name?: string;
  receipt_number?: string;
};

async function getMokaToken(): Promise<{ access_token: string; outlet_id: string } | null> {
  const { data, error } = await supabase
    .from("moka_connections")
    .select("access_token, outlet_id")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const date = body?.date;

    // Get token from Supabase (OAuth)
    const conn = await getMokaToken();

    if (!conn) {
      return NextResponse.json(
        { error: "Moka belum terhubung. Silakan hubungkan Moka di halaman Settings." },
        { status: 400 }
      );
    }

    const { access_token: apiKey, outlet_id: outletId } = conn;
    const syncDate = date ?? new Date().toISOString().split("T")[0];

    const res = await fetch(
      `https://api.mokapos.com/v2/outlets/${outletId}/payment_reports?start_date=${syncDate}&end_date=${syncDate}&per_page=200`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Gagal mengambil data Moka", detail: err },
        { status: res.status }
      );
    }

    const mokaData = await res.json();
    const payments: MokaPayment[] = mokaData?.data ?? [];

    if (payments.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: `Tidak ada transaksi Moka pada ${syncDate}`,
      });
    }

    const transactions = payments.map((p) => ({
      date: syncDate,
      type: "income" as const,
      category: "Penjualan",
      business_unit: "F&B",
      brand: p.outlet_name ?? "Moka POS",
      amount: Math.round(p.total),
      description: `Moka sync - ${p.payment_type ?? "Penjualan"} (${p.id})`,
    }));

    const { data: inserted, error } = await supabase
      .from("finance_transactions")
      .upsert(transactions, {
        onConflict: "description",
        ignoreDuplicates: true,
      })
      .select();

    if (error) {
      return NextResponse.json(
        { error: "Gagal simpan ke Supabase", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      synced: inserted?.length ?? transactions.length,
      date: syncDate,
      message: `Berhasil sinkronisasi ${inserted?.length ?? transactions.length} transaksi dari Moka`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error", detail: String(err) },
      { status: 500 }
    );
  }
}
