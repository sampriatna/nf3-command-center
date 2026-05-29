import { NextRequest, NextResponse } from "next/server";

// Routes yang bisa diakses tanpa login
const PUBLIC_PATHS = ["/login", "/api/auth", "/pending", "/_next", "/favicon"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bypass public routes dan static assets
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Cek apakah ada Supabase auth cookie
  const cookieHeader = req.headers.get("cookie") ?? "";

  // Supabase menyimpan session di cookie dengan nama sb-*-auth-token
  const supabaseRef = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]
    : "";

  const authCookieName = `sb-${supabaseRef}-auth-token`;
  const hasSession =
    cookieHeader.includes(authCookieName) ||
    cookieHeader.includes("sb-access-token") ||
    cookieHeader.includes("supabase-auth-token");

  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
