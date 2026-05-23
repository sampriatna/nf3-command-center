"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Campaign = {
  id: number;
  name: string;
  brand: string;
  platform: string;
  objective: string;
  budget_daily: number;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  closing: number;
  cpa: number;
  roas: number;
  status: "active" | "paused" | "ended";
};

const statusConfig: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "badge-green" },
  paused: { label: "Paused", cls: "badge-yellow" },
  ended: { label: "Ended", cls: "badge-gray" },
};

function fmtCurrency(n: number) {
  if (n >= 1000000) return "Rp " + (n / 1000000).toFixed(1) + "jt";
  if (n >= 1000) return "Rp " + (n / 1000).toFixed(0) + "k";
  return "Rp " + n;
}
function fmtNum(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

export default function AdsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    brand: "",
    platform: "Meta Ads",
    objective: "Conversion",
    budget_daily: 0,
    spend: 0,
    impressions: 0,
    clicks: 0,
    leads: 0,
    closing: 0,
    cpa: 0,
    roas: 0,
    status: "active" as Campaign["status"],
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    setLoading(true);
    const { data, error } = await supabase
      .from("ads_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setCampaigns(data);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!form.name || !form.brand) return;
    const { error } = await supabase.from("ads_campaigns").insert([form]);
    if (!error) {
      setShowModal(false);
      setForm({
        name: "",
        brand: "",
        platform: "Meta Ads",
        objective: "Conversion",
        budget_daily: 0,
        spend: 0,
        impressions: 0,
        clicks: 0,
        leads: 0,
        closing: 0,
        cpa: 0,
        roas: 0,
        status: "active",
      });
      fetchCampaigns();
    }
  }

  async function updateStatus(id: number, status: Campaign["status"]) {
    await supabase.from("ads_campaigns").update({ status }).eq("id", id);
    fetchCampaigns();
  }

  const filtered = filterStatus === "Semua" ? campaigns : campaigns.filter(c => c.status === filterStatus);

  const totals = {
    spend: campaigns.reduce((s, c) => s + (c.spend || 0), 0),
    leads: campaigns.reduce((s, c) => s + (c.leads || 0), 0),
    closing: campaigns.reduce((s, c) => s + (c.closing || 0), 0),
    roas: campaigns.length > 0 ? campaigns.reduce((s, c) => s + (c.roas || 0), 0) / campaigns.length : 0,
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="main-content flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="page-title">Ads Center</h1>
            <p className="page-subtitle">Monitor performa iklan semua brand dan platform</p>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Tambah Campaign</button>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="kpi-card border-l-4 border-red-400">
            <p className="text-slate-500 text-xs font-medium">Total Budget Terpakai</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{fmtCurrency(totals.spend)}</p>
          </div>
          <div className="kpi-card border-l-4 border-blue-400">
            <p className="text-slate-500 text-xs font-medium">Total Leads</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{totals.leads}</p>
          </div>
          <div className="kpi-card border-l-4 border-green-400">
            <p className="text-slate-500 text-xs font-medium">Total Closing</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{totals.closing}</p>
            {totals.leads > 0 && <p className="text-slate-400 text-xs mt-1">Rate: {((totals.closing / totals.leads) * 100).toFixed(1)}%</p>}
          </div>
          <div className="kpi-card border-l-4 border-purple-400">
            <p className="text-slate-500 text-xs font-medium">Avg ROAS</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{totals.roas.toFixed(1)}x</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-slate-500 font-medium">Status:</span>
          {["Semua", "active", "paused", "ended"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filterStatus === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {s === "Semua" ? "Semua" : statusConfig[s].label}
            </button>
          ))}
        </div>

        {/* Campaign Table */}
        <div className="card overflow-x-auto">
          {loading ? (
            <p className="text-center py-8 text-slate-400">Memuat campaign dari Supabase...</p>
          ) : (
            <table className="w-full min-w-max">
              <thead>
                <tr>
                  <th className="table-head">Campaign</th>
                  <th className="table-head">Brand</th>
                  <th className="table-head">Platform</th>
                  <th className="table-head">Budget/Hari</th>
                  <th className="table-head">Total Spend</th>
                  <th className="table-head">Leads</th>
                  <th className="table-head">Closing</th>
                  <th className="table-head">ROAS</th>
                  <th className="table-head">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="table-cell font-semibold text-slate-800">{c.name}</td>
                    <td className="table-cell text-slate-500">{c.brand}</td>
                    <td className="table-cell">
                      <span className="badge badge-blue">{c.platform}</span>
                    </td>
                    <td className="table-cell text-slate-700">{fmtCurrency(c.budget_daily)}</td>
                    <td className="table-cell font-medium text-red-600">{fmtCurrency(c.spend)}</td>
                    <td className="table-cell font-medium text-blue-600">{c.leads}</td>
                    <td className="table-cell font-medium text-green-600">{c.closing}</td>
                    <td className={`table-cell font-bold ${(c.roas || 0) >= 3 ? "text-green-600" : (c.roas || 0) >= 2 ? "text-yellow-600" : "text-red-600"}`}>
                      {(c.roas || 0).toFixed(1)}x
                    </td>
                    <td className="table-cell">
                      <select
                        className="text-xs border border-slate-200 rounded px-2 py-1"
                        value={c.status}
                        onChange={e => updateStatus(c.id, e.target.value as Campaign["status"])}>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="ended">Ended</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={9} className="text-center py-8 text-slate-300">Belum ada campaign. Klik + Tambah Campaign untuk mulai.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Tambah Campaign */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-bold mb-4">Tambah Campaign</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Campaign *</label>
                  <input className="input-field" placeholder="Nama campaign..." value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Brand *</label>
                    <input className="input-field" placeholder="Brand..." value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Platform</label>
                    <select className="select-field" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
                      <option>Meta Ads</option>
                      <option>TikTok Ads</option>
                      <option>Google Ads</option>
                      <option>YouTube Ads</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Objective</label>
                    <select className="select-field" value={form.objective} onChange={e => setForm({...form, objective: e.target.value})}>
                      <option>Awareness</option>
                      <option>Conversion</option>
                      <option>Reach</option>
                      <option>Retargeting</option>
                      <option>Traffic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Budget/Hari (Rp)</label>
                    <input type="number" className="input-field" placeholder="0" value={form.budget_daily || ""} onChange={e => setForm({...form, budget_daily: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select className="select-field" value={form.status} onChange={e => setForm({...form, status: e.target.value as Campaign["status"]})}>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="ended">Ended</option>
                  </select>
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
