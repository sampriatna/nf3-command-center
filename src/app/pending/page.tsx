"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const SUPER_ADMIN_EMAILS = ["sampriatna@gmail.com"];

// detectSessionInUrl: true ensures Supabase client auto-exchanges ?code= param (PKCE)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true } }
);

export default function PendingPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Checking your access...");

  useEffect(() => {
    let mounted = true;

    async function handleUser(userId: string, userEmail: string | undefined) {
      if (!mounted) return;

      if (SUPER_ADMIN_EMAILS.includes(userEmail ?? "")) {
        void supabase.from("user_roles").upsert(
          { user_id: userId, role: "super_admin", email: userEmail },
          { onConflict: "user_id", ignoreDuplicates: false }
        );
        if (mounted) router.replace("/dashboard");
        return;
      }

      try {
        await supabase.from("user_roles").upsert(
          { user_id: userId, role: "pending", email: userEmail },
          { onConflict: "user_id", ignoreDuplicates: true }
        );
      } catch (_e) {}

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (!mounted) return;

      const role = roleData?.role ?? "pending";
      if (role !== "pending") {
        router.replace("/dashboard");
      } else {
        setStatus("Your account is pending approval. Please wait for an administrator to approve your access.");
      }
    }

    // onAuthStateChange fires SIGNED_IN after Supabase detects & exchanges ?code= in URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        await handleUser(session.user.id, session.user.email);
      } else if (event === "SIGNED_OUT") {
        router.replace("/login");
      } else if (event === "INITIAL_SESSION" && !session) {
        // No session and no code in URL — not coming from OAuth
        const hasCode = typeof window !== "undefined" && window.location.search.includes("code=");
        if (!hasCode) router.replace("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-4">
          <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Account Pending</h1>
        <p className="text-blue-200">{status}</p>
        <div className="mt-6 flex justify-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
