"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

type Transaction = {
  id: number;
  date: string;
  type: "income" | "expense";
  category: string;
  business_unit: string;
  brand: string;
  amount: number;
  description: string;
};

const dummy: Transaction[] = [
  { id: 1, date: "2026-05-22", type: "income", category: "Penjualan", business_unit: "NF", brand: "Marketplace", amount: 4500000, description: "Penjualan Shopee + Tokopedia" },
  { id: 2, date: "2026-05-22", type: "income", category: "Penjualan", business_unit: "F&B", brand: "Buri Umah", amount: 2800000, description: "Omzet harian Buri Umah" },
  { id: 3, date: "2026-05-22", type: "expense", category: "Iklan", business_unit: "NF", brand: "Iklan", amount: 450000, description: "Budget Meta Ads hari ini" },
  { id: 4, date: "2026-05-22", type: "expense", category: "Bahan Baku", business_unit: "F&B", brand: "Produksi Pusat", amount: 1200000, description: "Beli bahan masak harian" },
  { id: 5, date: "2026-05-21", type: "income", category: "Penjualan", business_unit: "NF", brand: "Marketplace", amount: 3900000, description: "Penjualan Shopee + Tokopedia" },
  { id: 6, date: "2026-05-21", type: "income", category: "Penjualan", business_unit: "F&B", brand: "Kisamen", amount: 1650000, description: "Omzet harian Kisamen" },
  { id: 7, date: "2026-05-21", type: "expense", category: "Operasional", business_unit: "NF", brand: "Gudang", amount: 350000, description: "Biaya packing dan pengiriman" },
  { id: 8, date: "2026-05-21", type: "expense", category: "Gaji", business_unit: "General", brand: "HR", amount: 5000000, description: "Gaji karyawan mingguan" },
  { id: 9, date: "2026-05-20", type: "income", category: "COD", business_unit: "NF", brand: "COD / Pengiriman", amount: 2100000, description: "Pembayaran COD masuk" },
  { id: 10, date: "2026-05-20", type: "expense", category: "Bahan Baku", business_unit: "NF", brand: "Gudang", amount: 800000, description: "Beli bahan produksi" },
];

function fmtCurrency(n: number) {
  if (n >= 1000000) return "Rp " + (n / 1000000).toFixed(1) + "jt";
  if (n >= 1000) return "Rp " + (n / 1000).toFixed(0) + "k";
  return "Rp " + n;
}

const totalIncome  = dummy.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
const totalExpense = dummy.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
const netProfit    = totalIncome - totalExpense;

const BU_OPTIONS = ["Semua", "NF", "F&B", "General"];
const CAT_OPTIONS = ["Semua", "Penjualan", "COD", "Iklan", "Bahan Baku", "Operasional", "Gaji"];

export default function FinancePage() {
  const [filterType, setFilterType] = useState<"Semua" | "income" | "expense">("Semua");
  const [filterBU, setFilterBU] = useState("Semua");
  const [filterCat, setFilterCat] = useState("Semua");

  const filtered = dummy.filter(t =>
    (filterType === "Semua" || t.type === filterType) &&
    (filterBU === "Semua" || t.business_unit === filterBU) &&
    (filterCat === "Semua" || t.category === filterCat)
  );

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content flex-1">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="page-title">Finance</h1>
            <p className="page-subtitle">Laporan keuangan harian — F&B dan NF</p>
          </div>
          <button className="btn-primary">+ Tambah Transaksi</button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="kpi-card border-l-4 border-green-400">
            <p className="text-slate-500 text-xs font-medium">Total Pemasukan (7 hari)</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{fmtCurrency(totalIncome)}</p>
          </div>
          <div className="kpi-card border-l-4 border-red-400">
            <p className="text-slate-500 text-xs font-medium">Total Pengeluaran (7 hari)</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{fmtCurrency(totalExpense)}</p>
          </div>
          <div className={`kpi-card border-l-4 ${netProfit >= 0 ? "border-blue-400" : "border-red-400"}`}>
            <p className="text-slate-500 text-xs font-medium">Net Profit (7 hari)</p>
            <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? "text-blue-600" : "text-red-600"}`}>{fmtCurrency(netProfit)}</p>
            <p className="text-slate-400 text-xs mt-1">Margin: {((netProfit / totalIncome) * 100).toFixed(1)}%</p>
          </div>
        </div>

        {/* Per BU Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {["NF", "F&B"].map(bu => {
            const buIncome  = dummy.filter(t => t.business_unit === bu && t.type === "income").reduce((s, t) => s + t.amount, 0);
            const buExpense = dummy.filter(t => t.business_unit === bu && t.type === "expense").reduce((s, t) => s + t.amount, 0);
            return (
              <div key={bu} className="card p-4">
                <h3 className="font-semibold text-slate-800 mb-3">{bu === "NF" ? "NF / Nusa Fishing" : "F&B / Buri Umah Group"}</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-medium">Pemasukan: {fmtCurrency(buIncome)}</span>
                  <span className="text-red-600 font-medium">Pengeluaran: {fmtCurrency(buExpense)}</span>
                  <span className="text-blue-600 font-bold">Net: {fmtCurrency(buIncome - buExpense)}</span>
                </div>
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full" style={{ width: `${Math.min(100, (buIncome / (buIncome + buExpense)) * 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex gap-1">
            {(["Semua", "income", "expense"] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filterType === t
                  ? t === "income" ? "bg-green-600 text-white" : t === "expense" ? "bg-red-600 text-white" : "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                {t === "Semua" ? "Semua" : t === "income" ? "Pemasukan" : "Pengeluaran"}
              </button>
            ))}
          </div>
          <select className="select-field w-36" value={filterBU} onChange={e => setFilterBU(e.target.value)}>
            {BU_OPTIONS.map(b => <option key={b}>{b}</option>)}
          </select>
          <select className="select-field w-40" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            {CAT_OPTIONS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-head">Tanggal</th>
                <th className="table-head">Tipe</th>
                <th className="table-head">Kategori</th>
                <th className="table-head">Business Unit</th>
                <th className="table-head">Brand</th>
                <th className="table-head">Jumlah</th>
                <th className="table-head">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="table-row">
                  <td className="table-cell text-slate-500">{t.date}</td>
                  <td className="table-cell">
                    <span className={`badge ${t.type === "income" ? "badge-green" : "badge-red"}`}>
                      {t.type === "income" ? "⬆ Masuk" : "⬇ Keluar"}
                    </span>
                  </td>
                  <td className="table-cell"><span className="badge badge-blue">{t.category}</span></td>
                  <td className="table-cell text-slate-600">{t.business_unit}</td>
                  <td className="table-cell text-slate-500">{t.brand}</td>
                  <td className={`table-cell font-bold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {t.type === "income" ? "+" : "-"}{fmtCurrency(t.amount)}
                  </td>
                  <td className="table-cell text-slate-500">{t.description}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-slate-300">Tidak ada transaksi</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
