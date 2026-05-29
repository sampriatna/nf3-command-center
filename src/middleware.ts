import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes yang bisa diakses tanpa login
const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/pending",
  "/admin-login",
  "/api/admin/login",
  "/api/admin/update-creds",
  "/_next",
  "/favicon",
];

// Admin routes yang hanya butuh admin session (bukan Supabase auth)
const ADMIN_PATHS = ["/admin-dashboard", "/api/admin/verify-session", "/api/admin/logout"];

// Routes yang bisa diakses dengan admin session (tanpa Supabase auth)
const ADMIN_ACCESS_PATHS = ["/dashboard"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bypass public routes dan static assets
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check admin session untuk admin routes
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    const adminSession = req.cookies.get("admin_session")?.value;
    if (!adminSession) {
      return NextResponse.redirect(new URL("/admin-login", req.url));
    }
    return NextResponse.next();
  }

  // Check admin session untuk routes yang bisa diakses admin (e.g., /dashboard)
  const adminSession = req.cookies.get("admin_session")?.value;
  if (adminSession && ADMIN_ACCESS_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // Buat Supabase client yang bisa baca/tulis cookie (SSR)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Cek session — getUser() verifikasi token ke Supabase server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
