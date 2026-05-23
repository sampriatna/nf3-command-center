"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Lead = {
  id: string;
  name: string;
  source?: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  phone?: string;
  notes?: string;
  created_at?: string;
};

type FormState = {
  name: string;
  source: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  phone: string;
  notes: string;
};

const STATUS_COLOR: Record<string, string> = {
  new: "badge-blue",
  contacted: "badge-orange",
  qualified: "badge-purple",
  converted: "badge-green",
  lost: "badge-gray",
};

const STATUS_LABEL: Record<string, string> = {
  new: "Baru",
  contacted: "Dihubungi",
  qualified: "Qualified",
  converted: "Converted",
  lost: "Tidak Jadi",
};

const SOURCE_OPTIONS = ["Instagram", "WhatsApp", "TikTok", "Marketplace", "Referral", "Website", "Lainnya"];

const DEFAULT_FORM: FormState = {
  name: "",
  source: "",
  status: "new",
  phone: "",
  notes: "",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from("nf_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setLeads(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Nama lead wajib diisi"); return; }
    setSaving(true);
    setError("");
    const { error: insertError } = await supabase.from("nf_leads").insert([{
      name: form.name.trim(),
      source: form.source || null,
      status: form.status,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
    }]);
    if (insertError) {
      setError("Gagal menyimpan: " + insertError.message);
    } else {
      setShowForm(false);
      setForm(DEFAULT_FORM);
      fetchLeads();
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: Lead["status"]) {
    await supabase.from("nf_leads").update({ status }).eq("id", id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  }

  const filtered = leads.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.phone || "").includes(search);
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="main-content flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">CS & Lead Tracker</h1>
            <p className="page-subtitle">Kelola lead dan follow-up customer NF</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Tambah Lead
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            className="input-field w-64"
            placeholder="Cari nama atau nomor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="select-field w-44"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">Semua Status</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {Object.entries(STATUS_LABEL).map(([status, label]) => (
            <div key={status} className="card text-center">
              <div className="text-2xl font-bold text-gray-800">
                {leads.filter(l => l.status === status).length}
              </div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Memuat lead dari Supabase...</div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-head">Nama</th>
                  <th className="table-head">No. WA</th>
                  <th className="table-head">Sumber</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">Catatan</th>
                  <th className="table-head">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id} className="table-row">
                    <td className="table-cell font-medium">{lead.name}</td>
                    <td className="table-cell">
                      {lead.phone ? (
                        <a
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-green-600 hover:text-green-700 font-medium"
                        >
                          {lead.phone}
                        </a>
                      ) : "-"}
                    </td>
                    <td className="table-cell">{lead.source || "-"}</td>
                    <td className="table-cell">
                      <span className={`${STATUS_COLOR[lead.status]}`}>
                        {STATUS_LABEL[lead.status]}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500 max-w-xs truncate">{lead.notes || "-"}</td>
                    <td className="table-cell">
                      <select
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                        value={lead.status}
                        onChange={e => updateStatus(lead.id, e.target.value as Lead["status"])}
                      >
                        {Object.entries(STATUS_LABEL).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="table-cell text-center text-gray-400 py-8">
                      {leads.length === 0 ? "Belum ada lead. Klik + Tambah Lead untuk mulai." : "Tidak ada lead yang sesuai filter."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Tambah Lead Baru</h2>
                  <button onClick={() => { setShowForm(false); setError(""); }} className="text-gray-400 hover:text-gray-600 text-xl font-bold">x</button>
                </div>
                {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                    <input className="input-field" placeholder="Nama customer" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No. WhatsApp</label>
                    <input className="input-field" placeholder="628xxxxxxxx" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sumber</label>
                      <select className="select-field" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                        <option value="">Pilih sumber</option>
                        {SOURCE_OPTIONS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select className="select-field" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as FormState["status"] }))}>
                        {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                    <textarea className="input-field" rows={3} placeholder="Catatan lead..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => { setShowForm(false); setError(""); }} className="btn-secondary flex-1">Batal</button>
                    <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Menyimpan..." : "Simpan Lead"}</button>
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
