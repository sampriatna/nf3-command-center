"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Task = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  deadline?: string;
  notes?: string;
  created_at?: string;
};

type FormState = {
  title: string;
  bu: string;
  brand: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  deadline: string;
  notes: string;
};

const BU_OPTIONS = ["FNB", "NF", "Personal", "General"];
const BRAND_MAP: Record<string, string[]> = {
  FNB: ["Buri Umah", "Kisamen", "Samtaro Express", "Produksi Pusat", "Gudang F&B"],
  NF: ["CS & Lead NF", "Marketplace NF", "Packing & Gudang NF"],
  Personal: ["Personal"],
  General: ["General"],
};

const AGENT_RULES: [string[], string][] = [
  [["reservasi","outlet","menu","dapur","kasir","fnb"], "AI F&B Manager"],
  [["cod","marketplace","packing","resi","pengiriman","cbt","cst"], "AI NF Operations Manager"],
  [["caption","konten","reels","carousel","posting","desain"], "AI Content Creator"],
  [["wa","customer","komplain","chat","follow up","tanya harga","cs"], "AI CS & Lead Responder"],
  [["iklan","ads","budget","ctr","campaign"], "AI Ads Analyst"],
  [["omzet","laporan","gaji","biaya","pemasukan","pengeluaran"], "AI Finance Report Analyst"],
  [["stok","gudang","bahan","restock","waste"], "AI Inventory & Stock Manager"],
  [["sop","training","aturan","karyawan","absensi","teguran","hr"], "AI SOP & HR Assistant"],
  [["dashboard","data","grafik","insight","analisa"], "AI Data & Dashboard Analyst"],
];

const AGENT_CODE_MAP: Record<string, string> = {
  "AI Manager": "ai_manager",
  "AI F&B Manager": "ai_fnb",
  "AI NF Operations Manager": "ai_nf_ops",
  "AI Content Creator": "ai_content",
  "AI CS & Lead Responder": "ai_cs",
  "AI Ads Analyst": "ai_ads",
  "AI Finance Report Analyst": "ai_finance",
  "AI Inventory & Stock Manager": "ai_inventory",
  "AI SOP & HR Assistant": "ai_sop",
  "AI Data & Dashboard Analyst": "ai_data",
};

function detectAgent(title: string): string {
  const lower = title.toLowerCase();
  for (const [keywords, agent] of AGENT_RULES) {
    if (keywords.some(k => lower.includes(k))) return agent;
  }
  return "AI Manager";
}

const STATUS_COLS = [
  { key: "todo", label: "To Do", color: "bg-gray-100" },
  { key: "in_progress", label: "In Progress", color: "bg-blue-50" },
  { key: "review", label: "Review", color: "bg-yellow-50" },
  { key: "done", label: "Done", color: "bg-green-50" },
];

const PRIORITY_COLOR: Record<string, string> = {
  low: "badge-gray",
  medium: "badge-blue",
  high: "badge-orange",
  urgent: "badge-red",
};

const DEFAULT_FORM: FormState = {
  title: "",
  bu: "FNB",
  brand: "",
  status: "todo",
  priority: "medium",
  deadline: "",
  notes: "",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterBU, setFilterBU] = useState("All");
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setTasks(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Judul task wajib diisi"); return; }
    setSaving(true);
    setError("");

    const agentName = detectAgent(form.title);
    let agentId: string | null = null;
    const code = AGENT_CODE_MAP[agentName];
    if (code) {
      const { data: agentData } = await supabase
        .from("ai_agents")
        .select("id")
        .eq("code", code)
        .single();
      if (agentData) agentId = agentData.id;
    }

    const { error: insertError } = await supabase.from("tasks").insert([{
      title: form.title.trim(),
      notes: form.notes.trim() || null,
      status: form.status,
      priority: form.priority,
      deadline: form.deadline || null,
      ai_agent_id: agentId,
    }]);

    if (insertError) {
      setError("Gagal menyimpan: " + insertError.message);
    } else {
      setShowForm(false);
      setForm(DEFAULT_FORM);
      fetchTasks();
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: Task["status"]) {
    await supabase.from("tasks").update({ status }).eq("id", id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }

  const cols = STATUS_COLS.map(col => ({
    ...col,
    tasks: tasks.filter(t => t.status === col.key),
  }));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="main-content flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">Task Center</h1>
            <p className="page-subtitle">Kelola semua task dengan AI auto-assign</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Tambah Task
          </button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {["All", ...BU_OPTIONS].map(bu => (
            <button
              key={bu}
              onClick={() => setFilterBU(bu)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterBU === bu
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
              }`}
            >
              {bu}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-12 text-gray-400">Memuat task dari Supabase...</div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cols.map(col => (
              <div key={col.key} className={`${col.color} rounded-xl p-4 min-h-[300px]`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700">{col.label}</h3>
                  <span className="bg-white text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full border">
                    {col.tasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {col.tasks.map(task => (
                    <div key={task.id} className="kanban-card">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-gray-800 leading-tight">{task.title}</p>
                        <span className={`${PRIORITY_COLOR[task.priority]} text-xs shrink-0`}>
                          {task.priority}
                        </span>
                      </div>
                      {task.notes && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.notes}</p>
                      )}
                      {task.deadline && (
                        <p className="text-xs text-gray-400 mb-2">
                          Deadline: {new Date(task.deadline).toLocaleDateString("id-ID")}
                        </p>
                      )}
                      <div className="flex gap-1 flex-wrap">
                        {(["todo","in_progress","review","done"] as const).filter(s => s !== task.status).map(s => (
                          <button
                            key={s}
                            onClick={() => updateStatus(task.id, s)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded transition-colors"
                          >
                            {STATUS_COLS.find(c => c.key === s)?.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {col.tasks.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">Tidak ada task</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Tambah Task Baru</h2>
                  <button onClick={() => { setShowForm(false); setError(""); }} className="text-gray-400 hover:text-gray-600 text-xl font-bold">x</button>
                </div>
                {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Judul Task *</label>
                    <input
                      className="input-field"
                      placeholder="Tulis judul task..."
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    />
                    {form.title && (
                      <p className="text-xs text-blue-600 mt-1">AI Agent: {detectAgent(form.title)}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Unit</label>
                      <select className="select-field" value={form.bu} onChange={e => setForm(f => ({ ...f, bu: e.target.value, brand: "" }))}>
                        {BU_OPTIONS.map(bu => <option key={bu}>{bu}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brand/Divisi</label>
                      <select className="select-field" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}>
                        <option value="">Pilih brand</option>
                        {(BRAND_MAP[form.bu] || []).map(b => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select className="select-field" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as FormState["status"] }))}>
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prioritas</label>
                      <select className="select-field" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as FormState["priority"] }))}>
                        <option value="low">Rendah</option>
                        <option value="medium">Sedang</option>
                        <option value="high">Tinggi</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                    <input type="datetime-local" className="input-field" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                    <textarea className="input-field" rows={3} placeholder="Catatan tambahan..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => { setShowForm(false); setError(""); }} className="btn-secondary flex-1">Batal</button>
                    <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Menyimpan..." : "Simpan Task"}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
