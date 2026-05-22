"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

type Content = {
  id: number;
  title: string;
  brand: string;
  content_type: string;
  platform: string;
  scheduled_date: string;
  status: "draft" | "brief_done" | "filming" | "editing" | "review" | "posted";
  pic: string;
  notes: string;
};

const dummy: Content[] = [
  { id: 1, title: "Promo Akhir Bulan Nusa Rod", brand: "NF - Iklan", content_type: "Reels", platform: "TikTok", scheduled_date: "2026-05-24", status: "filming", pic: "Dika", notes: "Hook: harga turun 30%" },
  { id: 2, title: "Carousel 5 Produk Unggulan", brand: "NF - Iklan", content_type: "Carousel", platform: "Instagram", scheduled_date: "2026-05-25", status: "brief_done", pic: "Rini", notes: "Tampilkan best seller" },
  { id: 3, title: "Menu Baru Buri Umah", brand: "F&B - Buri Umah", content_type: "Story", platform: "Instagram", scheduled_date: "2026-05-23", status: "posted", pic: "Andi", notes: "" },
  { id: 4, title: "Behind the scene Produksi", brand: "NF - Iklan", content_type: "Reels", platform: "TikTok", scheduled_date: "2026-05-26", status: "draft", pic: "Dika", notes: "Tampilkan proses produksi" },
  { id: 5, title: "Testimoni Customer Buri Umah", brand: "F&B - Buri Umah", content_type: "Reels", platform: "Instagram", scheduled_date: "2026-05-27", status: "editing", pic: "Rini", notes: "" },
  { id: 6, title: "Tips Memilih Pancing yang Tepat", brand: "NF - Iklan", content_type: "Carousel", platform: "Instagram", scheduled_date: "2026-05-28", status: "review", pic: "Andi", notes: "Educational content" },
  { id: 7, title: "Kisamen Buka Cabang Baru", brand: "F&B - Kisamen", content_type: "Story", platform: "Instagram", scheduled_date: "2026-05-29", status: "draft", pic: "Maya", notes: "" },
  { id: 8, title: "Live TikTok Flash Sale", brand: "NF - Iklan", content_type: "Live", platform: "TikTok", scheduled_date: "2026-05-30", status: "brief_done", pic: "Dika", notes: "Jam 19.00 WIB" },
];

const statusConfig: Record<string, { label: string; cls: string }> = {
  draft:      { label: "Draft",      cls: "badge-gray" },
  brief_done: { label: "Brief Done", cls: "badge-blue" },
  filming:    { label: "Filming",    cls: "badge-orange" },
  editing:    { label: "Editing",    cls: "badge-yellow" },
  review:     { label: "Review",     cls: "badge-purple" },
  posted:     { label: "Posted",     cls: "badge-green" },
};

const PLATFORMS = ["Semua", "TikTok", "Instagram", "Facebook"];
const CONTENT_TYPES = ["Semua", "Reels", "Carousel", "Story", "Live", "Feed"];

export default function MediaPage() {
  const [filterPlatform, setFilterPlatform] = useState("Semua");
  const [filterType, setFilterType] = useState("Semua");
  const [view, setView] = useState<"table" | "calendar">("table");

  const filtered = dummy.filter(c =>
    (filterPlatform === "Semua" || c.platform === filterPlatform) &&
    (filterType === "Semua" || c.content_type === filterType)
  );

  const statusCounts = Object.keys(statusConfig).map(k => ({
    key: k,
    ...statusConfig[k],
    count: dummy.filter(c => c.status === k).length,
  }));

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content flex-1">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="page-title">Media Pusat</h1>
            <p className="page-subtitle">Kalender konten dan manajemen aset kreatif</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setView("table")} className={`btn-secondary ${view === "table" ? "bg-slate-100" : ""}`}>📋 Tabel</button>
            <button onClick={() => setView("calendar")} className={`btn-secondary ${view === "calendar" ? "bg-slate-100" : ""}`}>📅 Kalender</button>
            <button className="btn-primary">+ Tambah Konten</button>
          </div>
        </div>

        {/* Status KPI */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {statusCounts.map(s => (
            <div key={s.key} className="kpi-card text-center">
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className="text-xl font-bold text-slate-900">{s.count}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 font-medium">Platform:</span>
            {PLATFORMS.map(p => (
              <button key={p} onClick={() => setFilterPlatform(p)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filterPlatform === p ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 font-medium">Tipe:</span>
            {CONTENT_TYPES.map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filterType === t ? "bg-purple-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-head">Judul Konten</th>
                <th className="table-head">Brand</th>
                <th className="table-head">Tipe</th>
                <th className="table-head">Platform</th>
                <th className="table-head">Tanggal</th>
                <th className="table-head">PIC</th>
                <th className="table-head">Status</th>
                <th className="table-head">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="table-cell font-medium text-slate-800">{c.title}</td>
                  <td className="table-cell text-slate-500">{c.brand}</td>
                  <td className="table-cell">
                    <span className="badge badge-blue">{c.content_type}</span>
                  </td>
                  <td className="table-cell text-slate-500">{c.platform}</td>
                  <td className="table-cell text-slate-500">{c.scheduled_date}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                        {c.pic[0]}
                      </div>
                      <span className="text-sm text-slate-600">{c.pic}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${statusConfig[c.status].cls}`}>{statusConfig[c.status].label}</span>
                  </td>
                  <td className="table-cell text-slate-400 text-xs">{c.notes || "-"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-slate-300">Tidak ada konten</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
