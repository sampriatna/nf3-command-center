import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // Delete existing records
    const { error: deleteError } = await supabase
      .from("admin_credentials")
      .delete()
      .neq("email", "");

    if (deleteError && deleteError.code !== "PGRST116") {
      throw deleteError;
    }

    // Insert new admin with hashed password using pgcrypto
    const { data, error } = await supabase.rpc("insert_admin_with_password", {
      p_email: "sampriatna@gmail.com",
      p_password: "tukgumer123",
      p_name: "Sampriatna Admin",
    });

    if (error) {
      console.error("Error updating credentials:", error);
      return NextResponse.json(
        { error: "Failed to update credentials", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Admin credentials updated",
      email: "sampriatna@gmail.com",
      password: "tukgumer123",
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
