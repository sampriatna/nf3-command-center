"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PendingPage() {
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => { checkStatus(); }, []);

  async function checkStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single();
    if (roleData && roleData.role !== "pending") { window.location.href = "/dashboard"; return; }
    setUser({ email: user.email ?? "", name: user.user_metadata?.full_name ?? user.email ?? "" });
    setChecking(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Memeriksa status akses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-2xl mb-4">
          <span className="text-3xl">⏳</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Menunggu Persetujuan</h1>
        <p className="text-gray-500 text-sm mb-6">
          Akun <strong>{user?.email}</strong> sudah terdaftar dan sedang menunggu persetujuan dari Owner atau Super Admin.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left">
          <div className="flex items-start gap-3">
            <span className="text-yellow-500 text-lg mt-0.5">ℹ️</span>
            <div>
              <p className="text-sm font-semibold text-yellow-800">Status: Pending Approval</p>
              <p className="text-xs text-yellow-600 mt-1">Admin akan menugaskan role dan Business Unit. Anda akan diarahkan otomatis ke dashboard setelah disetujui.</p>
            </div>
          </div>
        </div>
        <div className="text-left mb-6 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Langkah selanjutnya:</p>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
            Login dengan Google berhasil
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-5 h-5 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            Admin menyetujui & assign role
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-5 h-5 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            Akses dashboard aktif
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={checkStatus} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm">
            🔄 Cek Status Lagi
          </button>
          <button onClick={handleLogout} className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm">
            Keluar
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-4">Butuh akses segera? Hubungi Owner di WhatsApp.</p>
      </div>
    </div>
  );
}