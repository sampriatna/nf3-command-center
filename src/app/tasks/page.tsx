"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

type Task = {
  id: number;
  title: string;
  business_unit: string;
  brand: string;
  assigned_to: string;
  ai_agent: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  deadline: string;
  notes: string;
};

type FormState = {
  title: string;
  business_unit: string;
  brand: string;
  assigned_to: string;
  priority: "low" | "medium" | "high" | "urgent";
  deadline: string;
  notes: string;
};

const dummy: Task[] = [
  { id: 1, title: "Desain banner promo Lebaran", business_unit: "NF", brand: "Iklan", assigned_to: "Rini", ai_agent: "AI Content Creator", status: "in_progress", priority: "high", deadline: "2026-05-24", notes: "Untuk TikTok dan IG" },
  { id: 2, title: "Follow up lead WA batch kemarin", business_unit: "NF", brand: "CS", assigned_to: "Sari", ai_agent: "AI CS & Lead Responder", status: "todo", priority: "urgent", deadline: "2026-05-22", notes: "50 lead belum dibalas" },
  { id: 3, title: "Update harga Shopee dan Tokopedia", business_unit: "NF", brand: "Marketplace", assigned_to: "Budi", ai_agent: "AI NF Operations Manager", status: "todo", priority: "medium", deadline: "2026-05-23", notes: "" },
  { id: 4, title: "Reels produk baru Nusa Fishing Rod", business_unit: "NF", brand: "Iklan", assigned_to: "Dika", ai_agent: "AI Content Creator", status: "review", priority: "high", deadline: "2026-05-25", notes: "Tunggu approve owner" },
  { id: 5, title: "Cek stok gudang bulan ini", business_unit: "NF", brand: "Packing", assigned_to: "Andi", ai_agent: "AI Inventory & Stock Manager", status: "done", priority: "medium", deadline: "2026-05-21", notes: "Sudah dicek" },
  { id: 6, title: "Laporan omzet mingguan", business_unit: "F&B", brand: "Finance", assigned_to: "Maya", ai_agent: "AI Finance Report Analyst", status: "in_progress", priority: "high", deadline: "2026-05-22", notes: "" },
  { id: 7, title: "SOP pelayanan meja Buri Umah", business_unit: "F&B", brand: "Buri Umah", assigned_to: "Heri", ai_agent: "AI SOP & HR Assistant", status: "todo", priority: "low", deadline: "2026-05-30", notes: "Update versi terbaru" },
  { id: 8, title: "Analisa performa iklan Meta minggu ini", business_unit: "NF", brand: "Iklan", assigned_to: "Rini", ai_agent: "AI Ads Analyst", status: "review", priority: "high", deadline: "2026-05-22", notes: "CTR drop signifikan" },
];

const statusConfig: Record<string, { label: string; cls: string }> = {
  todo:        { label: "To Do",       cls: "badge-blue" },
  in_progress: { label: "In Progress", cls: "badge-yellow" },
  review:      { label: "Review",      cls: "badge-purple" },
  done:        { label: "Selesai",     cls: "badge-green" },
};

const priorityConfig: Record<string, { label: string; cls: string }> = {
  low:    { label: "Rendah", cls: "badge-gray" },
  medium: { label: "Sedang", cls: "badge-blue" },
  high:   { label: "Tinggi", cls: "badge-orange" },
  urgent: { label: "Urgent", cls: "badge-red" },
};

const AI_RULES: { keywords: string[]; agent: string }[] = [
  { keywords: ["caption","konten","reels","carousel","posting","desain","banner","visual","script","brief"], agent: "AI Content Creator" },
  { keywords: ["wa","customer","komplain","chat","follow up","tanya harga","tanya ongkir","lead"], agent: "AI CS & Lead Responder" },
  { keywords: ["iklan","ads","budget","ctr","campaign","analisa performa","meta","tiktok ads"], agent: "AI Ads Analyst" },
  { keywords: ["sop","training","aturan","karyawan","absensi","teguran","hr","pelayanan"], agent: "AI SOP & HR Assistant" },
  { keywords: ["omzet","laporan","gaji","biaya","pemasukan","pengeluaran","finance","payroll"], agent: "AI Finance Report Analyst" },
  { keywords: ["stok","gudang","bahan","restock","waste","barang masuk","barang keluar","cek stok"], agent: "AI Inventory & Stock Manager" },
  { keywords: ["reservasi","outlet","menu","dapur","service","kasir","f&b","restoran"], agent: "AI F&B Manager" },
  { keywords: ["cod","marketplace","packing","resi","pengiriman","cbt","cst","order nf","shopee","tokopedia"], agent: "AI NF Operations Manager" },
  { keywords: ["dashboard","data","grafik","insight","analisa","ringkasan"], agent: "AI Data & Dashboard Analyst" },
];

function detectAgent(title: string): string {
  const lower = title.toLowerCase();
  for (const rule of AI_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule.agent;
  }
  return "AI Manager / Dispatcher";
}

const COLUMNS: { key: Task["status"]; label: string; color: string }[] = [
  { key: "todo",        label: "To Do",       color: "border-blue-400" },
  { key: "in_progress", label: "In Progress", color: "border-yellow-400" },
  { key: "review",      label: "Review",      color: "border-purple-400" },
  { key: "done",        label: "Selesai",     color: "border-green-400" },
];

