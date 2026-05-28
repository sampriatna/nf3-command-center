import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conn = await getMokaToken();
  if (!conn) {
    return NextResponse.json(
      { error: "Moka belum terhubung. Hubungkan Moka terlebih dahulu di halaman Settings." },
      { status: 400 }
    );
  }

  const { access_token: apiKey, outlet_id: outletId } = conn;
  const results: { task: string; status: string; detail?: string }[] = [];

  // === 1. Sync Products/Items ===
  // Moka dipakai oleh NF (Nusa Fishing) - business_unit = "NF"
  try {
    let allItems: MokaItem[] = [];
    let page = 1;
    let hasMore = true;
    let maxPages = 50; // batas maksimum untuk cegah infinite loop

    while (hasMore && maxPages-- > 0) {
      const res = await fetch(
        `https://api.mokapos.com/v2/outlets/${outletId}/items?page=${page}&per_page=100`,
        { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }
      );
      if (!res.ok) { hasMore = false; break; }
      const data = await res.json();
      const items: MokaItem[] = data?.data ?? [];
      allItems = [...allItems, ...items];
      const meta = data?.meta ?? {};
      hasMore = page < (meta.total_pages ?? 1);
      page++;
    }

    if (allItems.length > 0) {
      const products = allItems.map((item) => ({
        moka_item_id: String(item.id),
        name: item.name ?? "Tanpa Nama",
        sku: item.sku ?? item.barcode ?? `MOKA-${item.id}`,
        category: item.category?.name ?? "Menu NF",
        unit: item.unit ?? "pcs",
        business_unit: "NF",
        price_sell: item.price ?? item.selling_price ?? 0,
        current_stock: item.stock ?? 0,
        min_stock: item.min_stock ?? 0,
        location: item.outlet_name ?? "Moka POS",
      }));

      const { error } = await supabase
        .from("inventory_products")
        .upsert(products, { onConflict: "moka_item_id", ignoreDuplicates: false });

      if (error) {
        results.push({ task: "products", status: "error", detail: error.message });
      } else {
        results.push({ task: "products", status: "ok", detail: `${allItems.length} items synced` });
      }
    } else {
      results.push({ task: "products", status: "ok", detail: "0 items found" });
    }
  } catch (err) {
    results.push({ task: "products", status: "error", detail: String(err) });
  }

  // === 2. Sync Finance Transactions (today) ===
  // business_unit = "NF" karena Moka dipakai NF, konsisten dengan manual sync
  try {
    const today = new Date().toISOString().split("T")[0];

    const res = await fetch(
      `https://api.mokapos.com/v2/outlets/${outletId}/payment_reports?start_date=${today}&end_date=${today}&per_page=200`,
      { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }
    );

    if (res.ok) {
      const data = await res.json();
      const payments = data?.data ?? [];

      if (payments.length > 0) {
        const transactions = payments.map((p: Record<string, unknown>) => ({
          date: today,
          type: "income",
          category: "Penjualan",
          business_unit: "NF",
          brand: (p.outlet_name as string) ?? "Moka POS - NF",
          amount: Number(p.total ?? p.amount ?? 0),
          description: `Moka sync NF - ${p.payment_type ?? "POS"} (${p.id ?? p.receipt_number ?? ""})`,
        }));

        const { error } = await supabase
          .from("finance_transactions")
          .upsert(transactions, {
            onConflict: "description",
            ignoreDuplicates: true,
          });

        if (error) {
          results.push({ task: "finance", status: "error", detail: error.message });
        } else {
          results.push({ task: "finance", status: "ok", detail: `${transactions.length} transactions synced` });
        }
      } else {
        results.push({ task: "finance", status: "ok", detail: "0 transactions today" });
      }
    } else {
      results.push({ task: "finance", status: "skipped", detail: "payment_reports API not available" });
    }
  } catch (err) {
    results.push({ task: "finance", status: "error", detail: String(err) });
  }

  const allOk = results.every(r => r.status !== "error");
  return NextResponse.json({
    success: allOk,
    synced_at: new Date().toISOString(),
    results,
  });
}
