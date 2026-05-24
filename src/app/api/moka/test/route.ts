import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// POST: Test koneksi Moka dengan apiKey + outletId
// GET: Exchange OAuth code dan simpan token ke Supabase
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

  if (!code) {
        return NextResponse.json({ error: "code parameter required" }, { status: 400 });
  }

  const clientId = process.env.MOKA_CLIENT_ID || process.env.MOKA_API_KEY || "";
    const clientSecret = process.env.MOKA_CLIENT_SECRET || "";
    const redirectUri = "https://nf3-command-center.vercel.app/api/moka/callback";

  const tokenResponse = await fetch("https://api.mokapos.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
                grant_type: "authorization_code",
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
        }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
        return NextResponse.json({ error: "Token exchange failed", detail: tokenData }, { status: 400 });
  }

  let outletId = tokenData.outlet_id || "";
    if (!outletId) {
          const outletRes = await fetch("https://api.mokapos.com/v2/outlets", {
                  headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const outletData = await outletRes.json();
          outletId = outletData?.data?.[0]?.id || outletData?.data?.[0]?.outlet_id || "";
    }

  await supabase.from("moka_connections").delete().neq("id", 0);
    const { error } = await supabase.from("moka_connections").insert({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || "",
      outlet_id: outletId,
          business_id: tokenData.business_id || "",
          expires_at: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
                  : null,
          updated_at: new Date().toISOString(),
    });

  if (error) {
        return NextResponse.json({ error: "Gagal simpan token", detail: error.message }, { status: 500 });
  }

  return NextResponse.redirect("https://nf3-command-center.vercel.app/settings?moka=connected");
}

export async function POST(req: NextRequest) {
    try {
          const { apiKey, outletId } = await req.json();

      if (!apiKey || !outletId) {
              return NextResponse.json(
                { error: "API Key dan Outlet ID wajib diisi" },
                { status: 400 }
                      );
      }

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
