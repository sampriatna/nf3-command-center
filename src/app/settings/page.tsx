"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);

  // Moka OAuth status
  const [mokaStatus, setMokaStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [mokaOutletName, setMokaOutletName] = useState("");
  const [mokaExpiresAt, setMokaExpiresAt] = useState("");

  // Fontte
  const [fontteKey, setFontteKey] = useState("");
  const [fontteStatus, setFontteStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("moka") === "connected") {
      setActiveTab("integrations");
    }
    checkMokaConnection();
  }, []);

  async function checkMokaConnection() {
    setMokaStatus("checking");
    const { data, error } = await supabase
      .from("moka_connections")
      .select("outlet_id, expires_at, updated_at")
      .limit(1)
      .single();
    if (!error && data) {
      setMokaStatus("connected");
      setMokaOutletName(data.outlet_id || "");
      setMokaExpiresAt(data.expires_at ? new Date(data.expires_at).toLocaleDateString("id-ID") : "");
    } else {
      setMokaStatus("disconnected");
    }
  }

  async function handleDisconnectMoka() {
    await supabase.from("moka_connections").delete().neq("id", 0);
    setMokaStatus("disconnected");
    setMokaOutletName("");
    setMokaExpiresAt("");
  }

  async function handleTestFontte() {
    if (!fontteKey) return;
    setFontteStatus("testing");
    try {
      const res = await fetch("https://api.fontte.com/send", {
        method: "POST",
        headers: {
          "Authorization": fontteKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: "08123456789",
          message: "Test notifikasi NF3 Command Center ✅",
        }),
      });
      setFontteStatus(res.ok ? "success" : "error");
    } catch {
      setFontteStatus("error");
    }
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const tabs = [
    { key: "profile", label: "Profil", icon: "💤" },
    { key: "integrations", label: "Integrasi", icon: "👌" },
    { key: "notifications", label: "Notifikasi", icon: "🔕" },
    { key: "roles", label: "Role & Akses", icon: "📵😏" },
    { key: "business", label: "Business Units", icon: "🏢" },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content flex-1">
        <div className="mb-6">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Konfigurasi sistem, integrasi, dan akses pengguna</p>
        </div>

        <div className="flex gap-6">
          <div className="w-52 shrink-0">
            <nav className="space-y-1">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={"w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors " + (activeTab === t.key ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100")}>
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 card p-6">

            {activeTab === "profile" && (
              <div>
                <h2 className="font-bold text-slate-900 mb-4">Profil Pengguna</h2>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w46 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl">S</div>
                  <div>
                    <p className="font-semibold text-slate-800">Sam Priatna</p>
                    <p className="text-sm text-slate-500">Owner - Akses penuh semua modul</p>
                    <button className="text-blue-600 text-xs font-medium mt-1 hover:underline">Ganti foto</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Nama Lengkap</label>
                    <input className="input-field" defaultValue="Sam Priatna" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Display Name</label>
                    <input className="input-field" defaultValue="Sam" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Email</label>
                    <input className="input-field" defaultValue="sam@nf3authentic.com" type="email" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">WhatsApp</label>
                    <input className="input-field" defaultValue="08123456789" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "integrations" && (
              <div className="space-y-6">
                <h2 className="font-bold text-slate-900">Integrasi &amp; Koneksi</h2>

                {/* MOKA POS -- NF */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p4 bg-blue-50 border-b border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">M</div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">Moka POS</p>
                        <p className="text-slate-500 text-xs">Nusa Fishing (NF) -- Kasir &amp; Penjualan</p>
                      </div>
                    </div>
                    <div>
                      {mokaStatus === "checking" && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Mengecek...</span>}
                      {mokaStatus === "connected" && <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full font-medium">✅ Terhubung</span>}
                      {mokaStatus === "disconnected" && <span className="text-xs text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-full font-medium">⚡️ Belum terhubung</span>}
                    </div>
                  </div>
                  <div className="p-4">
                    {mokaStatus === "connected" ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Outlet ID</p>
                            <p className="font-mono text-slate-700 text-xs bg-slate-50 px-2 py-1 rounded">{mokaOutletName || "—"}</p>
                          </div>
                          {mokaExpiresAt && (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Token berlaku hingga</p>
                              <p className="font-mono text-slate-700 text-xs bg-slate-50 px-2 py-1 rounded">{mokaExpiresAt}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <a href="/api/moka/auth" className="btn-secondary text-xs">💴 Reconnect OAuth</a>
                          <button onClick={handleDisconnectMoka} className="text-red-600 text-xs font-medium hover:underline">Disconnect</button>
                        </div>
                        <p className="text-xs text-green-700 bg-green-50 p-2 rounded-lg">
                          ✅ Token tersimpan di server. Semua tim bisa Sync Moka dari halaman Finance tanpa input API key.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-600">
                          Hubungkan akun Moka sekali via OAuth. Token disimpan otomatis di server -- tim tidak perlu input API key lagi.
                        </p>
                        <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                          <span>™OK</span>
                          <div>
                            <p className="font-medium text-slate-700 mb-1">Cara kerja OAuth Moka:</p>
                            <ol className="list-decimal ml-4 space-y-1">
                              <li>Klik tombol di bawah -- redirect ke Moka login</li>
                              <li>Login dengan akun Moka NF3 Authentic</li>
                              <li>Klik Izinkan -- token tersimpan otomatis</li>
                              <li>Selesai -- semua tim bisa sync data NF</li>
                            </ol>
                          </div>
                        </div>
                        <a href="/api/moka/auth" className="btn-primary text-sm inline-block">🔡 Hubungkan Moka via OAuth</a>
                      </div>
                    )}
                  </div>
                </div>

                {/* ESB -- F&B */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-orange-50 border-b border-orange-100">
                    <div className="flex items-center gap-3">
                      <div className="w9 h-9 bg-orange-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">E</div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">ESB (F&amp;B System)</p>
                        <p className="text-slate-500 text-xs">Buri Umah Group -- ERP &amp; Kasir F&amp;B</p>
                      </div>
                    </div>
                    <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full font-medium">📇 CSV Import</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-slate-600">
                      ESB digunakan untuk bisnis F&amp;B (Buri Umah, Kisamen, Samtaro). Input data bisa dilakukan via manual entry atau upload CSV dari laporan ESB.
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {["Buri Umah", "Kisamen", "Samtaro Express", "Produksi Pusat"].map(o => (
                        <div key={o} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                          <span className="text-orange-500">🏧j</span>
                          <span className="text-slate-700 font-medium">{o}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-700 border border-amber-100">
                      <p className="font-medium mb-1">Cara input data F&amp;B:</p>
                      <p>Pergi ke Finance &rarr; klik <strong>&quot;� Input F&amp;B ESB&quot;</strong> &rarr; input manual atau upload CSV harian.</p>
                    </div>
                  </div>
                </div>

                {/* Fontte WA */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p4 bg-green-50 border-b border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w9 h-9 bg-green-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">F</div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">Fontte WhatsApp</p>
                        <p className="text-slate-500 text-xs">Notifikasi task &amp; reminder ke tim via WA</p>
                      </div>
                    </div>
                    {fontteStatus === "success" && <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">✅ Terhubung</span>}
                    {fontteStatus === "error" && <span className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-full">❌ Gagal</span>}
                    {fontteStatus === "idle" && <span className="text-xs text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-full">Belum diset</span>}
                    {fontteStatus === "testing" && <span className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-full animate-pulse">Mengetes...</span>}
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-slate-500">Token Fontte harus di-set di Vercel Environment Variables sebagai <code className="bg-slate-100 px-1 rounded">FONNTE_API_KEY</code>, bukan disimpan di frontend.</p>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">API Token (test saja)</label>
                      <input
                        type="password"
                        className="input-field font-mono text-sm"
                        placeholder="Token Fontte untuk test..."
                        value={fontteKey}
                        onChange={e => setFontteKey(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={handleTestFontte}
                      disabled={!fontteKey || fontteStatus === "testing"}
                      className="btn-secondary text-sm disabled:opacity-40"
                    >
                      {fontteStatus === "testing" ? "Mengetes..." : "Test Kirim WA"}
                    </button>
                    <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
                      Set <code className="bg-slate-100 px-1 rounded">FONNTE_API_KEY</code> di Vercel &rarr; Project Settings &rarr; Environment Variables untuk penggunaan production.
                    </div>
                  </div>
                </div>

                {/* Supabase & lainnya */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">Environment Variables (set di Vercel)</h3>
                  {[
                    { name: "Supabase URL", key: "NEST_PUBLIC_SUPABASE_URL", desc: "Database utama" },
                    { name: "Supabase Anon Key", key: "NEST_PUBLIC_SUPABASE_ANON_KEY", desc: "Public API key" },
                    { name: "Supabase Service Role", key: "SUPABASE_SERVICE_ROLE_KEY", desc: "Server-side operations" },
                    { name: "Moka Client ID", key: "MOKA_CLIENT_ID", desc: "OAuth App ID dari Moka" },
                    { name: "Moka Client Secret", key: "MOKA_CLIENT_SECRET", desc: "OAuth App Secret dari Moka" },
                    { name: "Fontte API Key", key: "FONNTE_API_KEY", desc: "Token WA notification" },
                    { name: "OpenAI API Key", key: "OPENAI_API_KEY", desc: "Untuk AI Agents" },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                        <p className="text-slate-500 text-xs">{item.desc}</p>
                        <p className="text-slate-400 text-xs font-mono mt-0.5">{item.key}</p>
                      </div>
                      <a href="https://vercel.com" target="_blank" className="btn-secondary text-xs">Set di Vercel</a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div>
                <h2 className="font-bold text-slate-900 mb-4">Pengaturan Notifikasi</h2>
                <div className="space-y-4">
                  {[
                    { label: "Notif task baru", desc: "Kirim WA ke PIC saat task dibuat" },
                    { label: "Alert stok menipis", desc: "Notif Owner jika stok di bawah minimum" },
                    { label: "Lead baru masuk", desc: "Notif CS saat ada lead baru" },
                    { label: "Laporan harian otomatis", desc: "Ringkasan harian jam 21.00 via WA" },
                    { label: "Alert iklan overspend", desc: "Notif jika budget iklan melebihi target" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{item.label}</p>
                        <p className="text-slate-400 text-xs">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={i < 3} className="sr-only peer" />
                        <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "roles" && (
              <div>
                <h2 className="font-bold text-slate-900 mb-4">Role &amp; Akses Pengguna</h2>
                <div className="space-y-2">
                  {[
                    { role: "Owner", modules: "Semua modul", color: "badge-red", users: 1 },
                    { role: "Super Admin", modules: "Semua kecuali billing", color: "badge-red", users: 0 },
                    { role: "Manager F&B", modules: "Dashboard, Task, Finance, SOP", color: "badge-orange", users: 2 },
                    { role: "Manager NF", modules: "Dashboard, Task, Leads, Produk, Ads", color: "badge-blue", users: 1 },
                    { role: "Finance Admin", modules: "Finance saja", color: "badge-yellow", users: 1 },
                    { role: "CS Leader", modules: "CS & Lead, Task", color: "badge-green", users: 1 },
                    { role: "CS Staff", modules: "CS & Lead saja", color: "badge-green", users: 3 },
                    { role: "Tim Konten", modules: "Media Pusat, Task", color: "badge-purple", users: 2 },
                    { role: "Ads / Advertiser", modules: "Ads Center, Task", color: "badge-purple", users: 1 },
                    { role: "Inventory / Gudang", modules: "Produk & Stok saja", color: "badge-gray", users: 2 },
                    { role: "Kasir / Cashier", modules: "Finance input saja", color: "badge-gray", users: 2 },
                    { role: "Viewer", modules: "Dashboard read-only", color: "badge-gray", users: 0 },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className={"badge " + r.color}>{r.role}</span>
                        <span className="text-sm text-slate-500">{r.modules}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{r.users} user</span>
                        <button className="text-blue-600 text-xs font-medium hover:underline">Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-4">Role-based access akan aktif setelah Google Auth dikonfigurasi (Fase 1).</p>
              </div>
            )}

            {activeTab === "business" && (
              <div>
                <h2 className="font-bold text-slate-900 mb-4">Business Units &amp; Brand</h2>
                <div className="space-y-4">
                  {[
                    {
                      bu: "F&B / Buri Umah Group", code: "fnb", color: "border-orange-400", posLabel: "ESB",
                      brands: ["Buri Umah", "Kisamen", "Samtaro Express", "Produksi Pusat", "Gudang F&B", "HR F&B"],
                    },
                    {
                      bu: "NF / Nusa Fishing", code: "nf", color: "border-blue-400", posLabel: "Moka POS",
                      brands: ["CS", "Iklan", "Marketplace", "Packing", "COD / Pengiriman", "Reseller / Affiliate", "Admin NF"],
                    },
                    {
                      bu: "General / Office", code: "general", color: "border-slate-400", posLabel: "Manual",
                      brands: ["Office", "HR", "Legal", "IT"],
                    },
                  ].map(bu => (
                    <div key={bu.code} className={"card p-4 border-l-4 " + bu.color}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-800">{bu.bu}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">POS: <strong>{bu.posLabel}</strong></span>
                          <span className="badge badge-gray font-mono">{bu.code}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {bu.brands.map(b => (
                          <span key={b} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{b}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {["profile", "notifications"].includes(activeTab) && (
              <div className="mt-6 flex justify-end">
                <button onClick={handleSave} className={"btn-primary " + (saved ? "bg-green-600" : "")}>
                  {saved ? "Tersimpan!" : "Simpan Perubahan"}
                </button>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
