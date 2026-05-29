import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("admin_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    // Decode session token
    const decoded = JSON.parse(
      Buffer.from(sessionToken, "base64").toString("utf-8")
    );

    // Check if session is still valid (7 days)
    const isValid =
      decoded.timestamp && Date.now() - decoded.timestamp < 60 * 60 * 24 * 7 * 1000;

    if (!isValid) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    return NextResponse.json({
      admin_id: decoded.admin_id,
      email: decoded.email,
      name: decoded.name,
    });
  } catch (error) {
    console.error("[v0] Session verify error:", error);
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
