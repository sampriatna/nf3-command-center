"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const tabs = [
    { key: "profile",       label: "Profil",         icon: "👤" },
    { key: "integrations",  label: "Integrasi",      icon: "🔗" },
    { key: "notifications", label: "Notifikasi",     icon: "🔔" },
    { key: "roles",         label: "Role & Akses",   icon: "🔐" },
    { key: "business",      label: "Business Units", icon: "🏢" },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content flex-1">
        {/* Header */}
        <div className="mb-6">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Konfigurasi sistem, integrasi, dan akses pengguna</p>
        </div>

        <div className="flex gap-6">
          {/* Tab Nav */}
          <div className="w-48 shrink-0">
            <nav className="space-y-1">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 card p-6">

            {/* Profile */}
            {activeTab === "profile" && (
              <div>
                <h2 className="font-bold text-slate-900 mb-4">Profil Pengguna</h2>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl">S</div>
                  <div>
                    <p className="font-semibold text-slate-800">Sam Priatna</p>
                    <p className="text-sm text-slate-500">Owner — Akses penuh semua modul</p>
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

            {/* Integrations */}
            {activeTab === "integrations" && (
              <div>
                <h2 className="font-bold text-slate-900 mb-4">Integrasi & API Keys</h2>
                <div className="space-y-4">
                  {[
                    { name: "Supabase", desc: "Database utama — PostgreSQL", key: "NEXT_PUBLIC_SUPABASE_URL", status: "not_set", icon: "🟢" },
                    { name: "Supabase Anon Key", desc: "Public API key untuk client-side", key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", status: "not_set", icon: "🟢" },
                    { name: "OpenAI API", desc: "Untuk semua fitur AI Agents", key: "OPENAI_API_KEY", status: "not_set", icon: "🤖" },
                    { name: "n8n Webhook", desc: "Otomasi workflow dan notifikasi", key: "N8N_WEBHOOK_URL", status: "not_set", icon: "⚙️" },
                    { name: "Fonnte / WhatsApp", desc: "Kirim notifikasi WA ke tim", key: "FONNTE_API_KEY", status: "not_set", icon: "📱" },
                    { name: "Google Drive", desc: "Backup dokumen dan aset konten", key: "GOOGLE_DRIVE_FOLDER_ID", status: "not_set", icon: "📂" },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                          <p className="text-slate-500 text-xs">{item.desc}</p>
                          <p className="text-slate-400 text-xs font-mono mt-0.5">{item.key}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full font-medium">Belum diset</span>
                        <button className="btn-secondary text-xs">Set di Vercel →</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-700 font-medium mb-1">📌 Cara setup Environment Variables</p>
                  <p className="text-xs text-blue-600">Buka Vercel → Project Settings → Environment Variables → tambahkan key di atas → Redeploy.</p>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === "notifications" && (
              <div>
                <h2 className="font-bold text-slate-900 mb-4">Pengaturan Notifikasi</h2>
                <div className="space-y-4">
                  {[
                    { label: "Notif task baru masuk", desc: "Kirim ke WA Owner saat ada task dibuat" },
                    { label: "Alert stok menipis", desc: "Kirim ke WA Owner jika stok di bawah minimum" },
                    { label: "Lead baru masuk", desc: "Notifikasi ke CS saat ada lead baru" },
                    { label: "Laporan harian otomatis", desc: "Kirim ringkasan harian jam 21.00 via WA" },
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

            {/* Roles */}
            {activeTab === "roles" && (
              <div>
                <h2 className="font-bold text-slate-900 mb-4">Role & Akses Pengguna</h2>
                <div className="space-y-3">
                  {[
                    { role: "Owner", modules: "Semua modul", color: "badge-red", users: 1 },
                    { role: "Manager F&B", modules: "Dashboard, Task, Finance, SOP", color: "badge-orange", users: 2 },
                    { role: "Manager NF", modules: "Dashboard, Task, Leads, Produk, Ads", color: "badge-blue", users: 1 },
                    { role: "CS / Customer Service", modules: "CS & Lead saja", color: "badge-green", users: 3 },
                    { role: "Tim Konten", modules: "Media Pusat, Task", color: "badge-purple", users: 2 },
                    { role: "Finance", modules: "Finance saja", color: "badge-yellow", users: 1 },
                    { role: "Inventory", modules: "Produk & Stok saja", color: "badge-gray", users: 2 },
                    { role: "HR / SOP", modules: "Dokumen SOP saja", color: "badge-gray", users: 1 },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`badge ${r.color}`}>{r.role}</span>
                        <span className="text-sm text-slate-500">{r.modules}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{r.users} user</span>
                        <button className="text-blue-600 text-xs font-medium hover:underline">Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-4">Role-based access akan aktif setelah Supabase Auth dikonfigurasi.</p>
              </div>
            )}

            {/* Business Units */}
            {activeTab === "business" && (
              <div>
                <h2 className="font-bold text-slate-900 mb-4">Business Units & Brand</h2>
                <div className="space-y-4">
                  {[
                    {
                      bu: "F&B / Buri Umah Group", code: "fnb", color: "border-orange-400",
                      brands: ["Buri Umah", "Kisamen", "Samtaro Express", "Produksi Pusat", "Gudang", "Finance", "HR"],
                    },
                    {
                      bu: "NF / Nusa Fishing", code: "nf", color: "border-blue-400",
                      brands: ["CS", "Iklan", "Marketplace", "Packing", "COD / Pengiriman", "Reseller / Affiliate", "Admin"],
                    },
                  ].map(bu => (
                    <div key={bu.code} className={`card p-4 border-l-4 ${bu.color}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-800">{bu.bu}</h3>
                        <span className="badge badge-gray font-mono">{bu.code}</span>
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

            {/* Save Button */}
            {["profile", "notifications"].includes(activeTab) && (
              <div className="mt-6 flex justify-end">
                <button onClick={handleSave} className={`btn-primary ${saved ? "bg-green-600" : ""}`}>
                  {saved ? "✓ Tersimpan!" : "Simpan Perubahan"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
