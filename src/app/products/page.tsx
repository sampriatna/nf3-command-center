"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

type Product = {
    id: number;
    moka_item_id?: string;
    name: string;
    sku: string;
    category: string;
    unit: string;
    business_unit: string;
    price_sell: number;
    current_stock: number;
    min_stock: number;
    location: string;
};

function getStockStatus(current: number, min: number) {
    if (min === 0) return { label: "N/A", cls: "badge-gray" };
    if (current <= min * 0.5) return { label: "Kritis", cls: "badge-red" };
    if (current <= min) return { label: "Menipis", cls: "badge-orange" };
    return { label: "Aman", cls: "badge-green" };
}

function fmtCurrency(n: number) {
    if (n === 0) return "-";
    return "Rp " + n.toLocaleString("id-ID");
}

const BU_OPTIONS = ["Semua", "NF", "F&B"];
const CAT_OPTIONS = ["Semua", "Produk Jadi", "Bahan Baku", "Packaging", "Menu F&B", "Bahan Baku F&B"];

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterBU, setFilterBU] = useState("Semua");
    const [filterCat, setFilterCat] = useState("Semua");
    const [search, setSearch] = useState("");

  // Moka modal state
  const [showMokaModal, setShowMokaModal] = useState(false);
    const [mokaKey, setMokaKey] = useState("");
    const [mokaOutletId, setMokaOutletId] = useState("");
    const [mokaSyncing, setMokaSyncing] = useState(false);
    const [mokaSyncResult, setMokaSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
    const [deleteKey, setDeleteKey] = useState("");
    const [deleteOutletId, setDeleteOutletId] = useState("");
    const [deleteResult, setDeleteResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
        fetchProducts();
  }, []);

  async function fetchProducts() {
        setLoading(true);
        const { data, error } = await supabase
          .from("inventory_products")
          .select("*")
          .order("business_unit", { ascending: true })
          .order("name", { ascending: true });
        if (!error && data) setProducts(data);
        setLoading(false);
  }

  async function handleMokaSync() {
        if (!mokaKey || !mokaOutletId) return;
        setMokaSyncing(true);
        setMokaSyncResult(null);
        try {
                const res = await fetch("/api/moka/items/sync", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ apiKey: mokaKey, outletId: mokaOutletId }),
                });
                const data = await res.json();
                if (res.ok && data.success) {
                          setMokaSyncResult({ success: true, message: data.message });
                          fetchProducts();
                } else {
                          setMokaSyncResult({ success: false, message: data.error ?? "Sync gagal" });
                }
        } catch {
                setMokaSyncResult({ success: false, message: "Koneksi error, coba lagi" });
        } finally {
                setMokaSyncing(false);
        }
  }

  async function handleDeleteFromMoka() {
        if (!deleteConfirm) return;
        const key = deleteKey || mokaKey;
        const outlet = deleteOutletId || mokaOutletId;
        if (!key || !outlet || !deleteConfirm.moka_item_id) return;

      setDeletingId(deleteConfirm.id);
        setDeleteResult(null);
        try {
                // Hapus dari Moka
          const mokaRes = await fetch("/api/moka/items", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                                apiKey: key,
                                outletId: outlet,
                                itemId: deleteConfirm.moka_item_id,
                    }),
          });
                const mokaData = await mokaRes.json();
                if (!mokaRes.ok) {
                          setDeleteResult({ success: false, message: mokaData.error ?? "Gagal hapus dari Moka" });
                          setDeletingId(null);
                          return;
                }

          // Hapus dari Supabase
          const { error } = await supabase
                  .from("inventory_products")
                  .delete()
                  .eq("id", deleteConfirm.id);

          if (error) {
                    setDeleteResult({ success: false, message: "Terhapus di Moka tapi gagal di Supabase: " + error.message });
          } else {
                    setDeleteResult({ success: true, message: `${deleteConfirm.name} berhasil dihapus dari Moka & database` });
                    fetchProducts();
                    setTimeout(() => {
                                setDeleteConfirm(null);
                                setDeleteResult(null);
                    }, 2000);
          }
        } catch {
                setDeleteResult({ success: false, message: "Koneksi error" });
        } finally {
                setDeletingId(null);
        }
  }

  const filtered = products.filter(p =>
        (filterBU === "Semua" || p.business_unit === filterBU) &&
        (filterCat === "Semua" || p.category === filterCat) &&
        (search === "" || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
                                     );

  const alertItems = products.filter(p => p.min_stock > 0 && p.current_stock <= p.min_stock);

  return (
        <div className="flex">
              <Sidebar />
              <main className="main-content flex-1">
                {/* Header */}
                      <div className="mb-6 flex items-center justify-between">
                                <div>
                                            <h1 className="page-title">Produk & Stok</h1>h1>
                                            <p className="page-subtitle">Manajemen produk, stok F&B dan NF</p>p>
                                </div>div>
                                <div className="flex gap-2">
                                            <button
                                                            className="btn-secondary flex items-center gap-2"
                                                            onClick={() => { setShowMokaModal(true); setMokaSyncResult(null); }}
                                                          >
                                                          🏪 Sync Moka
                                            </button>button>
                                            <button className="btn-secondary">📥 Masuk Stok</button>button>
                                            <button className="btn-primary">+ Tambah Produk</button>button>
                                </div>div>
                      </div>div>
              
                {/* Alert Stok Menipis */}
                {alertItems.length > 0 && (
                    <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
                                <div className="flex items-center gap-2 mb-2">
                                              <span className="text-orange-500">⚠️</span>span>
                                              <span className="font-semibold text-orange-800 text-sm">{alertItems.length} produk perlu restock segera</span>span>
                                </div>div>
                                <div className="flex flex-wrap gap-2">
                                  {alertItems.map(p => (
                                      <span key={p.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                                        {p.name} — Stok: {p.current_stock} {p.unit} (min: {p.min_stock})
                                      </span>span>
                                    ))}
                                </div>div>
                    </div>div>
                      )}
              
                {/* KPI */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="kpi-card">
                                            <p className="text-slate-500 text-xs font-medium">Total Produk</p>p>
                                            <p className="text-2xl font-bold text-slate-900 mt-1">{products.length}</p>p>
                                </div>div>
                                <div className="kpi-card">
                                            <p className="text-slate-500 text-xs font-medium">Produk NF</p>p>
                                            <p className="text-2xl font-bold text-blue-600 mt-1">{products.filter(p => p.business_unit === "NF").length}</p>p>
                                </div>div>
                                <div className="kpi-card">
                                            <p className="text-slate-500 text-xs font-medium">Produk F&B</p>p>
                                            <p className="text-2xl font-bold text-orange-600 mt-1">{products.filter(p => p.business_unit === "F&B").length}</p>p>
                                </div>div>
                                <div className="kpi-card">
                                            <p className="text-slate-500 text-xs font-medium">Perlu Restock</p>p>
                                            <p className="text-2xl font-bold text-red-600 mt-1">{alertItems.length}</p>p>
                                </div>div>
                      </div>div>
              
                {/* Filter */}
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                                <input className="input-field w-48" placeholder="Cari produk / SKU..." value={search} onChange={e => setSearch(e.target.value)} />
                                <select className="select-field w-36" value={filterBU} onChange={e => setFilterBU(e.target.value)}>
                                  {BU_OPTIONS.map(b => <option key={b}>{b}</option>option>)}
                                </select>select>
                                <select className="select-field w-40" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                                  {CAT_OPTIONS.map(c => <option key={c}>{c}</option>option>)}
                                </select>select>
                      </div>div>
              
                {/* Table */}
                      <div className="card overflow-x-auto">
                        {loading ? (
                      <p className="text-center py-8 text-slate-400">Memuat produk dari Supabase...</p>p>
                    ) : (
                      <table className="w-full">
                                    <thead>
                                                    <tr>
                                                                      <th className="table-head">Nama Produk</th>th>
                                                                      <th className="table-head">SKU</th>th>
                                                                      <th className="table-head">Kategori</th>th>
                                                                      <th className="table-head">BU</th>th>
                                                                      <th className="table-head">Harga Jual</th>th>
                                                                      <th className="table-head">Stok</th>th>
                                                                      <th className="table-head">Min Stok</th>th>
                                                                      <th className="table-head">Lokasi</th>th>
                                                                      <th className="table-head">Status</th>th>
                                                                      <th className="table-head">Aksi</th>th>
                                                    </tr>tr>
                                    </thead>thead>
                                    <tbody>
                                      {filtered.map(p => {
                                          const stock = getStockStatus(p.current_stock, p.min_stock);
                                          return (
                                                                <tr key={p.id} className="table-row">
                                                                                      <td className="table-cell font-semibold text-slate-800">
                                                                                        {p.moka_item_id && <span className="text-orange-400 text-xs mr-1">🏪</span>span>}
                                                                                        {p.name}
                                                                                        </td>td>
                                                                                      <td className="table-cell text-slate-500 font-mono text-xs">{p.sku}</td>td>
                                                                                      <td className="table-cell"><span className="badge badge-blue">{p.category}</span>span></td>td>
                                                                                      <td className="table-cell">
                                                                                                              <span className={`badge ${p.business_unit === "NF" ? "badge-blue" : "badge-orange"}`}>{p.business_unit}</span>span>
                                                                                        </td>td>
                                                                                      <td className="table-cell text-slate-700">{fmtCurrency(p.price_sell)}</td>td>
                                                                                      <td className={`table-cell font-bold ${p.current_stock <= p.min_stock && p.min_stock > 0 ? "text-red-600" : "text-slate-800"}`}>
                                                                                        {p.current_stock} <span className="text-slate-400 font-normal text-xs">{p.unit}</span>span>
                                                                                        </td>td>
                                                                                      <td className="table-cell text-slate-400">{p.min_stock || "-"}</td>td>
                                                                                      <td className="table-cell text-slate-500">{p.location}</td>td>
                                                                                      <td className="table-cell"><span className={`badge ${stock.cls}`}>{stock.label}</span>span></td>td>
                                                                                      <td className="table-cell">
                                                                                                              <div className="flex items-center gap-2">
                                                                                                                                        <button className="text-blue-600 text-xs font-medium hover:underline">Edit</button>button>
                                                                                                                {p.moka_item_id && (
                                                                                              <button
                                                                                                                              className="text-red-500 text-xs font-medium hover:underline"
                                                                                                                              onClick={() => { setDeleteConfirm(p); setDeleteResult(null); }}
                                                                                                                            >
                                                                                                                            Hapus
                                                                                                </button>button>
                                                                                                                                        )}
                                                                                                                </div>div>
                                                                                        </td>td>
                                                                </tr>tr>
                                                              );
                      })}
                                      {filtered.length === 0 && !loading && (
                                          <tr><td colSpan={10} className="text-center py-8 text-slate-300">
                                            {products.length === 0 ? "Belum ada produk. Klik Sync Moka untuk mulai." : "Tidak ada produk"}
                                          </td>td></tr>tr>
                                                    )}
                                    </tbody>tbody>
                      </table>table>
                                )}
                      </div>div>
              
                {/* Modal Sync Moka */}
                {showMokaModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                                              <div className="flex items-center gap-3 mb-4">
                                                              <span className="text-2xl">🏪</span>span>
                                                              <h2 className="text-lg font-bold">Sync Produk dari Moka POS</h2>h2>
                                              </div>div>
                                              <div className="space-y-3">
                                                              <div>
                                                                                <label className="block text-sm font-medium text-slate-700 mb-1">API Key Moka</label>label>
                                                                                <input type="password" className="input-field font-mono text-sm" placeholder="Masukkan Moka API Key..."
                                                                                                      value={mokaKey} onChange={e => setMokaKey(e.target.value)} />
                                                              </div>div>
                                                              <div>
                                                                                <label className="block text-sm font-medium text-slate-700 mb-1">Outlet ID</label>label>
                                                                                <input type="text" className="input-field font-mono text-sm" placeholder="Outlet ID dari Moka..."
                                                                                                      value={mokaOutletId} onChange={e => setMokaOutletId(e.target.value)} />
                                                              </div>div>
                                                {mokaSyncResult && (
                                        <div className={`p-3 rounded-lg text-sm font-medium ${mokaSyncResult.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                          {mokaSyncResult.success ? "✓ " : "✗ "}{mokaSyncResult.message}
                                        </div>div>
                                                              )}
                                                              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                                                                <p className="text-xs text-amber-700">Semua item dari Moka akan disinkronkan ke database. Item yang sudah ada akan diperbarui stok & harganya.</p>p>
                                                              </div>div>
                                              </div>div>
                                              <div className="flex gap-3 mt-5">
                                                              <button className="btn-secondary flex-1" onClick={() => setShowMokaModal(false)}>Tutup</button>button>
                                                              <button className="btn-primary flex-1 disabled:opacity-40"
                                                                                  disabled={!mokaKey || !mokaOutletId || mokaSyncing}
                                                                                  onClick={handleMokaSync}>
                                                                {mokaSyncing ? "Sedang sync..." : "Sync Sekarang"}
                                                              </button>button>
                                              </div>div>
                                </div>div>
                    </div>div>
                      )}
              
                {/* Modal Konfirmasi Hapus via Moka */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                                              <div className="flex items-center gap-3 mb-4">
                                                              <span className="text-2xl">🗑️</span>span>
                                                              <h2 className="text-lg font-bold text-red-600">Hapus dari Moka POS</h2>h2>
                                              </div>div>
                                              <p className="text-slate-600 text-sm mb-4">
                                                              Produk <strong>{deleteConfirm.name}</strong>strong> akan dihapus permanen dari Moka POS dan database.
                                              </p>p>
                                              <div className="space-y-3">
                                                              <div>
                                                                                <label className="block text-sm font-medium text-slate-700 mb-1">API Key Moka</label>label>
                                                                                <input type="password" className="input-field font-mono text-sm" placeholder="Masukkan Moka API Key..."
                                                                                                      value={deleteKey || mokaKey} onChange={e => setDeleteKey(e.target.value)} />
                                                              </div>div>
                                                              <div>
                                                                                <label className="block text-sm font-medium text-slate-700 mb-1">Outlet ID</label>label>
                                                                                <input type="text" className="input-field font-mono text-sm" placeholder="Outlet ID dari Moka..."
                                                                                                      value={deleteOutletId || mokaOutletId} onChange={e => setDeleteOutletId(e.target.value)} />
                                                              </div>div>
                                                {deleteResult && (
                                        <div className={`p-3 rounded-lg text-sm font-medium ${deleteResult.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                          {deleteResult.success ? "✓ " : "✗ "}{deleteResult.message}
                                        </div>div>
                                                              )}
                                                              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                                                                <p className="text-xs text-red-700 font-medium">⚠️ Aksi ini tidak bisa dibatalkan. Produk akan hilang dari Moka dan database.</p>p>
                                                              </div>div>
                                              </div>div>
                                              <div className="flex gap-3 mt-5">
                                                              <button className="btn-secondary flex-1" onClick={() => { setDeleteConfirm(null); setDeleteResult(null); }}>Batal</button>button>
                                                              <button
                                                                                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-40"
                                                                                  disabled={deletingId === deleteConfirm.id || !!deleteResult?.success}
                                                                                  onClick={handleDeleteFromMoka}
                                                                                >
                                                                {deletingId === deleteConfirm.id ? "Menghapus..." : "Ya, Hapus Permanen"}
                                                              </button>button>
                                              </div>div>
                                </div>div>
                    </div>div>
                      )}
              </main>main>
        </div>div>
      );
}</div>
