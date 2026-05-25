import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, message, reference_type, reference_id, recipient_name } = body;
    if (!phone || !message) return NextResponse.json({ error: "phone dan message wajib diisi" }, { status: 400 });

    const FONNTE_TOKEN = process.env.FONNTE_API_KEY;
    if (!FONNTE_TOKEN) {
      await supabase.from("notification_log").insert({ type: "whatsapp", recipient_phone: phone,
        recipient_name: recipient_name ?? null, message, status: "failed",
        reference_type: reference_type ?? null, reference_id: reference_id ?? null,
        error_message: "FONNTE_API_KEY tidak dikonfigurasi" });
      return NextResponse.json({ error: "Fonnte tidak dikonfigurasi" }, { status: 500 });
    }

    const cleanPhone = phone.replace(/[\s\-()]/g, "").replace(/^0/, "62");
    const fonnteRes = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: FONNTE_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({ target: cleanPhone, message, countryCode: "62" }),
    });
    const fonnteData = await fonnteRes.json();
    const success = fonnteRes.ok && fonnteData.status === true;

    await supabase.from("notification_log").insert({
      type: "whatsapp", recipient_phone: cleanPhone, recipient_name: recipient_name ?? null,
      message, status: success ? "sent" : "failed",
      reference_type: reference_type ?? null, reference_id: reference_id ?? null,
      error_message: success ? null : JSON.stringify(fonnteData),
    });

    if (!success) return NextResponse.json({ error: "Gagal kirim WA", detail: fonnteData }, { status: 502 });
    return NextResponse.json({ success: true, message: "WA terkirim" });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}