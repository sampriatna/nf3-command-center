import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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

// Sync semua item dari Moka ke tabel inventory_products di Supabase
export async function POST(req: NextRequest) {
    try {
          const body = await req.json().catch(() => ({}));

      // Prioritas: OAuth token dari Supabase, fallback ke body jika ada
      let key: string | undefined;
          let outlet: string | undefined;

      const conn = await getMokaToken();
          if (conn) {
                  key = conn.access_token;
                  outlet = conn.outlet_id;
          } else {
                  // Fallback ke manual input (untuk testing/setup awal)
            key = body.apiKey ?? process.env.MOKA_API_KEY;
                  outlet = body.outletId ?? process.env.MOKA_OUTLET_ID;
          }

      if (!key || !outlet) {
              return NextResponse.json(
                { error: "Moka belum terhubung. Silakan hubungkan Moka di halaman Settings atau masukkan API Key." },
                { status: 400 }
                      );
      }

      // Ambil semua halaman items dari Moka
      let allItems: MokaItem[] = [];
          let page = 1;
          let hasMore = true;

      while (hasMore) {
              const res = await fetch(
                        `https://api.mokapos.com/v2/outlets/${outlet}/items?page=${page}&per_page=100`,
                {
                            headers: {
                                          Authorization: `Bearer ${key}`,
                                          "Content-Type": "application/json",
                            },
                }
                      );

            if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      return NextResponse.json(
                        { error: "Gagal ambil items dari Moka", detail: err },
                        { status: res.status }
                                );
            }

            const data = await res.json();
              const items: MokaItem[] = data?.data ?? [];
              allItems = [...allItems, ...items];

            const meta = data?.meta ?? {};
              hasMore = page < (meta.total_pages ?? 1);
              page++;
      }

      if (allItems.length === 0) {
              return NextResponse.json({ success: true, synced: 0, message: "Tidak ada item di Moka" });
      }

      // Transform Moka item ke format inventory_products Supabase
      const products = allItems.map((item) => ({
              moka_item_id: String(item.id),
              name: item.name ?? "Tanpa Nama",
              sku: item.sku ?? item.barcode ?? `MOKA-${item.id}`,
              category: item.category?.name ?? "Menu F&B",
              unit: item.unit ?? "pcs",
              business_unit: "F&B",
              price_sell: item.price ?? item.selling_price ?? 0,
              current_stock: item.stock ?? 0,
              min_stock: item.min_stock ?? 0,
              location: item.outlet_name ?? "Moka POS",
      }));

      // Upsert ke Supabase berdasarkan moka_item_id
      const { data: upserted, error } = await supabase
            .from("inventory_products")
            .upsert(products, { onConflict: "moka_item_id", ignoreDuplicates: false })
            .select();

      if (error) {
              return NextResponse.json(
                { error: "Gagal simpan ke Supabase", detail: error.message },
                { status: 500 }
                      );
      }

      return NextResponse.json({
              success: true,
              synced: upserted?.length ?? products.length,
              total_moka: allItems.length,
              message: `Berhasil sync ${upserted?.length ?? products.length} produk dari Moka`,
      });
    } catch (err) {
          return NextResponse.json(
            { error: "Internal server error", detail: String(err) },
            { status: 500 }
                );
    }
}

type MokaItem = {
    id: string | number;
    name?: string;
    sku?: string;
    barcode?: string;
    price?: number;
    selling_price?: number;
    stock?: number;
    min_stock?: number;
    unit?: string;
    outlet_name?: string;
    category?: { name?: string };
};