const BU_OPTIONS = ["Semua", "F&B", "NF", "Personal", "General"];
const BRAND_MAP: Record<string, string[]> = {
  "F&B": ["Buri Umah", "Kisamen", "Samtaro Express", "Produksi Pusat", "Gudang", "Finance", "HR"],
  "NF":  ["CS", "Iklan", "Marketplace", "Packing", "COD / Pengiriman", "Reseller / Affiliate", "Admin"],
  "Personal": ["Personal"],
  "General":  ["General"],
  "Semua":    ["Semua"],
};

const DEFAULT_FORM: FormState = {
  title: "", business_unit: "NF", brand: "CS", assigned_to: "", priority: "medium", deadline: "", notes: "",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(dummy);
  const [filterBU, setFilterBU] = useState("Semua");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const filtered = filterBU === "Semua" ? tasks : tasks.filter(t => t.business_unit === filterBU);

  function handleAdd() {
    if (!form.title.trim()) return;
    const agent = detectAgent(form.title);
    const newTask: Task = {
      id: Date.now(),
      title: form.title,
      business_unit: form.business_unit,
      brand: form.brand,
      assigned_to: form.assigned_to,
      ai_agent: agent,
      status: "todo",
      priority: form.priority,
      deadline: form.deadline,
      notes: form.notes,
    };
    setTasks([newTask, ...tasks]);
    setShowModal(false);
    setForm(DEFAULT_FORM);
  }

  function moveTask(id: number, newStatus: Task["status"]) {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
  }

  const colCounts = COLUMNS.map(c => filtered.filter(t => t.status === c.key).length);
  const detectedAgent = detectAgent(form.title);

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content flex-1">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="page-title">Task Center</h1>
            <p className="page-subtitle">Kelola semua tugas tim F&B dan NF</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <span>+</span> Tambah Task
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {COLUMNS.map((col, i) => (
            <div key={col.key} className={`kpi-card border-l-4 ${col.color}`}>
              <p className="text-slate-500 text-xs font-medium">{col.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{colCounts[i]}</p>
            </div>
          ))}
        </div>

        {/* Filter BU */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-sm text-slate-500 font-medium">Business Unit:</span>
          {BU_OPTIONS.map(bu => (
            <button key={bu} onClick={() => setFilterBU(bu)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filterBU === bu ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {bu}
            </button>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.key} className="kanban-col">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="font-semibold text-slate-700 text-sm">{col.label}</h3>
                <span className="text-xs text-slate-400 font-medium">{filtered.filter(t => t.status === col.key).length}</span>
              </div>
              {filtered.filter(t => t.status === col.key).map(task => (
                <div key={task.id} className="kanban-card">
                  <p className="text-sm font-semibold text-slate-800 mb-1">{task.title}</p>
                  <p className="text-xs text-slate-400 mb-2">{task.business_unit} · {task.brand}</p>
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <span className={`badge ${priorityConfig[task.priority].cls}`}>{priorityConfig[task.priority].label}</span>
                    {task.deadline && <span className="text-xs text-slate-400">📅 {task.deadline}</span>}
                  </div>
                  <p className="text-xs text-blue-600 font-medium mb-2">🤖 {task.ai_agent}</p>
                  <div className="flex items-center justify-between">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                      {task.assigned_to?.[0] ?? "?"}
                    </div>
                    <select
                      value={task.status}
                      onChange={e => moveTask(task.id, e.target.value as Task["status"])}
                      className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-white text-slate-600 cursor-pointer"
                    >
                      {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              {filtered.filter(t => t.status === col.key).length === 0 && (
                <div className="text-center text-slate-300 text-xs py-8">Tidak ada task</div>
              )}
            </div>
          ))}
        </div>

        {/* Modal Tambah Task */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900">Tambah Task Baru</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Judul Task *</label>
                  <input className="input-field" placeholder="Contoh: Buat reels produk baru..."
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })} />
                  {form.title && (
                    <p className="text-xs text-blue-600 mt-1">🤖 Auto-assign ke: <strong>{detectedAgent}</strong></p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Business Unit</label>
                    <select className="select-field" value={form.business_unit}
                      onChange={e => setForm({ ...form, business_unit: e.target.value, brand: BRAND_MAP[e.target.value]?.[0] ?? "" })}>
                      {["F&B","NF","Personal","General"].map(bu => <option key={bu}>{bu}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Brand / Divisi</label>
                    <select className="select-field" value={form.brand}
                      onChange={e => setForm({ ...form, brand: e.target.value })}>
                      {(BRAND_MAP[form.business_unit] ?? []).map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">PIC / Assigned To</label>
                    <input className="input-field" placeholder="Nama karyawan" value={form.assigned_to}
                      onChange={e => setForm({ ...form, assigned_to: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Prioritas</label>
                    <select className="select-field" value={form.priority}
                      onChange={e => setForm({ ...form, priority: e.target.value as FormState["priority"] })}>
                      <option value="low">Rendah</option>
                      <option value="medium">Sedang</option>
                      <option value="high">Tinggi</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Deadline</label>
                  <input type="date" className="input-field" value={form.deadline}
                    onChange={e => setForm({ ...form, deadline: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Catatan</label>
                  <textarea className="input-field" rows={2} placeholder="Catatan tambahan..." value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
                <button onClick={handleAdd} className="btn-primary">Simpan Task</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
