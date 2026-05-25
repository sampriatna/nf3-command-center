"use client";

import { useState, useEffect, useRef } from "react";
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

  // Moka sync state (NF) - pakai OAuth otomatis, tidak perlu input manual
  const [mokaDate, setMokaDate] = useState(new Date().toISOString().split("T")[0]);
    const [mokaSyncing, setMokaSyncing] = useState(false);
    const [mokaSyncResult, setMokaSyncResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showMokaModal, setShowMokaModal] = useState(false);
    const [mokaConnected, setMokaConnected] = useState<boolean | null>(null);

  // ESB / F&B state - CSV import
  const [showEsbModal, setShowEsbModal] = useState(false);
    const [esbSyncing, setEsbSyncing] = useState(false);
    const [esbResult, setEsbResult] = useState<{ success: boolean; message: string } | null>(null);
    const [esbDate, setEsbDate] = useState(new Date().toISOString().split("T")[0]);
    const [esbAmount, setEsbAmount] = useState(0);
    const [esbTransactions, setEsbTransactions] = useState(0);
    const [esbOutlet, setEsbOutlet] = useState("Buri Umah");
    const csvRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
        fetchTransactions();
        checkMokaConnection();
  }, []);

  async function checkMokaConnection() {
        const { data } = await supabase
          .from("moka_connections")
          .select("id, expires_at")
          .limit(1)
          .single();
        setMokaConnected(!!data);
  }

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

  // Moka Sync untuk NF - pakai OAuth token dari Supabase (tidak perlu input manual)
  async function handleMokaSync() {
        setMokaSyncing(true);
        setMokaSyncResult(null);
        try {
                const res = await fetch("/api/moka/sync", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ date: mokaDate }),
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

  // ESB / F&B - manual input atau CSV import
  async function handleEsbManualInput() {
        if (esbAmount <= 0) return;
        setEsbSyncing(true);
        setEsbResult(null);
        try {
                const { error } = await supabase.from("finance_transactions").insert([{
                          date: esbDate,
                          type: "income",
                          category: "Penjualan",
                          business_unit: "F&B",
                          brand: esbOutlet,
                          amount: esbAmount,
                          description: `ESB manual - ${esbOutlet} - ${esbTransactions} transaksi`,
                }]);
                if (!error) {
                          setEsbResult({ success: true, message: `Berhasil input omzet ${fmtCurrency(esbAmount)} untuk ${esbOutlet}` });
                          fetchTransactions();
                          setEsbAmount(0);
                          setEsbTransactions(0);
                } else {
                          setEsbResult({ success: false, message: error.message });
                }
        } catch {
                setEsbResult({ success: false, message: "Error, coba lagi" });
        } finally {
                setEsbSyncing(false);
        }
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setEsbSyncing(true);
        setEsbResult(null);
        try {
                const text = await file.text();
                const lines = text.split("\n").filter(l => l.trim());
                if (lines.length < 2) {
                          setEsbResult({ success: false, message: "CSV kosong atau format salah" });
                          return;
                }
                const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
                const rows = lines.slice(1).map(line => {
                          const vals = line.split(",");
                          const row: Record<string, string> = {};
                          headers.forEach((h, i) => { row[h] = vals[i]?.trim() ?? ""; });
                          return row;
                });
                const inserts = rows.filter(r => r.amount || r.jumlah || r.total).map(r => ({
                          date: r.date || r.tanggal || esbDate,
                          type: "income" as const,
                          category: "Penjualan",
                          business_unit: "F&B",
                          brand: r.outlet || r.brand || r.nama_outlet || esbOutlet,
                          amount: Math.round(parseFloat(r.amount || r.jumlah || r.total || "0")),
                          description: r.description || r.keterangan || `ESB CSV import - ${file.name}`,
                }));
                if (inserts.length === 0) {
                          setEsbResult({ success: false, message: "Tidak ada data valid di CSV" });
                          return;
                }
                const { data: inserted, error } = await supabase
                  .from("finance_transactions")
                  .upsert(inserts, { onConflict: "description", ignoreDuplicates: true })
                  .select();
                if (!error) {
                          setEsbResult({ success: true, message: `Berhasil import ${inserted?.length ?? inserts.length} transaksi F&B dari CSV` });
                          fetchTransactions();
                } else {
                          setEsbResult({ success: false, message: error.message });
                }
        } catch (err) {
                setEsbResult({ success: false, message: String(err) });
        } finally {
                setEsbSyncing(false);
                if (csvRef.current) csvRef.current.value = "";
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
                                  {/* Moka = NF / Nusa Fishing */}
                                            <button
                                                            className="btn-secondary flex items-center gap-2"
                                                            onClick={() => { setShowMokaModal(true); setMokaSyncResult(null); }}
                                                          >
                                                          🔄 Sync Moka NF
                                            </button>
                                  {/* ESB = F&B / Buri Umah Group */}
                                            <button
                                                            className="btn-secondary flex items-center gap-2"
                                                            onClick={() => { setShowEsbModal(true); setEsbResult(null); }}
                                                          >
                                                          📊 Input F&amp;B
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
                        {[
          { bu: "NF", label: "NF / Nusa Fishing", badge: "Moka POS", badgeColor: "text-blue-600 bg-blue-50" },
          { bu: "F&B", label: "F&B / Buri Umah Group", badge: "ESB", badgeColor: "text-orange-600 bg-orange-50" },
                    ].map(({ bu, label, badge, badgeColor }) => {
                                  const buIncome = transactions.filter(t => t.business_unit === bu && t.type === "income").reduce((s, t) => s + t.amount, 0);
                                  const buExpense = transactions.filter(t => t.business_unit === bu && t.type === "expense").reduce((s, t) => s + t.amount, 0);
                                  return (
                                                  <div key={bu} className="card p-4">
                                                                  <div className="flex items-center justify-between mb-3">
                                                                                    <h3 className="font-semibold text-slate-800">{label}</h3>
                                                                                    <span className={"text-xs font-medium px-2 py-1 rounded-full " + badgeColor}>POS: {badge}</span>
                                                                  </div>
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
                      <p className="text-center py-8 text-slate-400">Memuat transaksi...</p>
                    ) : (
                      <table className="w-full">
                                    <thead>
                                                    <tr>
                                                                      <th className="table-head">Tanggal</th>
                                                                      <th className="table-head">Tipe</th>
                                                                      <th className="table-head">Kategori</th>
                                                                      <th className="table-head">Business Unit</th>
                                                                      <th className="table-head">Brand / Outlet</th>
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
                                                                                    <span className="badge badge-blue">{t.category}</span>
                                                              </td>
                                                              <td className="table-cell">
                                                                                    <span className={"badge " + (t.business_unit === "NF" ? "badge-blue" : t.business_unit === "F&B" ? "badge-orange" : "badge-gray")}>
                                                                                      {t.business_unit}
                                                                                      </span>
                                                              </td>
                                                              <td className="table-cell text-slate-500">{t.brand}</td>
                                                              <td className={"table-cell font-bold " + (t.type === "income" ? "text-green-600" : "text-red-600")}>
                                                                {t.type === "income" ? "+" : "-"}{fmtCurrency(t.amount)}
                                                              </td>
                                                              <td className="table-cell text-slate-500 text-xs">{t.description}</td>
                                          </tr>
                                        ))}
                                      {filtered.length === 0 && (
                                          <tr><td colSpan={7} className="text-center py-8 text-slate-300">Belum ada transaksi. Klik + Tambah Transaksi untuk mulai.</td></tr>
                                                    )}
                                    </tbody>
                      </table>
                                )}
                      </div>
              
                {/* Modal Moka Sync - NF (OAuth otomatis, tidak perlu input API key) */}
                {showMokaModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                                              <div className="flex items-center gap-3 mb-4">
                                                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">🔄</div>
                                                              <div>
                                                                                <h2 className="text-lg font-bold">Sync Moka POS</h2>
                                                                                <p className="text-xs text-slate-500">Nusa Fishing (NF) — POS Kasir</p>
                                                              </div>
                                              </div>
                                
                                  {mokaConnected === false && (
                                      <div className="p-3 bg-red-50 rounded-lg border border-red-200 mb-4">
                                                        <p className="text-sm text-red-700 font-medium mb-2">Moka belum terhubung</p>
                                                        <p className="text-xs text-red-600 mb-3">Hubungkan akun Moka sekali, lalu sync bisa dipakai semua tim tanpa input API key lagi.</p>
                                                        <a href="/api/moka/auth" className="btn-primary text-sm inline-block">Hubungkan Moka via OAuth</a>
                                      </div>
                                              )}
                                
                                  {mokaConnected === true && (
                                      <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-4 flex items-center gap-2">
                                                        <span className="text-green-600">✅</span>
                                                        <p className="text-sm text-green-700 font-medium">Moka sudah terhubung — siap sync otomatis</p>
                                      </div>
                                              )}
                                
                                              <div className="space-y-3">
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
                                          {mokaSyncResult.success ? "✅ " : "❌ "}{mokaSyncResult.message}
                                        </div>
                                                              )}
                                                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                                                <p className="text-xs text-blue-700">Data penjualan Moka akan masuk sebagai <strong>Pemasukan NF</strong>. Token OAuth disimpan di server, tidak perlu input ulang.</p>
                                                              </div>
                                              </div>
                                              <div className="flex gap-3 mt-5">
                                                              <button className="btn-secondary flex-1" onClick={() => setShowMokaModal(false)}>Tutup</button>
                                                              <button
                                                                                  className="btn-primary flex-1 disabled:opacity-40"
                                                                                  disabled={!mokaConnected || mokaSyncing}
                                                                                  onClick={handleMokaSync}
                                                                                >
                                                                {mokaSyncing ? "Sedang sync..." : "Sync Sekarang"}
                                                              </button>
                                              </div>
                                </div>
                    </div>
                      )}
              
                {/* Modal ESB / F&B Input */}
                {showEsbModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                                              <div className="flex items-center gap-3 mb-4">
                                                              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl">📊</div>
                                                              <div>
                                                                                <h2 className="text-lg font-bold">Input Data F&amp;B</h2>
                                                                                <p className="text-xs text-slate-500">Buri Umah Group — ESB / Manual</p>
                                                              </div>
                                              </div>
                                
                                              <div className="flex gap-2 mb-4">
                                                              <button className="flex-1 py-2 text-sm font-medium rounded-lg bg-orange-600 text-white">Input Manual</button>
                                                              <label className="flex-1 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer text-center">
                                                                                📎 Upload CSV
                                                                                <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
                                                              </label>
                                              </div>
                                
                                              <div className="space-y-3">
                                                              <div className="grid grid-cols-2 gap-3">
                                                                                <div>
                                                                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                                                                                                    <input type="date" className="input-field" value={esbDate} onChange={e => setEsbDate(e.target.value)} />
                                                                                </div>
                                                                                <div>
                                                                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Outlet</label>
                                                                                                    <select className="select-field" value={esbOutlet} onChange={e => setEsbOutlet(e.target.value)}>
                                                                                                                          <option>Buri Umah</option>
                                                                                                                          <option>Kisamen</option>
                                                                                                                          <option>Samtaro Express</option>
                                                                                                                          <option>Produksi Pusat</option>
                                                                                                      </select>
                                                                                </div>
                                                              </div>
                                                              <div>
                                                                                <label className="block text-sm font-medium text-slate-700 mb-1">Total Omzet (Rp)</label>
                                                                                <input type="number" className="input-field" placeholder="0" value={esbAmount || ""} onChange={e => setEsbAmount(parseInt(e.target.value) || 0)} />
                                                              </div>
                                                              <div>
                                                                                <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Transaksi</label>
                                                                                <input type="number" className="input-field" placeholder="0" value={esbTransactions || ""} onChange={e => setEsbTransactions(parseInt(e.target.value) || 0)} />
                                                              </div>
                                                {esbResult && (
                                        <div className={"p-3 rounded-lg text-sm font-medium " + (esbResult.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200")}>
                                          {esbResult.success ? "✅ " : "❌ "}{esbResult.message}
                                        </div>
                                                              )}
                                                              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                                                                <p className="text-xs text-amber-700 font-medium mb-1">📋 Format CSV yang diterima</p>
                                                                                <p className="text-xs text-amber-600 font-mono">date,outlet,amount,description</p>
                                                                                <p className="text-xs text-amber-600">atau: tanggal, nama_outlet, jumlah, keterangan</p>
                                                              </div>
                                              </div>
                                              <div className="flex gap-3 mt-5">
                                                              <button className="btn-secondary flex-1" onClick={() => setShowEsbModal(false)}>Tutup</button>
                                                              <button
                                                                                  className="btn-primary flex-1 disabled:opacity-40"
                                                                                  disabled={esbAmount <= 0 || esbSyncing}
                                                                                  onClick={handleEsbManualInput}
                                                                                >
                                                                {esbSyncing ? "Menyimpan..." : "Simpan Data F&B"}
                                                              </button>
                                              </div>
                                </div>
                    </div>
                      )}
              
                {/* Modal Tambah Transaksi */}
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
                                                                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Brand / Outlet</label>
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
}</div>
