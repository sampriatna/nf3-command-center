import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Sync semua item dari Moka ke tabel products di Supabase
export async function POST(req: NextRequest) {
  try {
    const { apiKey, outletId } = await req.json();
    const key = apiKey ?? process.env.MOKA_API_KEY;
    const outlet = outletId ?? process.env.MOKA_OUTLET_ID;

    if (!key || !outlet) {
      return NextResponse.json(
        { error: "MOKA_API_KEY dan MOKA_OUTLET_ID wajib ada" },
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

    // Transform Moka item ke format products Supabase
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
      .from("products")
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
