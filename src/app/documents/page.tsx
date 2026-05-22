"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

type SOPDoc = {
  id: number;
  title: string;
  category: string;
  business_unit: string;
  version: string;
  status: "active" | "draft" | "archived";
  updated_at: string;
  description: string;
};

const dummy: SOPDoc[] = [
  { id: 1, title: "SOP Pelayanan CS WhatsApp", category: "CS", business_unit: "NF", version: "v2.1", status: "active", updated_at: "2026-05-15", description: "Prosedur standar balas chat, follow up, dan handling komplain customer NF" },
  { id: 2, title: "SOP Packing Produk NF", category: "Operasional", business_unit: "NF", version: "v1.3", status: "active", updated_at: "2026-05-10", description: "Standar packing rod, umpan, dan combo pack sebelum dikirim" },
  { id: 3, title: "SOP Upload Marketplace", category: "Marketplace", business_unit: "NF", version: "v1.0", status: "active", updated_at: "2026-05-01", description: "Panduan upload produk di Shopee, Tokopedia, dan TikTok Shop" },
  { id: 4, title: "FAQ Harga dan Ongkir", category: "CS", business_unit: "NF", version: "v3.0", status: "active", updated_at: "2026-05-20", description: "Daftar pertanyaan umum customer dan jawaban standar" },
  { id: 5, title: "Script Closing WA", category: "CS", business_unit: "NF", version: "v2.0", status: "active", updated_at: "2026-05-18", description: "Template kalimat closing untuk berbagai situasi" },
  { id: 6, title: "SOP Pelayanan Meja Buri Umah", category: "Service", business_unit: "F&B", version: "v1.1", status: "active", updated_at: "2026-04-20", description: "Standar pelayanan dari greeting, order, hingga billing" },
  { id: 7, title: "SOP Produksi Dapur Kisamen", category: "Produksi", business_unit: "F&B", version: "v2.0", status: "active", updated_at: "2026-04-15", description: "Prosedur standar persiapan bahan dan memasak" },
  { id: 8, title: "Panduan Brand Identity NF3", category: "Brand", business_unit: "General", version: "v1.0", status: "active", updated_at: "2026-03-01", description: "Logo, warna, font, dan tone of voice semua brand" },
  { id: 9, title: "SOP Rekrut Karyawan", category: "HR", business_unit: "General", version: "v1.0", status: "draft", updated_at: "2026-05-22", description: "Proses seleksi, interview, dan onboarding karyawan baru" },
  { id: 10, title: "Panduan Desain Konten TikTok", category: "Konten", business_unit: "General", version: "v1.2", status: "active", updated_at: "2026-05-05", description: "Ratio, font, warna, template, dan gaya visual untuk TikTok" },
  { id: 11, title: "SOP COD dan Pengiriman", category: "Operasional", business_unit: "NF", version: "v1.0", status: "archived", updated_at: "2026-02-10", description: "Prosedur lama — sudah diganti v2.0" },
  { id: 12, title: "Aturan Kerja dan Kedisiplinan", category: "HR", business_unit: "General", version: "v1.0", status: "active", updated_at: "2026-01-15", description: "Jam kerja, absensi, teguran, sanksi, dan reward karyawan" },
];

const statusConfig: Record<string, { label: string; cls: string }> = {
  active:   { label: "Aktif",     cls: "badge-green" },
  draft:    { label: "Draft",     cls: "badge-yellow" },
  archived: { label: "Arsip",     cls: "badge-gray" },
};

const CATEGORIES = ["Semua", "CS", "Operasional", "Marketplace", "Service", "Produksi", "Brand", "HR", "Konten"];
const BU_OPTIONS = ["Semua", "NF", "F&B", "General"];

export default function DocumentsPage() {
  const [filterCat, setFilterCat] = useState("Semua");
  const [filterBU, setFilterBU] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<SOPDoc | null>(null);

  const filtered = dummy.filter(d =>
    (filterCat === "Semua" || d.category === filterCat) &&
    (filterBU === "Semua" || d.business_unit === filterBU) &&
    (filterStatus === "Semua" || d.status === filterStatus) &&
    (search === "" || d.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content flex-1">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="page-title">Dokumen SOP</h1>
            <p className="page-subtitle">Semua SOP, FAQ, panduan, dan aturan kerja</p>
          </div>
          <button className="btn-primary">+ Buat Dokumen</button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="kpi-card">
            <p className="text-slate-500 text-xs font-medium">Total Dokumen</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{dummy.length}</p>
          </div>
          <div className="kpi-card">
            <p className="text-slate-500 text-xs font-medium">Aktif</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{dummy.filter(d => d.status === "active").length}</p>
          </div>
          <div className="kpi-card">
            <p className="text-slate-500 text-xs font-medium">Draft</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{dummy.filter(d => d.status === "draft").length}</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filter + List */}
          <div className="flex-1">
            {/* Filter */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <input className="input-field w-48" placeholder="Cari dokumen..." value={search} onChange={e => setSearch(e.target.value)} />
              <select className="select-field w-36" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select className="select-field w-32" value={filterBU} onChange={e => setFilterBU(e.target.value)}>
                {BU_OPTIONS.map(b => <option key={b}>{b}</option>)}
              </select>
              <select className="select-field w-36" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="Semua">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="draft">Draft</option>
                <option value="archived">Arsip</option>
              </select>
            </div>

            {/* Document List */}
            <div className="space-y-2">
              {filtered.map(doc => (
                <div key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`card p-4 cursor-pointer hover:border-blue-200 transition-colors ${selectedDoc?.id === doc.id ? "border-blue-400 bg-blue-50" : ""}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-600 text-sm">📄</span>
                        <h3 className="font-semibold text-slate-800 text-sm">{doc.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge badge-blue">{doc.category}</span>
                        <span className={`badge ${doc.business_unit === "NF" ? "badge-blue" : doc.business_unit === "F&B" ? "badge-orange" : "badge-gray"}`}>{doc.business_unit}</span>
                        <span className="badge badge-gray">{doc.version}</span>
                        <span className="text-xs text-slate-400">Update: {doc.updated_at}</span>
                      </div>
                    </div>
                    <span className={`badge ${statusConfig[doc.status].cls} ml-3`}>{statusConfig[doc.status].label}</span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-8 text-slate-300">Tidak ada dokumen</div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          {selectedDoc && (
            <div className="w-80 card p-5 h-fit sticky top-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 text-sm">{selectedDoc.title}</h3>
                <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Kategori:</span>
                  <span className="badge badge-blue">{selectedDoc.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Business Unit:</span>
                  <span className="font-medium">{selectedDoc.business_unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Versi:</span>
                  <span className="font-medium">{selectedDoc.version}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Status:</span>
                  <span className={`badge ${statusConfig[selectedDoc.status].cls}`}>{statusConfig[selectedDoc.status].label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Update:</span>
                  <span className="font-medium">{selectedDoc.updated_at}</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Deskripsi</p>
                <p className="text-sm text-slate-600">{selectedDoc.description}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="btn-primary text-xs flex-1">Buka Dokumen</button>
                <button className="btn-secondary text-xs">Edit</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
