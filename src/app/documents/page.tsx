"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SOPDoc = {
  id: number;
  title: string;
  category: string;
  business_unit: string;
  version: string;
  status: "active" | "draft" | "archived";
  updated_at: string;
  description: string;
  content: string;
};

const statusConfig: Record<string, { label: string; cls: string }> = {
  active: { label: "Aktif", cls: "badge-green" },
  draft: { label: "Draft", cls: "badge-yellow" },
  archived: { label: "Arsip", cls: "badge-gray" },
};

const CATEGORIES = ["Semua", "CS", "Operasional", "Marketplace", "Service", "Produksi", "Brand", "HR", "Konten"];
const BU_OPTIONS = ["Semua", "NF", "F&B", "General"];

export default function DocumentsPage() {
  const [docs, setDocs] = useState<SOPDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("Semua");
  const [filterBU, setFilterBU] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<SOPDoc | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "CS",
    business_unit: "NF",
    version: "v1.0",
    status: "active" as SOPDoc["status"],
    description: "",
    content: "",
  });

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    setLoading(true);
    const { data, error } = await supabase
      .from("sop_documents")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) setDocs(data);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!form.title) return;
    const { error } = await supabase.from("sop_documents").insert([{
      ...form,
      updated_at: new Date().toISOString().split("T")[0],
    }]);
    if (!error) {
      setShowModal(false);
      setForm({
        title: "",
        category: "CS",
        business_unit: "NF",
        version: "v1.0",
        status: "active",
        description: "",
        content: "",
      });
      fetchDocs();
    }
  }

  const filtered = docs.filter(d =>
    (filterCat === "Semua" || d.category === filterCat) &&
    (filterBU === "Semua" || d.business_unit === filterBU) &&
    (filterStatus === "Semua" || d.status === filterStatus) &&
    (search === "" || d.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="main-content flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="page-title">Dokumen SOP</h1>
            <p className="page-subtitle">Semua SOP, FAQ, panduan, dan aturan kerja</p>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Buat Dokumen</button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="kpi-card">
            <p className="text-slate-500 text-xs font-medium">Total Dokumen</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{docs.length}</p>
          </div>
          <div className="kpi-card">
            <p className="text-slate-500 text-xs font-medium">Aktif</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{docs.filter(d => d.status === "active").length}</p>
          </div>
          <div className="kpi-card">
            <p className="text-slate-500 text-xs font-medium">Draft</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{docs.filter(d => d.status === "draft").length}</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filter + List */}
          <div className="flex-1">
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

            {loading ? (
              <p className="text-center py-8 text-slate-400">Memuat dokumen dari Supabase...</p>
            ) : (
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
                      <span className={`badge ${statusConfig[doc.status]?.cls || "badge-gray"} ml-3`}>{statusConfig[doc.status]?.label || doc.status}</span>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-8 text-slate-300">Belum ada dokumen. Klik + Buat Dokumen untuk mulai.</div>
                )}
              </div>
            )}
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
                  <span className={`badge ${statusConfig[selectedDoc.status]?.cls || "badge-gray"}`}>{statusConfig[selectedDoc.status]?.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Update:</span>
                  <span className="font-medium">{selectedDoc.updated_at}</span>
                </div>
              </div>
              {selectedDoc.description && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Deskripsi</p>
                  <p className="text-sm text-slate-600">{selectedDoc.description}</p>
                </div>
              )}
              {selectedDoc.content && (
                <div className="border-t border-slate-100 pt-3 mt-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Isi Dokumen</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedDoc.content}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Buat Dokumen */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold mb-4">Buat Dokumen Baru</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Judul Dokumen *</label>
                  <input className="input-field" placeholder="Judul SOP..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                    <select className="select-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      {CATEGORIES.filter(c => c !== "Semua").map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Business Unit</label>
                    <select className="select-field" value={form.business_unit} onChange={e => setForm({...form, business_unit: e.target.value})}>
                      {BU_OPTIONS.filter(b => b !== "Semua").map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Versi</label>
                    <input className="input-field" placeholder="v1.0" value={form.version} onChange={e => setForm({...form, version: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select className="select-field" value={form.status} onChange={e => setForm({...form, status: e.target.value as SOPDoc["status"]})}>
                      <option value="active">Aktif</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Arsip</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Singkat</label>
                  <input className="input-field" placeholder="Deskripsi dokumen..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Isi Dokumen</label>
                  <textarea className="input-field h-24 resize-none" placeholder="Tulis isi SOP di sini..." value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Batal</button>
                <button className="btn-primary flex-1" onClick={handleSubmit}>Simpan</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
     }
