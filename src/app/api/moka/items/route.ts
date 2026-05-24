import { NextRequest, NextResponse } from "next/server";

// GET semua item/produk dari Moka POS
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get("apiKey") ?? process.env.MOKA_API_KEY;
    const outletId = searchParams.get("outletId") ?? process.env.MOKA_OUTLET_ID;
    const page = searchParams.get("page") ?? "1";

    if (!apiKey || !outletId) {
          return NextResponse.json(
                  { error: "MOKA_API_KEY dan MOKA_OUTLET_ID wajib ada" },
                  { status: 400 }
                );
        }

    const res = await fetch(
          `https://api.mokapos.com/v2/outlets/${outletId}/items?page=${page}&per_page=100`,
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
                  { error: "Gagal ambil item dari Moka", detail: err },
                  { status: res.status }
                );
        }

    const data = await res.json();
    return NextResponse.json(data);
  }

// DELETE item dari Moka POS by item_id
export async function DELETE(req: NextRequest) {
    const { apiKey, outletId, itemId } = await req.json();

    const key = apiKey ?? process.env.MOKA_API_KEY;
    const outlet = outletId ?? process.env.MOKA_OUTLET_ID;

    if (!key || !outlet || !itemId) {
          return NextResponse.json(
                  { error: "apiKey, outletId, dan itemId wajib diisi" },
                  { status: 400 }
                );
        }

    const res = await fetch(
          `https://api.mokapos.com/v2/outlets/${outlet}/items/${itemId}`,
          {
                  method: "DELETE",
                  headers: {
                            Authorization: `Bearer ${key}`,
                            "Content-Type": "application/json",
                          },
                }
        );

    if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return NextResponse.json(
                  { error: "Gagal hapus item dari Moka", detail: err },
                  { status: res.status }
                );
        }

    return NextResponse.json({
          success: true,
          message: `Item ${itemId} berhasil dihapus dari Moka`,
        });
  }
