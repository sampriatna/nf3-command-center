"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

const statusConfig: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "badge-gray" },
  brief_done: { label: "Brief Done", cls: "badge-blue" },
  filming: { label: "Filming", cls: "badge-orange" },
  editing: { label: "Editing", cls: "badge-yellow" },
  review: { label: "Review", cls: "badge-purple" },
  posted: { label: "Posted", cls: "badge-green" },
};

const PLATFORMS = ["Semua", "TikTok", "Instagram", "Facebook"];
const CONTENT_TYPES = ["Semua", "Reels", "Carousel", "Story", "Live", "Feed"];

export default function MediaPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState("Semua");
  const [filterType, setFilterType] = useState("Semua");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    brand: "",
    content_type: "Reels",
    platform: "TikTok",
    scheduled_date: new Date().toISOString().split("T")[0],
    status: "draft" as Content["status"],
    pic: "",
    notes: "",
  });

  useEffect(() => {
    fetchContents();
  }, []);

  async function fetchContents() {
    setLoading(true);
    const { data, error } = await supabase
      .from("content_calendar")
      .select("*")
      .order("scheduled_date", { ascending: true });
    if (!error && data) setContents(data);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!form.title || !form.brand) return;
    const { error } = await supabase.from("content_calendar").insert([form]);
    if (!error) {
      setShowModal(false);
      setForm({
        title: "",
        brand: "",
        content_type: "Reels",
        platform: "TikTok",
        scheduled_date: new Date().toISOString().split("T")[0],
        status: "draft",
        pic: "",
        notes: "",
      });
      fetchContents();
    }
  }

  async function updateStatus(id: number, status: Content["status"]) {
    await supabase.from("content_calendar").update({ status }).eq("id", id);
    fetchContents();
  }

  const filtered = contents.filter(c =>
    (filterPlatform === "Semua" || c.platform === filterPlatform) &&
    (filterType === "Semua" || c.content_type === filterType)
  );

  const statusCounts = Object.keys(statusConfig).map(k => ({
    key: k,
    ...statusConfig[k],
    count: contents.filter(c => c.status === k).length,
  }));

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="main-content flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="page-title">Media Pusat</h1>
            <p className="page-subtitle">Kalender konten dan manajemen aset kreatif</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-primary" onClick={() => setShowModal(true)}>+ Tambah Konten</button>
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
          {loading ? (
            <p className="text-center py-8 text-slate-400">Memuat konten dari Supabase...</p>
          ) : (
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
                      {c.pic && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                            {c.pic[0]}
                          </div>
                          <span className="text-sm text-slate-600">{c.pic}</span>
                        </div>
                      )}
                    </td>
                    <td className="table-cell">
                      <select
                        className="text-xs border border-slate-200 rounded px-2 py-1"
                        value={c.status}
                        onChange={e => updateStatus(c.id, e.target.value as Content["status"])}>
                        {Object.entries(statusConfig).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="table-cell text-slate-400 text-xs">{c.notes || "-"}</td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={8} className="text-center py-8 text-slate-300">Belum ada konten. Klik + Tambah Konten untuk mulai.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Tambah Konten */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-bold mb-4">Tambah Konten</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Judul Konten *</label>
                  <input className="input-field" placeholder="Judul konten..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Brand *</label>
                    <input className="input-field" placeholder="Nama brand..." value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">PIC</label>
                    <input className="input-field" placeholder="Nama PIC..." value={form.pic} onChange={e => setForm({...form, pic: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Konten</label>
                    <select className="select-field" value={form.content_type} onChange={e => setForm({...form, content_type: e.target.value})}>
                      {CONTENT_TYPES.filter(t => t !== "Semua").map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Platform</label>
                    <select className="select-field" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
                      {PLATFORMS.filter(p => p !== "Semua").map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Jadwal</label>
                    <input type="date" className="input-field" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select className="select-field" value={form.status} onChange={e => setForm({...form, status: e.target.value as Content["status"]})}>
                      {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                  <input className="input-field" placeholder="Catatan tambahan..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
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
