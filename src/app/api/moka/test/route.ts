import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, outletId } = await req.json();

    if (!apiKey || !outletId) {
      return NextResponse.json(
        { error: "API Key dan Outlet ID wajib diisi" },
        { status: 400 }
      );
    }

    // Test koneksi ke Moka API v2
    const res = await fetch(
      `https://api.mokapos.com/v2/outlets/${outletId}`,
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
        { error: "Koneksi ke Moka gagal", detail: err },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      success: true,
      outlet: data?.data?.name ?? outletId,
      message: "Koneksi Moka berhasil!",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error", detail: String(err) },
      { status: 500 }
    );
  }
}
