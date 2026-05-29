import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const PUBLIC_PATHS = ["/login", "/api/auth", "/pending", "/_next", "/favicon"];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
  }

  const res = NextResponse.next();

  const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
            cookies: {
                      getAll() {
                                  return req.cookies.getAll();
                      },
                      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
                                  cookiesToSet.forEach(({ name, value, options }) => {
                                                req.cookies.set(name, value);
                                                res.cookies.set(name, value, options);
                                  });
                      },
            },
    }
      );

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
