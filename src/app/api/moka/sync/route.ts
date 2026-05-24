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
  };

export async function POST(req: NextRequest) {
    try {
          const { apiKey, outletId, date } = await req.json();

          if (!apiKey || !outletId) {
                  return NextResponse.json(
                            { error: "API Key dan Outlet ID wajib diisi" },
                            { status: 400 }
                          );
                }

          // Gunakan tanggal hari ini jika tidak disediakan
          const syncDate = date ?? new Date().toISOString().split("T")[0];

          // Ambil data transaksi dari Moka API v2
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

          // Transform data Moka ke format finance_transactions Supabase
          const transactions = payments.map((p) => ({
                  date: syncDate,
                  type: "income" as const,
                  category: "Penjualan",
                  business_unit: "F&B",
                  brand: p.outlet_name ?? "Moka POS",
                  amount: Math.round(p.total),
                  description: `Moka sync - ${p.payment_type ?? "Penjualan"} (${p.id})`,
                }));

          // Insert ke Supabase (skip duplicate by description)
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
