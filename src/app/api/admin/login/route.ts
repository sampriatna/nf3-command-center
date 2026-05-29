import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password harus diisi" },
        { status: 400 }
      );
    }

    // Get admin credentials
    const { data: admin, error: fetchError } = await supabase
      .from("admin_credentials")
      .select("id, email, password_hash, name, is_active")
      .eq("email", email)
      .single();

    if (fetchError || !admin) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    if (!admin.is_active) {
      return NextResponse.json(
        { error: "Admin account tidak aktif" },
        { status: 401 }
      );
    }

    // Verify password using pgcrypto crypt function
    const { data: verifyResult, error: verifyError } = await supabase
      .rpc("verify_admin_password", {
        admin_id: admin.id,
        password_input: password,
      });

    if (verifyError || !verifyResult) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Create session token
    const sessionToken = Buffer.from(
      JSON.stringify({
        admin_id: admin.id,
        email: admin.email,
        name: admin.name,
        timestamp: Date.now(),
      })
    ).toString("base64");

    // Set secure cookie
    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
    });

    response.cookies.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[v0] Admin login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
