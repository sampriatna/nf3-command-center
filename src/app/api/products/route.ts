import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// POST /api/products - bulk insert from CSV
export async function POST(request: NextRequest) {
    try {
          const body = await request.json();
          const { products } = body;
          if (!products || !Array.isArray(products) || products.length === 0) {
                  return NextResponse.json({ error: 'Data produk kosong' }, { status: 400 });
                }
          const now = new Date().toISOString();
          const inserts = products.map((p: Record<string, string | number>) => ({
                  name: String(p.name || ''),
                  sku: String(p.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2,4)}`),
                  category: String(p.category || 'Produk Jadi'),
                  business_unit: String(p.business_unit || 'NF'),
                  unit: String(p.unit || 'pcs'),
                  price_sell: Number(p.price_sell) || 0,
                  price_hpp: Number(p.price_hpp) || 0,
                  current_stock: Number(p.current_stock) || 0,
                  min_stock: Number(p.min_stock) || 0,
                  location: String(p.location || ''),
                  created_at: now,
                  updated_at: now,
                })).filter(p => p.name);
          const { data, error } = await supabase.from('inventory_products').insert(inserts).select('id');
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
          return NextResponse.json({ success: true, count: data?.length || inserts.length });
        } catch (err) {
          return NextResponse.json({ error: String(err) }, { status: 500 });
        }
  }

// PATCH /api/products - update stock (masuk stok)
export async function PATCH(request: NextRequest) {
    try {
          const body = await request.json();
          const { product_id, qty, note } = body;
          if (!product_id || !qty || qty <= 0) {
                  return NextResponse.json({ error: 'product_id dan qty wajib diisi' }, { status: 400 });
                }
          const { data: prod } = await supabase.from('inventory_products').select('current_stock,name,unit').eq('id', product_id).single();
          if (!prod) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
          const newStock = (prod.current_stock || 0) + qty;
          const { error } = await supabase.from('inventory_products')
            .update({ current_stock: newStock, updated_at: new Date().toISOString() })
            .eq('id', product_id);
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
          // Log movement (ignore error if table doesn't exist)
    await supabase.from('stock_movements').insert({
      product_id, type: 'in', quantity: qty,
      note: note || 'Masuk stok manual',
      created_at: new Date().toISOString(),
    }).then(() => {});
    return NextResponse.json({ success: true, new_stock: newStock, product_name: prod.name, unit: prod.unit });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
