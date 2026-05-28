import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  // Auth is handled by individual pages via Supabase client
  // Middleware only handles static asset passthrough
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
