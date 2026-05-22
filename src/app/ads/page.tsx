"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

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

const dummy: Campaign[] = [
  { id: 1, name: "NF Rod - Awareness TikTok", brand: "NF - Iklan", platform: "TikTok Ads", objective: "Awareness", budget_daily: 150000, spend: 890000, impressions: 125000, clicks: 3200, leads: 48, closing: 12, cpa: 74167, roas: 3.2, status: "active" },
  { id: 2, name: "NF Rod - Conversion Meta", brand: "NF - Iklan", platform: "Meta Ads", objective: "Conversion", budget_daily: 300000, spend: 2100000, impressions: 89000, clicks: 5600, leads: 125, closing: 38, cpa: 55263, roas: 4.1, status: "active" },
  { id: 3, name: "Buri Umah - Local Reach", brand: "F&B - Buri Umah", platform: "Meta Ads", objective: "Reach", budget_daily: 100000, spend: 680000, impressions: 45000, clicks: 1200, leads: 22, closing: 8, cpa: 85000, roas: 2.8, status: "active" },
  { id: 4, name: "NF Umpan - Retargeting", brand: "NF - Iklan", platform: "Meta Ads", objective: "Retargeting", budget_daily: 200000, spend: 1450000, impressions: 34000, clicks: 4100, leads: 89, closing: 31, cpa: 46774, roas: 5.2, status: "paused" },
  { id: 5, name: "Kisamen - Brand Awareness", brand: "F&B - Kisamen", platform: "TikTok Ads", objective: "Awareness", budget_daily: 80000, spend: 240000, impressions: 78000, clicks: 890, leads: 15, closing: 3, cpa: 80000, roas: 1.8, status: "ended" },
];

const statusConfig: Record<string, { label: string; cls: string }> = {
  active: { label: "Active",  cls: "badge-green" },
  paused: { label: "Paused",  cls: "badge-yellow" },
  ended:  { label: "Ended",   cls: "badge-gray" },
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

const totals = {
  spend:   dummy.reduce((s, c) => s + c.spend, 0),
  leads:   dummy.reduce((s, c) => s + c.leads, 0),
  closing: dummy.reduce((s, c) => s + c.closing, 0),
  roas:    dummy.reduce((s, c) => s + c.roas, 0) / dummy.length,
};

export default function AdsPage() {
  const [filterStatus, setFilterStatus] = useState("Semua");

  const filtered = filterStatus === "Semua" ? dummy : dummy.filter(c => c.status === filterStatus);

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content flex-1">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="page-title">Ads Center</h1>
            <p className="page-subtitle">Monitor performa iklan semua brand dan platform</p>
          </div>
          <button className="btn-primary">+ Tambah Campaign</button>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="kpi-card border-l-4 border-red-400">
            <p className="text-slate-500 text-xs font-medium">Total Budget Terpakai</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{fmtCurrency(totals.spend)}</p>
            <p className="text-slate-400 text-xs mt-1">Semua campaign aktif</p>
          </div>
          <div className="kpi-card border-l-4 border-blue-400">
            <p className="text-slate-500 text-xs font-medium">Total Leads</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{totals.leads}</p>
            <p className="text-slate-400 text-xs mt-1">Dari semua platform</p>
          </div>
          <div className="kpi-card border-l-4 border-green-400">
            <p className="text-slate-500 text-xs font-medium">Total Closing</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{totals.closing}</p>
            <p className="text-slate-400 text-xs mt-1">Closing rate: {((totals.closing / totals.leads) * 100).toFixed(1)}%</p>
          </div>
          <div className="kpi-card border-l-4 border-purple-400">
            <p className="text-slate-500 text-xs font-medium">Avg ROAS</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{totals.roas.toFixed(1)}x</p>
            <p className="text-slate-400 text-xs mt-1">Return on Ad Spend</p>
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
          <table className="w-full min-w-max">
            <thead>
              <tr>
                <th className="table-head">Campaign</th>
                <th className="table-head">Brand</th>
                <th className="table-head">Platform</th>
                <th className="table-head">Budget/Hari</th>
                <th className="table-head">Total Spend</th>
                <th className="table-head">Impresi</th>
                <th className="table-head">Klik</th>
                <th className="table-head">Leads</th>
                <th className="table-head">Closing</th>
                <th className="table-head">CPA</th>
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
                  <td className="table-cell text-slate-500">{fmtNum(c.impressions)}</td>
                  <td className="table-cell text-slate-500">{fmtNum(c.clicks)}</td>
                  <td className="table-cell font-medium text-blue-600">{c.leads}</td>
                  <td className="table-cell font-medium text-green-600">{c.closing}</td>
                  <td className="table-cell text-slate-600">{fmtCurrency(c.cpa)}</td>
                  <td className={`table-cell font-bold ${c.roas >= 3 ? "text-green-600" : c.roas >= 2 ? "text-yellow-600" : "text-red-600"}`}>{c.roas.toFixed(1)}x</td>
                  <td className="table-cell">
                    <span className={`badge ${statusConfig[c.status].cls}`}>{statusConfig[c.status].label}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={12} className="text-center py-8 text-slate-300">Tidak ada campaign</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* AI Insight */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="font-semibold text-blue-800 text-sm">AI Ads Analyst — Rekomendasi</p>
              <p className="text-blue-700 text-sm mt-1">Campaign <strong>NF Rod - Conversion Meta</strong> memiliki ROAS tertinggi (4.1x) dengan CPA Rp 55k. Pertimbangkan menaikkan budget 20-30%. Campaign <strong>Kisamen - Brand Awareness</strong> ROAS rendah (1.8x), pertimbangkan pause dan optimasi creative.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
