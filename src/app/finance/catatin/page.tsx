"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

type Business = {
  businessId: string;
  business: string;
  cashIn: number;
  cashOut: number;
  cashDifference: number;
  excludedTransfers: number;
  recordedTransactions: number;
  excludedAdjustmentsIn: number;
  excludedAdjustmentsOut: number;
  excludedAdjustmentCount: number;
};
type Category = {
  businessId: string;
  business: string;
  type: "in" | "out";
  name: string;
  accountingGroup: string;
  mapped: boolean;
  amount: number;
  count: number;
};
type Trend = { businessId: string; date: string; cashIn: number; cashOut: number };
type Report = {
  source: string;
  asOf: string;
  capturedAt: string;
  from: string;
  through: string;
  days: number;
  business: Business[];
  categories: Category[];
  trend: Trend[];
  disclaimer: string;
};

const money = (value: number) => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0,
}).format(value);
const integer = (value: number) => new Intl.NumberFormat("id-ID").format(value);
const dateLabel = (day: string) => {
  const parts = day.split("-");
  return parts.length === 3 ? parts[2] + "/" + parts[1] + "/" + parts[0] : day;
};
const percent = (part: number, total: number) => total > 0 ? Math.round(part / total * 100) : 0;

function aggregateCategories(items: Category[], type: "in" | "out") {
  const map = new Map<string, Category>();
  for (const row of items.filter((item) => item.type === type)) {
    const key = row.name.trim().toLocaleLowerCase("id-ID");
    const found = map.get(key);
    if (found) {
      found.amount += row.amount;
      found.count += row.count;
      found.mapped = found.mapped && row.mapped;
    } else {
      map.set(key, { ...row });
    }
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

export default function CatatinFinancePage() {
  const pathname = usePathname();
  const isLegacyRoute = pathname === "/finance/catatin";
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [businessId, setBusinessId] = useState("all");
  const [showAll, setShowAll] = useState(false);
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
        const response = await fetch("/api/finance/catatin?days=" + days, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Laporan Catatin belum tersedia.");
        if (!controller.signal.aborted) setReport(data as Report);
      } catch (error) {
        if (!controller.signal.aborted) {
          setMessage(error instanceof Error ? error.message : "Laporan belum dapat dibaca.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [days, refreshKey]);

  const matches = (id: string) => businessId === "all" || businessId === id;
  const selected = report?.business.filter((item) => matches(item.businessId)) ?? [];
  const selectedCategories = report?.categories.filter((item) => matches(item.businessId)) ?? [];
  const totalIn = selected.reduce((sum, item) => sum + item.cashIn, 0);
  const totalOut = selected.reduce((sum, item) => sum + item.cashOut, 0);
  const transfers = selected.reduce((sum, item) => sum + item.excludedTransfers, 0);
  const adjustedIn = selected.reduce((sum, item) => sum + item.excludedAdjustmentsIn, 0);
  const adjustedOut = selected.reduce((sum, item) => sum + item.excludedAdjustmentsOut, 0);
  const adjustedCount = selected.reduce((sum, item) => sum + item.excludedAdjustmentCount, 0);
  const expense = aggregateCategories(selectedCategories, "out");
  const income = aggregateCategories(selectedCategories, "in");
  const unclassified = expense.filter((item) => !item.mapped);
  const uncategorizedAmount = unclassified.reduce((sum, item) => sum + item.amount, 0);
  const uncategorizedCount = unclassified.reduce((sum, item) => sum + item.count, 0);
  const shownExpense = showAll ? expense : expense.slice(0, 8);
  const shownIncome = showAll ? income : income.slice(0, 6);

  const recentDays = [...new Set((report?.trend ?? []).map((item) => item.date))]
    .sort().slice(-7);
  const trend = recentDays.map((day) => {
    const rows = (report?.trend ?? []).filter((item) => item.date === day && matches(item.businessId));
    return {
      date: day,
      cashIn: rows.reduce((sum, item) => sum + item.cashIn, 0),
      cashOut: rows.reduce((sum, item) => sum + item.cashOut, 0),
    };
  });
  const maxTrend = Math.max(1, ...trend.flatMap((item) => [item.cashIn, item.cashOut]));

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pb-6 pt-20 sm:px-6 lg:ml-60 lg:pt-6 lg:px-10">
        {isLegacyRoute && (
          <Link href="/finance" className="text-sm font-medium text-blue-700 hover:underline">
            ← Kembali ke Finance
          </Link>
        )}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">FINANCE · SUMBER: CATATIN</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Ringkasan Keuangan</h1>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">Ringkasan pengeluaran dan pemasukan Nusa Food serta Nusa Fishing. Khusus owner · hanya baca.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-start">
            <span className="rounded border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600">READ ONLY</span>
            {report && (
              <button type="button" disabled={loading} onClick={() => setRefreshKey((v) => v + 1)}
                className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-50">Periksa data terbaru</button>
            )}
          </div>
        </div>

        {loading && (
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600" role="status">
            Memeriksa ketersediaan ringkasan Catatin…
          </div>
        )}

        {message && (
          <section className="mt-7 rounded-lg border border-slate-200 bg-white px-5 py-8 text-center sm:px-8" role="status">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl" aria-hidden="true">📂</div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              {message.includes("Snapshot kategori Catatin belum tersedia") ? "Ringkasan Catatin belum diaktifkan" : "Ringkasan belum tersedia"}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
              {message.includes("Snapshot kategori Catatin belum tersedia")
                ? "Halaman sudah siap. Snapshot kategori masih perlu dipasang secara aman di server NF3 sebelum angka dapat ditampilkan."
                : message}
            </p>
            <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-slate-500">
              Integrasi ini tidak mengubah transaksi, saldo, atau stok Catatin. Tidak ada angka nol yang dibuat-buat.
            </p>
            {isLegacyRoute && (
              <Link href="/finance" className="mt-5 inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800">
                Kembali ke Finance
              </Link>
            )}
          </section>
        )}

        {report && (
          <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="Periode ringkasan">
            {([7, 30, 90] as const).map((value) => (
              <button key={value} type="button" onClick={() => setDays(value)}
                className={days === value
                  ? "rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600"}>
                {value} hari
              </button>
            ))}
          </div>
        )}

        {report && (
          <>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => setBusinessId("all")}
                className={businessId === "all" ? "rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white" : "rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"}>
                Semua usaha
              </button>
              {report.business.map((item) => (
                <button key={item.businessId} type="button" onClick={() => setBusinessId(item.businessId)}
                  className={businessId === item.businessId ? "rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white" : "rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"}>
                  {item.business}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Snapshot sampai {dateLabel(report.asOf)} · Periode {dateLabel(report.from)}–{dateLabel(report.through)} · Bukan live
            </p>
            <div className="mt-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">Data terakhir: {dateLabel(report.asOf)}</span>
              <span className="ml-2 text-slate-500">Snapshot tidak berubah saat tombol muat ulang ditekan. Data baru membutuhkan pembaruan snapshot.</span>
            </div>
            <section aria-label="Ringkasan arus kas" className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Kas masuk (tanpa koreksi)</p>
                <p className="mt-2 text-xl font-bold text-emerald-700">{money(totalIn)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Kas keluar (tanpa koreksi)</p>
                <p className="mt-2 text-xl font-bold text-rose-700">{money(totalOut)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Selisih kas tanpa koreksi</p>
                <p className="mt-2 text-xl font-bold text-slate-900">{money(totalIn - totalOut)}</p>
                <p className="mt-1 text-xs text-slate-400">Bukan laba bersih</p>
              </div>
            </section>

            {(adjustedCount > 0 || transfers > 0) && (
              <div className="mt-4 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Pindah dompet dan koreksi saldo tidak dihitung</p>
                <p className="mt-1">{integer(transfers)} transfer internal dikecualikan.
                  {adjustedCount > 0 ? ` ${integer(adjustedCount)} koreksi saldo (${money(adjustedOut)} keluar; ${money(adjustedIn)} masuk) juga dikeluarkan dari angka utama.` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500">Angka ini tetap tercatat di Catatin untuk audit. Selisih kas bukan laba bersih.</p>
              </div>
            )}
            {uncategorizedCount > 0 && (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-semibold">Perlu ditinjau: kategori belum lengkap</p>
                <p className="mt-1">
                  {integer(uncategorizedCount)} catatan pengeluaran senilai {money(uncategorizedAmount)} belum dapat dipetakan ke nama kategori.
                  Nilainya tetap termasuk kas keluar dan ditampilkan terpisah—tidak disembunyikan sebagai biaya lain.
                </p>
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
              <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-base font-semibold text-slate-900">Pengeluaran per kategori</h2>
                  <p className="text-xs text-slate-500">Proporsi dari kas keluar</p>
                </div>
                <div className="mt-4 space-y-4">
                  {shownExpense.length === 0 && <p className="text-sm text-slate-500">Belum ada catatan pengeluaran.</p>}
                  {shownExpense.map((item) => (
                    <div key={item.name.toLowerCase()}>
                      <div className="flex items-start justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800">{item.name}</p>
                          <p className="text-xs text-slate-400">{integer(item.count)} catatan</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold text-slate-900">{money(item.amount)}</p>
                          <p className="text-xs text-slate-500">{percent(item.amount, totalOut)}%</p>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded bg-slate-100">
                        <div className="h-full rounded bg-slate-700" style={{ width: percent(item.amount, totalOut) + "%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-base font-semibold text-slate-900">Sumber kas masuk</h2>
                  <p className="text-xs text-slate-500">Per kategori Catatin</p>
                </div>
                <div className="mt-4 space-y-4">
                  {shownIncome.length === 0 && <p className="text-sm text-slate-500">Belum ada catatan kas masuk.</p>}
                  {shownIncome.map((item) => (
                    <div key={item.name.toLowerCase()}>
                      <div className="flex items-start justify-between gap-3 text-sm">
                        <p className="min-w-0 font-medium text-slate-800">{item.name}</p>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold text-slate-900">{money(item.amount)}</p>
                          <p className="text-xs text-slate-500">{percent(item.amount, totalIn)}%</p>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded bg-slate-100">
                        <div className="h-full rounded bg-emerald-600" style={{ width: percent(item.amount, totalIn) + "%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            {(expense.length > 8 || income.length > 6) && (
              <button type="button" onClick={() => setShowAll((value) => !value)}
                className="mt-3 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                {showAll ? "Tampilkan yang utama" : "Lihat semua kategori"}
              </button>
            )}

            {businessId === "all" && (
              <section className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2" aria-label="Perbandingan unit usaha">
                {report.business.map((item) => (
                  <div key={item.businessId} className="rounded-lg border border-slate-200 bg-white p-4">
                    <h2 className="text-sm font-semibold text-slate-900">{item.business}</h2>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div><p className="text-slate-500">Masuk</p><p className="mt-1 font-semibold text-emerald-700">{money(item.cashIn)}</p></div>
                      <div><p className="text-slate-500">Keluar</p><p className="mt-1 font-semibold text-rose-700">{money(item.cashOut)}</p></div>
                      <div><p className="text-slate-500">Selisih</p><p className="mt-1 font-semibold text-slate-900">{money(item.cashDifference)}</p></div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold text-slate-900">Tren arus kas terbaru</h2>
                <p className="text-xs text-slate-500">Maksimum 7 hari tercatat</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
                <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-600" /> Masuk</span>
                <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" /> Keluar</span>
              </div>
              <div className="mt-4 space-y-3">
                {trend.length === 0 && <p className="text-sm text-slate-500">Belum ada tren pada periode ini.</p>}
                {trend.map((item) => (
                  <div key={item.date} className="grid grid-cols-[80px_minmax(0,1fr)] items-center gap-3">
                    <p className="text-xs text-slate-500">{dateLabel(item.date).slice(0,5)}</p>
                    <div className="space-y-1.5">
                      <div className="h-2 rounded bg-slate-100">
                        <div className="h-2 rounded bg-emerald-600" title={money(item.cashIn)} style={{ width: percent(item.cashIn, maxTrend) + "%" }} />
                      </div>
                      <div className="h-2 rounded bg-slate-100">
                        <div className="h-2 rounded bg-rose-500" title={money(item.cashOut)} style={{ width: percent(item.cashOut, maxTrend) + "%" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600">
              <p><strong>Catatan owner:</strong> {report.disclaimer}</p>
              <p className="mt-2">{integer(transfers)} transaksi transfer antar-dompet tidak dihitung sebagai pemasukan atau pengeluaran usaha.</p>
              <p className="mt-2">{integer(adjustedCount)} penyesuaian saldo dikeluarkan dari angka utama: {money(adjustedOut)} koreksi pengeluaran dan {money(adjustedIn)} koreksi pemasukan. Ini bukan transaksi usaha dan tidak dihapus dari Catatin.</p>
              <p className="mt-2">Kategori mengikuti catatan Catatin. Kelompok seperti aset atau keperluan pribadi tidak otomatis dianggap biaya laba-rugi. Laporan ini bukan pengganti rekonsiliasi POS atau laporan laba rugi.</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
