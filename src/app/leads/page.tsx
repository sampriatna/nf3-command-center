"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

type Lead = {
  id: number;
  name: string;
  phone: string;
  source: string;
  product: string;
  status: "new" | "follow_up" | "closing" | "lost";
  assigned_cs: string;
  notes: string;
  created_at: string;
};

const dummy: Lead[] = [
  { id: 1, name: "Budi Santoso", phone: "08123456789", source: "TikTok Ads", product: "Nusa Rod Premium", status: "follow_up", assigned_cs: "Sari", notes: "Minta katalog, tanya ongkir Surabaya", created_at: "2026-05-22" },
  { id: 2, name: "Rina Melati", phone: "08234567890", source: "Instagram", product: "Nusa Rod Starter", status: "closing", assigned_cs: "Dewi", notes: "Siap order, minta invoice", created_at: "2026-05-22" },
  { id: 3, name: "Ahmad Fauzi", phone: "08345678901", source: "Shopee", product: "Umpan Premium Pack", status: "new", assigned_cs: "Sari", notes: "", created_at: "2026-05-22" },
  { id: 4, name: "Siti Rahayu", phone: "08456789012", source: "WhatsApp Blast", product: "Nusa Rod Premium", status: "lost", assigned_cs: "Dewi", notes: "Budget tidak cukup", created_at: "2026-05-21" },
  { id: 5, name: "Hendra Wijaya", phone: "08567890123", source: "TikTok Ads", product: "Combo Pack NF", status: "follow_up", assigned_cs: "Sari", notes: "Tanya harga grosir", created_at: "2026-05-21" },
  { id: 6, name: "Lia Putri", phone: "08678901234", source: "Meta Ads", product: "Nusa Rod Medium", status: "closing", assigned_cs: "Dewi", notes: "Mau pesan 3 pcs", created_at: "2026-05-21" },
  { id: 7, name: "Dodi Prasetyo", phone: "08789012345", source: "Referral", product: "Umpan Premium Pack", status: "new", assigned_cs: "Sari", notes: "Dari customer Pak Budi", created_at: "2026-05-20" },
  { id: 8, name: "Nurul Hidayah", phone: "08890123456", source: "TikTok Ads", product: "Nusa Rod Starter", status: "follow_up", assigned_cs: "Dewi", notes: "Belum balas chat terakhir", created_at: "2026-05-20" },
  { id: 9, name: "Reza Firmansyah", phone: "08901234567", source: "Meta Ads", product: "Nusa Rod Premium", status: "closing", assigned_cs: "Sari", notes: "Transfer DP sudah masuk", created_at: "2026-05-19" },
  { id: 10, name: "Yuni Astuti", phone: "08012345678", source: "Instagram", product: "Combo Pack NF", status: "lost", assigned_cs: "Dewi", notes: "Pilih produk lain", created_at: "2026-05-19" },
];

const statusConfig: Record<string, { label: string; cls: string }> = {
  new:       { label: "Baru",       cls: "badge-blue" },
  follow_up: { label: "Follow Up",  cls: "badge-yellow" },
  closing:   { label: "Closing",    cls: "badge-green" },
  lost:      { label: "Lost",       cls: "badge-gray" },
};

const SOURCES = ["Semua", "TikTok Ads", "Instagram", "Meta Ads", "Shopee", "WhatsApp Blast", "Referral"];
const CS_LIST = ["Semua", "Sari", "Dewi"];

const counts = {
  new:       dummy.filter(l => l.status === "new").length,
  follow_up: dummy.filter(l => l.status === "follow_up").length,
  closing:   dummy.filter(l => l.status === "closing").length,
  lost:      dummy.filter(l => l.status === "lost").length,
};

export default function LeadsPage() {
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterSource, setFilterSource] = useState("Semua");
  const [filterCS, setFilterCS] = useState("Semua");
  const [search, setSearch] = useState("");

  const filtered = dummy.filter(l =>
    (filterStatus === "Semua" || l.status === filterStatus) &&
    (filterSource === "Semua" || l.source === filterSource) &&
    (filterCS === "Semua" || l.assigned_cs === filterCS) &&
    (search === "" || l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search))
  );

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content flex-1">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="page-title">CS & Lead Tracker</h1>
            <p className="page-subtitle">Monitor leads masuk, follow up, dan closing</p>
          </div>
          <button className="btn-primary">+ Tambah Lead</button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="kpi-card border-l-4 border-blue-400">
            <p className="text-slate-500 text-xs font-medium">Lead Baru</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{counts.new}</p>
          </div>
          <div className="kpi-card border-l-4 border-yellow-400">
            <p className="text-slate-500 text-xs font-medium">Follow Up</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{counts.follow_up}</p>
          </div>
          <div className="kpi-card border-l-4 border-green-400">
            <p className="text-slate-500 text-xs font-medium">Closing</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{counts.closing}</p>
            <p className="text-slate-400 text-xs mt-1">Rate: {((counts.closing / dummy.length) * 100).toFixed(0)}%</p>
          </div>
          <div className="kpi-card border-l-4 border-gray-300">
            <p className="text-slate-500 text-xs font-medium">Lost</p>
            <p className="text-2xl font-bold text-gray-500 mt-1">{counts.lost}</p>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            className="input-field w-48"
            placeholder="Cari nama / HP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="select-field w-36" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="Semua">Semua Status</option>
            {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="select-field w-40" value={filterSource} onChange={e => setFilterSource(e.target.value)}>
            {SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="select-field w-32" value={filterCS} onChange={e => setFilterCS(e.target.value)}>
            {CS_LIST.map(s => <option key={s}>{s === "Semua" ? "Semua CS" : s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-head">Nama</th>
                <th className="table-head">No. HP</th>
                <th className="table-head">Sumber</th>
                <th className="table-head">Produk</th>
                <th className="table-head">CS</th>
                <th className="table-head">Status</th>
                <th className="table-head">Catatan</th>
                <th className="table-head">Tanggal</th>
                <th className="table-head">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="table-row">
                  <td className="table-cell font-semibold text-slate-800">{l.name}</td>
                  <td className="table-cell">
                    <a href={`https://wa.me/62${l.phone.slice(1)}`} target="_blank" rel="noopener noreferrer"
                      className="text-green-600 font-medium hover:underline flex items-center gap-1">
                      📱 {l.phone}
                    </a>
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-blue">{l.source}</span>
                  </td>
                  <td className="table-cell text-slate-600">{l.product}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                        {l.assigned_cs[0]}
                      </div>
                      <span className="text-sm">{l.assigned_cs}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${statusConfig[l.status].cls}`}>{statusConfig[l.status].label}</span>
                  </td>
                  <td className="table-cell text-slate-400 text-xs max-w-48 truncate">{l.notes || "-"}</td>
                  <td className="table-cell text-slate-400 text-xs">{l.created_at}</td>
                  <td className="table-cell">
                    <button className="text-blue-600 text-xs font-medium hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-slate-300">Tidak ada lead</td></tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-50 text-xs text-slate-400">
            Menampilkan {filtered.length} dari {dummy.length} lead
          </div>
        </div>
      </main>
    </div>
  );
}
