"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

function fmtCurrency(n: number) {
  if (n >= 1000000) return "Rp " + (n / 1000000).toFixed(1) + "jt";
  if (n >= 1000) return "Rp " + (n / 1000).toFixed(0) + "k";
  return "Rp " + n;
}

const BU_OPTIONS = ["Semua", "NF", "F&B", "General"];
const CAT_OPTIONS = ["Semua", "Penjualan", "COD", "Iklan", "Bahan Baku", "Operasional", "Gaji"];

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"Semua" | "income" | "expense">("Semua");
  const [filterBU, setFilterBU] = useState("Semua");
  const [filterCat, setFilterCat] = useState("Semua");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "income" as "income" | "expense",
    category: "Penjualan",
    business_unit: "NF",
    brand: "",
    amount: 0,
    description: "",
  });

  const [showMokaModal, setShowMokaModal] = useState(false);
  const [mokaKey, setMokaKey] = useState("");
  const [mokaOutletId, setMokaOutletId] = useState("");
  const [mokaDate, setMokaDate] = useState(new Date().toISOString().split("T")[0]);
  const [mokaSyncing, setMokaSyncing] = useState(false);
  const [mokaSyncResult, setMokaSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("finance_transactions")
      .select("*")
      .order("date", { ascending: false })
      .limit(100);
    if (!error && data) setTransactions(data);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!form.description || form.amount <= 0) return;
    const { error } = await supabase.from("finance_transactions").insert([form]);
    if (!error) {
      setShowModal(false);
      setForm({
        date: new Date().toISOString().split("T")[0],
        type: "income",
        category: "Penjualan",
        business_unit: "NF",
        brand: "",
        amount: 0,
        description: "",
      });
      fetchTransactions();
    }
  }

  async function handleMokaSync() {
    if (!mokaKey || !mokaOutletId) return;
    setMokaSyncing(true);
    setMokaSyncResult(null);
    try {
      const res = await fetch("/api/moka/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: mokaKey, outletId: mokaOutletId, date: mokaDate }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMokaSyncResult({ success: true, message: data.message });
        fetchTransactions();
      } else {
        setMokaSyncResult({ success: false, message: data.error ?? "Sync gagal" });
      }
    } catch {
      setMokaSyncResult({ success: false, message: "Koneksi error, coba lagi" });
    } finally {
      setMokaSyncing(false);
    }
  }

  const filtered = transactions.filter(t =>
    (filterType === "Semua" || t.type === filterType) &&
    (filterBU === "Semua" || t.business_unit === filterBU) &&
    (filterCat === "Semua" || t.category === filterCat)
  );

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="main-content flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="page-title">Finance</h1>
            <p className="page-subtitle">Laporan keuangan harian F&amp;B dan NF</p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn-secondary flex items-center gap-2"
              onClick={() => { setShowMokaModal(true); setMokaSyncResult(null); }}
            >
              Sync Moka POS
            </button>
            <button className="btn-primary" onClick={() => setShowModal(true)}>+ Tambah Transaksi</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="kpi-card border-l-4 border-green-400">
            <p className="text-slate-500 text-xs font-medium">Total Pemasukan</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{fmtCurrency(totalIncome)}</p>
          </div>
          <div className="kpi-card border-l-4 border-red-400">
            <p className="text-slate-500 text-xs font-medium">Total Pengeluaran</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{fmtCurrency(totalExpense)}</p>
          </div>
          <div className={"kpi-card border-l-4 " + (netProfit >= 0 ? "border-blue-400" : "border-red-400")}>
            <p className="text-slate-500 text-xs font-medium">Net Profit</p>
            <p className={"text-2xl font-bold mt-1 " + (netProfit >= 0 ? "text-blue-600" : "text-red-600")}>{fmtCurrency(netProfit)}</p>
            {totalIncome > 0 && <p className="text-slate-400 text-xs mt-1">Margin: {((netProfit / totalIncome) * 100).toFixed(1)}%</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {["NF", "F&B"].map(bu => {
            const buIncome = transactions.filter(t => t.business_unit === bu && t.type === "income").reduce((s, t) => s + t.amount, 0);
            const buExpense = transactions.filter(t => t.business_unit === bu && t.type === "expense").reduce((s, t) => s + t.amount, 0);
            return (
              <div key={bu} className="card p-4">
                <h3 className="font-semibold text-slate-800 mb-3">{bu === "NF" ? "NF / Nusa Fishing" : "F&B / Buri Umah Group"}</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-medium">Pemasukan: {fmtCurrency(buIncome)}</span>
                  <span className="text-red-600 font-medium">Pengeluaran: {fmtCurrency(buExpense)}</span>
                  <span className="text-blue-600 font-bold">Net: {fmtCurrency(buIncome - buExpense)}</span>
                </div>
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full" style={{ width: (buIncome + buExpense > 0 ? Math.min(100, (buIncome / (buIncome + buExpense)) * 100) : 0) + "%" }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex gap-1">
            {(["Semua", "income", "expense"] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={"px-3 py-1 rounded-full text-sm font-medium transition-colors " + (filterType === t
                  ? t === "income" ? "bg-green-600 text-white" : t === "expense" ? "bg-red-600 text-white" : "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>
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

        <div className="card overflow-x-auto">
          {loading ? (
            <p className="text-center py-8 text-slate-400">Memuat transaksi dari Supabase...</p>
          ) : (
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
                      <span className={"badge " + (t.type === "income" ? "badge-green" : "badge-red")}>
                        {t.type === "income" ? "Masuk" : "Keluar"}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={"badge " + (t.description?.startsWith("Moka sync") ? "badge-orange" : "badge-blue")}>
                        {t.category}
                      </span>
                    </td>
                    <td className="table-cell text-slate-600">{t.business_unit}</td>
                    <td className="table-cell text-slate-500">{t.brand}</td>
                    <td className={"table-cell font-bold " + (t.type === "income" ? "text-green-600" : "text-red-600")}>
                      {t.type === "income" ? "+" : "-"}{fmtCurrency(t.amount)}
                    </td>
                    <td className="table-cell text-slate-500">{t.description}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-300">Belum ada transaksi. Klik + Tambah Transaksi untuk mulai.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {showMokaModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-bold">Sync dari Moka POS</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">API Key Moka</label>
                  <input
                    type="password"
                    className="input-field font-mono text-sm"
                    placeholder="Masukkan Moka API Key..."
                    value={mokaKey}
                    onChange={e => setMokaKey(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Outlet ID</label>
                  <input
                    type="text"
                    className="input-field font-mono text-sm"
                    placeholder="Outlet ID dari Moka..."
                    value={mokaOutletId}
                    onChange={e => setMokaOutletId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Sync</label>
                  <input
                    type="date"
                    className="input-field"
                    value={mokaDate}
                    onChange={e => setMokaDate(e.target.value)}
                  />
                </div>
                {mokaSyncResult && (
                  <div className={"p-3 rounded-lg text-sm font-medium " + (mokaSyncResult.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200")}>
                    {mokaSyncResult.success ? "Berhasil: " : "Gagal: "}{mokaSyncResult.message}
                  </div>
                )}
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-xs text-amber-700">Data penjualan Moka akan otomatis masuk sebagai <strong>Pemasukan F&amp;B</strong> di tabel transaksi.</p>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button className="btn-secondary flex-1" onClick={() => setShowMokaModal(false)}>Tutup</button>
                <button
                  className="btn-primary flex-1 disabled:opacity-40"
                  disabled={!mokaKey || !mokaOutletId || mokaSyncing}
                  onClick={handleMokaSync}
                >
                  {mokaSyncing ? "Sedang sync..." : "Sync Sekarang"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-bold mb-4">Tambah Transaksi</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                  <input type="date" className="input-field" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipe</label>
                    <select className="select-field" value={form.type} onChange={e => setForm({...form, type: e.target.value as "income" | "expense"})}>
                      <option value="income">Pemasukan</option>
                      <option value="expense">Pengeluaran</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                    <select className="select-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      {CAT_OPTIONS.filter(c => c !== "Semua").map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Business Unit</label>
                    <select className="select-field" value={form.business_unit} onChange={e => setForm({...form, business_unit: e.target.value})}>
                      {BU_OPTIONS.filter(b => b !== "Semua").map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Brand / Divisi</label>
                    <input className="input-field" placeholder="Nama brand..." value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah (Rp)</label>
                  <input type="number" className="input-field" placeholder="0" value={form.amount || ""} onChange={e => setForm({...form, amount: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
                  <input className="input-field" placeholder="Deskripsi transaksi..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
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
