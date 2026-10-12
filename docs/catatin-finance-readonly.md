# Finance Catatin untuk Owner — Snapshot Read-Only

## Status dan tujuan

NF3 Command Center membaca hanya RINGKASAN per kategori dari Catatin. **Tidak ada koneksi database Catatin di runtime NF3.** Tidak ada API key Catatin, service_role, password Postgres, SQL, ataupun tabel transaksi mentah yang diakses oleh website NF3.

- Halaman owner: `/finance/catatin`, dibuka lewat CTA pada menu Finance.
- Endpoint: `GET /api/finance/catatin?days=7|30|90`. Tidak ada POST, PUT, PATCH, DELETE.
- Otorisasi: Supabase Auth NF3 yang diverifikasi di server, lalu allowlist `NF3_FINANCE_OWNER_EMAILS` atau `NF3_FINANCE_OWNER_USER_IDS`. Akses ditolak bila tidak terkonfigurasi.
- Sumber runtime: hanya `CATATIN_FINANCE_SNAPSHOT_JSON` sebagai Vercel Environment Variable *encrypted* **server-only**, tanpa `NEXT_PUBLIC_`.
- Jika snapshot belum ada / tidak valid: respons 503 dan pesan yang jelas. Jangan menampilkan angka `Rp 0` sebagai gantinya.
- `Cache-Control: private, no-store` pada respons. UI hanya menerima agregat per kategori dan tren; tidak ada nama staf, nama pemasok, atau transaksi mentah.
- Tanggal `asOf` wajib ditampilkan, dengan label **bukan real-time**. Tombol muat ulang UI tidak membuat snapshot baru.

## Yang dihitung

- Kas masuk dan kas keluar (bukan omzet POS).
- Selisih arus kas (bukan laba bersih).
- Peringkat kategori pengeluaran dan penerimaan.
- Perbandingan Nusa Food dan NF Nusa Fishing.
- Tren harian tujuh hari terakhir tercatat.
- Jumlah transaksi transfer internal **tidak** dimasukkan ke total kas masuk/keluar.
- Kategori yang tidak memiliki kecocokan master ditampilkan terpisah sebagai kategori belum dipetakan; tidak ditebak sebagai biaya lain.
- Kategori `Pembelian Aset`, `Keperluan Owner`, `Modal` dan pencatatan internal bukan secara otomatis laba rugi operasional.

## Snapshot privat

Environment: `CATATIN_FINANCE_SNAPSHOT_JSON`

Format JSON:

```json
{
  "version": 1,
  "asOf": "2026-10-12",
  "capturedAt": "2026-10-13",
  "source": "Catatin (snapshot)",
  "reports": {
    "7": { "from": "YYYY-MM-DD", "through": "2026-10-12", "days": 7, "business": [], "categories": [], "trend": [] },
    "30": { "from": "YYYY-MM-DD", "through": "2026-10-12", "days": 30, "business": [], "categories": [], "trend": [] },
    "90": { "from": "YYYY-MM-DD", "through": "2026-10-12", "days": 90, "business": [], "categories": [], "trend": [] }
  }
}
```

Nilai contoh di atas **hanya struktur**, bukan data aktual. Semua angka harus diambil melalui SELECT dari laporan privat `nf3_finance_reporting.category_cashflow_v1`, diagregasi untuk 7/30/90 hari hingga tanggal snapshot, dan direkonsiliasi dengan `daily_cashflow_v1` sebelum dipasang. Saat memperbarui snapshot cukup mengganti environment variable (tidak ada tindakan yang menulis ke Catatin). Setelah perubahan environment pada Vercel, jalankan redeploy NF3 agar versi baru membaca data terbaru.

Akses Vercel ke snapshot hanya untuk operator berwenang. Jangan commit JSON finansial ke GitHub, jangan memakai `NEXT_PUBLIC_`, dan jangan mengirim file transaksi mentah ke aplikasi.

## Catatin yang berubah sebelumnya

Pada Catatin sudah pernah dibuat schema privat `nf3_finance_reporting`, view `daily_cashflow_v1` dan `category_cashflow_v1`, serta role `nf3_catatin_cashflow_ro` yang tetap **NOLOGIN**. Keduanya hanya digunakan untuk membaca agregasi dan audit. Tidak ada perubahan terhadap data transaksi, stok, saldo, tabel lama, atau kebijakan RLS Catatin. Jangan mengaktifkan password atau memberikan login ke role itu, karena snapshot tidak membutuhkannya.

## Production checklist

1. Build dan pemeriksaan read-only lulus.
2. Pemeriksaan pada iPhone dan desktop terhadap menu, filter bisnis, KPI, kategori, tren, dan pesan error saat snapshot belum dipasang.
3. Snapshot dipasang sebagai Vercel **encrypted** env dengan otorisasi owner server-side; environment production diverifikasi.
4. Pastikan snapshot 7/30/90 hari mencocokkan total view Catatin. Tidak ada perpindahan transaksi asli.
5. Uji user non-owner mendapatkan 403; login tidak ada mendapatkan 401, setelah allowlist tersedia.
6. Pastikan angka diberi keterangan **snapshot** dan tanggal data; jangan klaim sinkronisasi live.

## Rollback

Cabut `CATATIN_FINANCE_SNAPSHOT_JSON` dari Vercel NF3 atau rollback deployment Command Center. Catatin sendiri tidak terpengaruh.
