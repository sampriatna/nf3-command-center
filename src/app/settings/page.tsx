"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SettingsPage() {
  const [mokaConnected, setMokaConnected] = useState<boolean | null>(null);
  const [mokaExpiry, setMokaExpiry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkMokaConnection();
  }, []);

  async function checkMokaConnection() {
    setLoading(true);
    const { data } = await supabase
      .from("moka_connections")
      .select("id, expires_at")
      .limit(1)
      .single();
    setMokaConnected(!!data);
    setMokaExpiry(data?.expires_at ?? null);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="main-content flex-1">
        <div className="mb-6">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Konfigurasi integrasi dan koneksi sistem</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Moka POS Integration */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">🏪</div>
              <div>
                <h2 className="font-bold text-slate-800">Moka POS</h2>
                <p className="text-xs text-slate-500">Integrasi POS untuk Nusa Fishing (NF)</p>
              </div>
            </div>
            {loading ? (
              <div className="text-slate-400 text-sm">Memeriksa koneksi...</div>
            ) : mokaConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-green-600 text-lg">✅</span>
                  <div>
                    <p className="text-sm font-medium text-green-700">Terhubung</p>
                    {mokaExpiry && (
                      <p className="text-xs text-green-600">Expire: {new Date(mokaExpiry).toLocaleDateString("id-ID")}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500">Token OAuth tersimpan aman di server. Seluruh tim bisa sync tanpa input API key ulang.</p>
                <button
                  className="btn-secondary text-sm w-full"
                  onClick={() => window.location.href = "/api/moka/auth"}
                >
                  🔄 Reconnect / Perbarui Token
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="text-amber-600 text-lg">⚠️</span>
                  <p className="text-sm font-medium text-amber-700">Belum terhubung</p>
                </div>
                <p className="text-xs text-slate-500">
                  Hubungkan akun Moka sekali via OAuth. Setelah terhubung, semua anggota tim bisa sync data penjualan NF tanpa perlu input API key.
                </p>
                <a
                  href="/api/moka/auth"
                  className="btn-primary text-sm inline-block w-full text-center"
                >
                  🔗 Hubungkan Moka via OAuth
                </a>
              </div>
            )}
          </div>

          {/* ESB Integration */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl">📊</div>
              <div>
                <h2 className="font-bold text-slate-800">ESB / F&amp;B</h2>
                <p className="text-xs text-slate-500">Integrasi data untuk Buri Umah Group</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-blue-600 text-lg">ℹ️</span>
                <p className="text-sm font-medium text-blue-700">Input manual / CSV upload</p>
              </div>
              <p className="text-xs text-slate-500">
                Data F&amp;B diinput manual atau via file CSV dari ESB. Tidak memerlukan koneksi OAuth khusus.
              </p>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-700 font-medium mb-1">📋 Format CSV ESB</p>
                <p className="text-xs text-amber-600 font-mono">date, outlet, amount, description</p>
              </div>
            </div>
          </div>

          {/* Fonnte WhatsApp */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">💬</div>
              <div>
                <h2 className="font-bold text-slate-800">Fonnte WhatsApp</h2>
                <p className="text-xs text-slate-500">Notifikasi otomatis ke tim via WA</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-green-600 text-lg">✅</span>
                <div>
                  <p className="text-sm font-medium text-green-700">Aktif</p>
                  <p className="text-xs text-green-600">Device: SAM2 (6283871621101)</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Token Fonnte dikonfigurasi di server. Notifikasi dikirim otomatis saat task dibuat atau selesai.
              </p>
            </div>
          </div>

          {/* Supabase */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-xl">🗄️</div>
              <div>
                <h2 className="font-bold text-slate-800">Supabase Database</h2>
                <p className="text-xs text-slate-500">Backend &amp; Auth NF3 Command Center</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-green-600 text-lg">✅</span>
                <div>
                  <p className="text-sm font-medium text-green-700">Terhubung</p>
                  <p className="text-xs text-green-600">Project: NF Authentic Check</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Database PostgreSQL berjalan di Supabase. Auth via Google OAuth aktif.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
