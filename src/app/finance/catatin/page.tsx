"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

type BusinessSummary = {
  businessId: string;
  business: string;
  cashIn: number;
  cashOut: number;
  cashDifference: number;
  excludedTransfers: number;
  recordedTransactions: number;
};
type DailyRow = {
  business: string;
  date: string;
  outlet: string;
  type: "in" | "out";
  count: number;
  amount: number;
};
type Report = {
  source: string;
  from: string;
  through: string;
  days: number;
  business: BusinessSummary[];
  daily: DailyRow[];
  disclaimer: string;
};

const rupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(amount);

const dateLabel = (date: string) => {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

export default function CatatinFinancePage() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setMessage(null);
      setReport(null);
      try {
        const response = await fetch(`/api/finance/catatin?days=${days}`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Gagal membaca laporan Catatin");
        }
        if (!controller.signal.aborted) setReport(data as Report);
      } catch (error) {
        if (!controller.signal.aborted) {
          setMessage(error instanceof Error ? error.message : "Gagal membaca laporan");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [days, refreshKey]);

  const totalIn = report?.business.reduce((sum, row) => sum + row.cashIn, 0) ?? 0;
  const totalOut = report?.business.reduce((sum, row) => sum + row.cashOut, 0) ?? 0;
  const totalTransfers = report?.business.reduce((sum, row) => sum + row.excludedTransfers, 0) ?? 0;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:block"><Sidebar /></div>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10">
        <Link href="/finance" className="text-sm font-medium text-blue-700 hover:underline">
          ← Finance Command Center
        </Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Catatin · Arus Kas</h1>
            <p className="mt-1 text-sm text-slate-500">
              Ringkasan Nusa Food dan Nusa Fishing langsung dari Catatin, hanya baca.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
              READ ONLY
            </span>
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={loading}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 disabled:opacity-50"
            >
              Muat ulang
            </button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {([7, 30, 90] as const).map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setDays(value)}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${days === value ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
            >
              {value} hari
            </button>
          ))}
        </div>

        {loading && <p className="mt-8 text-sm text-slate-500">Membaca ringkasan Catatin…</p>}
        {message && (
          <div role="alert" className="mt-7 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Data belum tersedia.</strong> {message}
            <p className="mt-2">Catatin tidak diubah. Koneksi khusus baca perlu disiapkan di server Command Center.</p>
          </div>
        )}

        {report && (
          <>
            <p className="mt-5 text-xs text-slate-500">
              Periode {dateLabel(report.from)} – {dateLabel(report.through)} · Sumber: {report.source}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">Kas masuk tercatat</p>
                <p className="mt-2 text-xl font-bold text-green-700">{rupiah(totalIn)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">Kas keluar tercatat</p>
                <p className="mt-2 text-xl font-bold text-red-700">{rupiah(totalOut)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">Selisih arus kas</p>
                <p className="mt-2 text-xl font-bold text-slate-900">{rupiah(totalIn - totalOut)}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {report.business.map((item) => (
                <section key={item.businessId} className="rounded-lg border border-slate-200 bg-white p-4">
                  <h2 className="font-semibold text-slate-900">{item.business}</h2>
                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
                    <div><p className="text-slate-500">Masuk</p><p className="font-semibold text-green-700">{rupiah(item.cashIn)}</p></div>
                    <div><p className="text-slate-500">Keluar</p><p className="font-semibold text-red-700">{rupiah(item.cashOut)}</p></div>
                    <div><p className="text-slate-500">Selisih</p><p className="font-semibold">{rupiah(item.cashDifference)}</p></div>
                    <div><p className="text-slate-500">Catatan in/out</p><p className="font-semibold">{item.recordedTransactions.toLocaleString("id-ID")}</p></div>
                  </div>
                </section>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <p><strong>Penting:</strong> {report.disclaimer}</p>
              <p className="mt-1">{totalTransfers.toLocaleString("id-ID")} transfer antar-dompet dikecualikan dari perhitungan.</p>
            </div>
            <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <h2 className="border-b border-slate-200 px-4 py-4 font-semibold text-slate-900">Rincian per hari dan outlet</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3">Outlet</th>
                      <th className="px-4 py-3">Arus</th>
                      <th className="px-4 py-3 text-right">Transaksi</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.daily.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Tidak ada transaksi yang dapat ditampilkan untuk periode ini.</td></tr>
                    )}
                    {report.daily.map((row, index) => (
                      <tr key={`${row.business}-${row.date}-${row.outlet}-${row.type}-${index}`} className="border-t border-slate-100">
                        <td className="whitespace-nowrap px-4 py-3">{dateLabel(row.date)}</td>
                        <td className="px-4 py-3">{row.business}</td>
                        <td className="px-4 py-3">{row.outlet}</td>
                        <td className="px-4 py-3">{row.type === "in" ? "Masuk" : "Keluar"}</td>
                        <td className="px-4 py-3 text-right">{row.count.toLocaleString("id-ID")}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{rupiah(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
