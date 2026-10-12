# Catatin → NF3 Command Center Finance: READ ONLY

## Keamanan dan pembatasan

Catatin merupakan sumber data utama dan tidak boleh diubah oleh integrasi ini.

- Semua perubahan kode hanya di repo nf3-command-center. Tidak ada perubahan database, schema, tabel, RLS, Storage, stok, maupun saldo Catatin.
- Endpoint GET-only untuk laporan. Database reader memulai transaksi PostgreSQL READ ONLY, dan query hanya SELECT agregat.
- Jangan memakai kredensial Catatin service_role, secret key, database postgres/superuser, atau akun yang memiliki BYPASSRLS.
- Gunakan kredensial database khusus yang secara database hanya diberikan izin SELECT minimal untuk tabel transaksi dua unit bisnis yang relevan. Jangan izinkan UPDATE, INSERT, DELETE, atau akses tabel yang tak perlu.
- Semua credential hanya ada di server Vercel, tidak ada NEXT_PUBLIC prefix dan tidak masuk GitHub.
- API menolak akses jika allowlist owner belum disiapkan. Owner harus user yang terverifikasi secara server-side; jangan memakai user_metadata untuk izin.

## Persiapan environment di server NF3 Command Center (belum diaktifkan)

NF3_FINANCE_OWNER_USER_IDS: daftar UUID Supabase Auth user owner, dipisahkan dengan koma.
NF3_FINANCE_OWNER_EMAILS: alternatif, daftar email owner yang terverifikasi, dipisahkan dengan koma.
CATATIN_READONLY_DATABASE_URL: connection string Postgres khusus user SELECT-only dengan koneksi TLS.

Wajib ada setidaknya salah satu owner allowlist serta URL database khusus baca. Supabase URL biasa bukan kredensial untuk membaca keuangan.

Catatin menggunakan RLS di app_transactions yang memeriksa is_business_member. Akun database baru mungkin tidak akan bisa SELECT sampai akses dan RLS untuk role pembaca dibuat secara terpisah dan aman. PR ini sengaja tidak mengubah RLS Catatin. Jangan disable RLS dan jangan memperluas hak akun staff.

Tanpa env yang sesuai, API menjawab HTTP 503 dan menampilkan pesan jelas, bukan Rp0. Jika owner tidak diizinkan, jawab 403.

## Halaman dan metrik

Halaman: /finance/catatin
Endpoint: GET /api/finance/catatin?days=7|30|90

Sumber: public.app_transactions, kolom data JSONB, bukan tabel relational transactions yang kosong.

Nusa Food business ID: e23ed572-234c-4995-acad-fa6bff7c58d2
NF Nusa Fishing business ID: e37505c1-f5b8-480f-810e-6c1e8c288933

Arus masuk = type in, arus keluar = type out. Type transfer dikecualikan dari arus masuk/keluar dan hanya dihitung jumlahnya. Tanggal dan angka yang tidak sesuai format tidak dihitung. Maksimal 90 hari, dengan agregasi per tanggal, unit, outlet dan arah arus.

Penting: SELISIH ARUS KAS BUKAN LABA BERSIH atau omzet POS. Beberapa catatan setor admin dan laporan harian mungkin mewakili kegiatan bisnis yang sama; perlukan rekonsiliasi sumber sebelum menyebut laba atau omzet.

Data mentah dan identitas staf tidak dikirim ke browser. Respons hanya agregat dan tidak boleh di-cache.

## Validasi sebelum aktivasi

1. Build Next.js + TypeScript pada branch PR harus lulus.
2. Test tanpa env: integrasi mati dengan aman, Catatin tetap tidak tersentuh.
3. Test owner terverifikasi: akses halaman. Non-owner harus 403, belum login 401 setelah allowlist terpasang.
4. Pastikan login database khusus baca punya SELECT minimal dan RLS sesuai. Jangan uji mutasi pada Catatin production.
5. Samakan agregat beberapa tanggal dengan laporan resmi Catatin, terutama transfer, setor admin dan transaksi purchasing.
6. Jangan merge ke production sebelum izin readonly dan owner telah diverifikasi.

Rollback: hapus atau jangan set CATATIN_READONLY_DATABASE_URL di NF3. Modul terhenti aman; Catatin tidak berubah.
