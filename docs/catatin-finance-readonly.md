# Catatin → NF3 Command Center Finance: READ ONLY

## Keamanan dan pembatasan

Catatin merupakan sumber data utama dan tidak boleh diubah oleh integrasi ini.

- Perubahan kode hanya di repo nf3-command-center. Pada database Catatin dibuat **schema baru nf3_finance_reporting**, view agregat **daily_cashflow_v1** serta **category_cashflow_v1**, serta role **nf3_catatin_cashflow_ro** yang masih NOLOGIN. **Tabel, policy RLS, transaksi, saldo, stok, dan Storage Catatin yang sebelumnya ada tidak diubah**.
- Endpoint GET-only untuk laporan. Database reader memulai transaksi PostgreSQL READ ONLY, dan query hanya SELECT agregat.
- Jangan memakai kredensial Catatin service_role, secret key, database postgres/superuser, atau akun yang memiliki BYPASSRLS.
- Akun khusus **nf3_catatin_cashflow_ro** hanya memperoleh USAGE pada schema laporan dan SELECT pada dua view agregat; tidak mendapat hak langsung ke public.app_transactions. Role belum bisa login. Jangan izinkan UPDATE, INSERT, DELETE, atau akses data mentah.
- Semua credential hanya ada di server Vercel, tidak ada NEXT_PUBLIC prefix dan tidak masuk GitHub.
- API menolak akses jika allowlist owner belum disiapkan. Owner harus user yang terverifikasi secara server-side; jangan memakai user_metadata untuk izin.

## Persiapan environment di server NF3 Command Center (belum diaktifkan)

NF3_FINANCE_OWNER_USER_IDS: daftar UUID Supabase Auth user owner, dipisahkan dengan koma.
NF3_FINANCE_OWNER_EMAILS: alternatif, daftar email owner yang terverifikasi, dipisahkan dengan koma.
CATATIN_READONLY_DATABASE_URL: connection string Postgres khusus user SELECT-only dengan koneksi TLS.
NF3_FINANCE_CATATIN_ENABLE_READONLY: harus berisi "1" untuk mengaktifkan koneksi; secara default TIDAK AKTIF.

Wajib ada setidaknya salah satu owner allowlist serta URL database khusus baca. Supabase URL biasa bukan kredensial untuk membaca keuangan.

Catatin memiliki policy RLS yang berpotensi terlalu luas jika role diberi SELECT langsung pada tabel. Karena itu endpoint hanya membaca private view nf3_finance_reporting.daily_cashflow_v1 yang berisi hasil agregasi dua bisnis; **tidak ada SELECT ke public.app_transactions oleh role pembaca**. View dijalankan sebagai pemilik postgres, tetapi hanya menghasilkan 6 kolom agregat yang ditentukan dalam definisinya. Tidak ada perubahan pada policy RLS existing. Pemeriksaan privilege menunjukkan role tidak bisa membaca atau mengubah tabel transaksi asli. Role NOLOGIN sampai konfigurasi server dan autentikasi dapat dilakukan secara aman.

**Keamanan tambahan**: sejumlah fungsi lama public.SECURITY DEFINER diwariskan lewat hak EXECUTE PUBLIC. Karena itu akun baru masih NOLOGIN, konfigurasi database tidak dipasang, dan switch enable tetap OFF. Jangan aktifkan login role sebelum risiko ini diaudit/diatasi dengan cara yang tidak merusak alur Catatin. Tanpa env/flag yang sesuai, API menjawab HTTP 503 dan menampilkan pesan jelas, bukan Rp0. Jika owner tidak diizinkan, jawab 403.

## Halaman dan metrik

Halaman: /finance/catatin
Endpoint: GET /api/finance/catatin?days=7|30|90

Sumber di balik view: public.app_transactions (data JSONB), bukan tabel transactions yang kosong. **API baru hanya melakukan SELECT dari nf3_finance_reporting.category_cashflow_v1**; view dibatasi pada dua business_id dan menampilkan agregat per hari, outlet, tipe arus, dan jumlah.

Nusa Food business ID: e23ed572-234c-4995-acad-fa6bff7c58d2
NF Nusa Fishing business ID: e37505c1-f5b8-480f-810e-6c1e8c288933

Arus masuk = type in, arus keluar = type out. Type transfer dikecualikan dari arus masuk/keluar dan hanya dihitung jumlahnya. Tanggal dan angka yang tidak sesuai format tidak dihitung. Maksimal 90 hari, dengan agregasi per tanggal, unit, outlet dan arah arus.

Penting: SELISIH ARUS KAS BUKAN LABA BERSIH atau omzet POS. Beberapa catatan setor admin dan laporan harian mungkin mewakili kegiatan bisnis yang sama; perlukan rekonsiliasi sumber sebelum menyebut laba atau omzet.

Data mentah dan identitas staf tidak dikirim ke browser. Respons hanya agregat dan tidak boleh di-cache.

## Validasi sebelum aktivasi

1. Build Next.js + TypeScript pada branch PR harus lulus.
2. Test tanpa env: integrasi mati dengan aman, Catatin tetap tidak tersentuh.
3. Test owner terverifikasi: akses halaman. Non-owner harus 403, belum login 401 setelah allowlist terpasang.
4. Aktifkan login role khusus hanya setelah Vercel secret dapat disimpan secara aman. Pastikan login berhasil membaca view agregat, dan privilege role tetap tanpa SELECT/INSERT/UPDATE/DELETE pada tabel transaksi asli. Jangan uji mutasi pada Catatin production.
5. Samakan agregat beberapa tanggal dengan laporan resmi Catatin, terutama transfer, setor admin dan transaksi purchasing.
6. Jangan merge ke production sebelum izin readonly dan owner telah diverifikasi.

Rollback aplikasi: hapus atau jangan set CATATIN_READONLY_DATABASE_URL di NF3. Modul terhenti aman. Untuk rollback schema tambahan (setelah memastikan tidak ada sesi pelaporan aktif), admin dapat DROP SCHEMA nf3_finance_reporting CASCADE dan DROP ROLE nf3_catatin_cashflow_ro. Jangan jalankan rollback tersebut kecuali memang diperlukan; tidak ada tabel transaksi existing yang termasuk dalam schema tambahan.

## Ringkasan kategori untuk owner

Halaman Finance Catatin menampilkan tiga KPI arus kas, rangking pengeluaran per nama kategori, kategori sumber penerimaan, perbandingan dua bisnis, dan tren kas 7 hari. Owner dapat memilih 7/30/90 hari dan satu unit usaha. Daftar transaksi mentah tidak dikirim ke browser. Category master dibaca dari public.categories serta app_state.categories tanpa perubahan atau pembaruan balik. Kategori tidak ditemukan tetap berada dalam 'Kategori belum dipetakan' atau 'Belum diberi kategori' dan diberi peringatan kualitas data.

View category_cashflow_v1 baru ditambahkan melalui migration yang hanya membuat view dan memberikan SELECT ke role NOLOGIN. Query verifikasi tanggal 1 September–12 Oktober 2026: 0 mismatch antara category_cashflow_v1 dan daily_cashflow_v1 untuk jumlah transaksi dan nominal arus masuk/keluar/transfer. Tidak boleh dianggap omzet POS atau laba bersih; beberapa sumber setor kas dapat memerlukan rekonsiliasi.
