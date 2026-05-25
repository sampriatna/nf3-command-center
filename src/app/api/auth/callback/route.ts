import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/login?error=no_code`);

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await anonClient.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/login?error=auth_failed`);

  const user = data.user;
  const svcClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: existing, error: roleError } = await svcClient
    .from("user_roles").select("role").eq("user_id", user.id).single();

  if (roleError && roleError.code === "PGRST116") {
    await svcClient.from("user_roles").insert({
      user_id: user.id, email: user.email,
      name: user.user_metadata?.full_name ?? user.email, role: "pending",
    });
    await svcClient.from("activity_log").insert({
      user_id: user.id, user_email: user.email,
      user_name: user.user_metadata?.full_name ?? user.email,
      action: "user_registered", resource_type: "auth",
      description: `User baru mendaftar: ${user.email}`,
    }).catch(() => {});
    return NextResponse.redirect(`${origin}/pending`);
  }

  if (existing?.role === "pending") return NextResponse.redirect(`${origin}/pending`);

  await svcClient.from("activity_log").insert({
    user_id: user.id, user_email: user.email,
    user_name: user.user_metadata?.full_name ?? user.email,
    action: "user_login", resource_type: "auth",
    description: `Login: ${user.email}`,
  }).catch(() => {});

  return NextResponse.redirect(`${origin}/dashboard`);
}