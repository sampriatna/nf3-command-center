import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/pending", "/api/auth/callback", "/api/moka/auth", "/api/moka/callback", "/api/moka/sync", "/api/notify"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_ROUTES.some(r => pathname.startsWith(r)) ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for Supabase auth cookie
  const cookieHeader = req.headers.get("cookie") ?? "";
  const hasAuthCookie = cookieHeader.includes("sb-") && cookieHeader.includes("-auth-token");

  if (!hasAuthCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};