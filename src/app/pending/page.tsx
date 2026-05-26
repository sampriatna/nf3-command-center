"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const SUPER_ADMIN_EMAILS = ["sampriatna@gmail.com"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { flowType: "implicit" } }
);

export default function PendingPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Checking your access...");

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      // Wait briefly for Supabase to parse hash tokens (implicit flow)
      await new Promise((r) => setTimeout(r, 500));

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (mounted) router.replace("/login");
        return;
      }

      const user = session.user;

      // Ensure user_roles record exists (handles implicit flow where callback can't do it)
      const role = SUPER_ADMIN_EMAILS.includes(user.email ?? "")
        ? "super_admin"
        : "pending";

      try {
        await supabase
          .from("user_roles")
          .upsert(
            { user_id: user.id, role, email: user.email },
            { onConflict: "user_id", ignoreDuplicates: true }
          );
      } catch (_e) {
        // non-fatal
      }

      // Now fetch the actual role (may have been updated by admin)
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      const userRole = roleData?.role ?? "pending";

      if (!mounted) return;

      if (userRole === "pending") {
        setStatus("Your account is pending approval. Please wait for an administrator to approve your access.");
      } else {
        setStatus("Access granted! Redirecting to dashboard...");
        router.replace("/dashboard");
      }
    }

    checkAccess();
    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
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
