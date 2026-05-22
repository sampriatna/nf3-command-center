"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

type Product = {
  id: number;
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

const dummy: Product[] = [
  { id: 1, name: "Nusa Rod Premium 1.8m", sku: "NF-ROD-001", category: "Produk Jadi", unit: "pcs", business_unit: "NF", price_sell: 285000, current_stock: 142, min_stock: 30, location: "Gudang NF" },
  { id: 2, name: "Nusa Rod Starter 1.5m", sku: "NF-ROD-002", category: "Produk Jadi", unit: "pcs", business_unit: "NF", price_sell: 185000, current_stock: 89, min_stock: 30, location: "Gudang NF" },
  { id: 3, name: "Nusa Rod Medium 2.1m", sku: "NF-ROD-003", category: "Produk Jadi", unit: "pcs", business_unit: "NF", price_sell: 345000, current_stock: 24, min_stock: 25, location: "Gudang NF" },
  { id: 4, name: "Umpan Premium Pack 500g", sku: "NF-UMP-001", category: "Produk Jadi", unit: "pack", business_unit: "NF", price_sell: 75000, current_stock: 215, min_stock: 50, location: "Gudang NF" },
  { id: 5, name: "Combo Pack NF (Rod + Umpan)", sku: "NF-CMB-001", category: "Produk Jadi", unit: "set", business_unit: "NF", price_sell: 340000, current_stock: 18, min_stock: 20, location: "Gudang NF" },
  { id: 6, name: "Bahan Fiberglass Grade A", sku: "NF-BHN-001", category: "Bahan Baku", unit: "kg", business_unit: "NF", price_sell: 0, current_stock: 45, min_stock: 30, location: "Gudang Produksi" },
  { id: 7, name: "Packaging Box NF", sku: "NF-PKG-001", category: "Packaging", unit: "pcs", business_unit: "NF", price_sell: 0, current_stock: 380, min_stock: 100, location: "Gudang NF" },
  { id: 8, name: "Ayam Bakar Spesial", sku: "FNB-BU-001", category: "Menu F&B", unit: "porsi", business_unit: "F&B", price_sell: 45000, current_stock: 0, min_stock: 0, location: "Buri Umah" },
  { id: 9, name: "Beras Premium", sku: "FNB-BHN-001", category: "Bahan Baku F&B", unit: "kg", business_unit: "F&B", price_sell: 0, current_stock: 85, min_stock: 50, location: "Gudang F&B" },
  { id: 10, name: "Minyak Goreng", sku: "FNB-BHN-002", category: "Bahan Baku F&B", unit: "liter", business_unit: "F&B", price_sell: 0, current_stock: 12, min_stock: 20, location: "Gudang F&B" },
];

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

const alertItems = dummy.filter(p => p.min_stock > 0 && p.current_stock <= p.min_stock);

export default function ProductsPage() {
  const [filterBU, setFilterBU] = useState("Semua");
  const [filterCat, setFilterCat] = useState("Semua");
  const [search, setSearch] = useState("");

  const filtered = dummy.filter(p =>
    (filterBU === "Semua" || p.business_unit === filterBU) &&
    (filterCat === "Semua" || p.category === filterCat) &&
    (search === "" || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content flex-1">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="page-title">Produk & Stok</h1>
            <p className="page-subtitle">Manajemen produk, stok F&B dan NF</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary">📥 Masuk Stok</button>
            <button className="btn-primary">+ Tambah Produk</button>
          </div>
        </div>

        {/* Alert Stok Menipis */}
        {alertItems.length > 0 && (
          <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-orange-500">⚠️</span>
              <span className="font-semibold text-orange-800 text-sm">{alertItems.length} produk perlu restock segera</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {alertItems.map(p => (
                <span key={p.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                  {p.name} — Stok: {p.current_stock} {p.unit} (min: {p.min_stock})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="kpi-card">
            <p className="text-slate-500 text-xs font-medium">Total Produk</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{dummy.length}</p>
          </div>
          <div className="kpi-card">
            <p className="text-slate-500 text-xs font-medium">Produk NF</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{dummy.filter(p => p.business_unit === "NF").length}</p>
          </div>
          <div className="kpi-card">
            <p className="text-slate-500 text-xs font-medium">Produk F&B</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{dummy.filter(p => p.business_unit === "F&B").length}</p>
          </div>
          <div className="kpi-card">
            <p className="text-slate-500 text-xs font-medium">Perlu Restock</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{alertItems.length}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input className="input-field w-48" placeholder="Cari produk / SKU..." value={search} onChange={e => setSearch(e.target.value)} />
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
                <th className="table-head">Nama Produk</th>
                <th className="table-head">SKU</th>
                <th className="table-head">Kategori</th>
                <th className="table-head">BU</th>
                <th className="table-head">Harga Jual</th>
                <th className="table-head">Stok</th>
                <th className="table-head">Min Stok</th>
                <th className="table-head">Lokasi</th>
                <th className="table-head">Status</th>
                <th className="table-head">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const stock = getStockStatus(p.current_stock, p.min_stock);
                return (
                  <tr key={p.id} className="table-row">
                    <td className="table-cell font-semibold text-slate-800">{p.name}</td>
                    <td className="table-cell text-slate-500 font-mono text-xs">{p.sku}</td>
                    <td className="table-cell"><span className="badge badge-blue">{p.category}</span></td>
                    <td className="table-cell">
                      <span className={`badge ${p.business_unit === "NF" ? "badge-blue" : "badge-orange"}`}>{p.business_unit}</span>
                    </td>
                    <td className="table-cell text-slate-700">{fmtCurrency(p.price_sell)}</td>
                    <td className={`table-cell font-bold ${p.current_stock <= p.min_stock && p.min_stock > 0 ? "text-red-600" : "text-slate-800"}`}>
                      {p.current_stock} <span className="text-slate-400 font-normal text-xs">{p.unit}</span>
                    </td>
                    <td className="table-cell text-slate-400">{p.min_stock || "-"}</td>
                    <td className="table-cell text-slate-500">{p.location}</td>
                    <td className="table-cell"><span className={`badge ${stock.cls}`}>{stock.label}</span></td>
                    <td className="table-cell">
                      <button className="text-blue-600 text-xs font-medium hover:underline">Edit</button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center py-8 text-slate-300">Tidak ada produk</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
