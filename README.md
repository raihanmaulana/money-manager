# Arus — Money Manager

Aplikasi web pengelola keuangan pribadi: pengeluaran harian, anggaran, tagihan dan kartu kredit, sumber dana (bank, e-wallet, tunai), tabungan, laporan, dan ekspor CSV. Semua data tersimpan **per bulan** dan **per akun**.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Supabase (Auth, PostgreSQL, Row Level Security) · Vercel · PWA.

## Fitur
- **Ringkasan**: sisa jatah, batas aman per hari, peringatan (tagihan telat/jatuh tempo, saldo minus), pengeluaran per kategori.
- **Catatan**: pengeluaran per hari dengan filter (tanggal, kategori, sumber dana, nominal), pengeluaran berulang, ekspor CSV.
- **Tagihan**: rutin, cicilan, hutang, kartu kredit (pembayaran minimum + progres), bayar sebagian dari sumber dana.
- **Anggaran**, **Tabungan**, **Sumber dana** (pindah dana, biaya admin, samakan saldo), **Investasi** (simulasi), **Laporan** (cetak/PDF).
- Palet perintah `Ctrl/⌘ + K`, sinkron satu arah ke Google Sheet (opsional), bisa dipasang sebagai aplikasi.

## Database
Proyek ini memakai **database Supabase yang sama** dengan aplikasi sebelumnya, sehingga data yang sudah ada langsung terbaca. Tidak ada perubahan skema. Untuk instalasi baru jalankan `supabase/schema.sql`, lalu `tambah-sumber-dana.sql`, `tambah-kartu-kredit.sql`, dan `tambah-pembayaran-berulang.sql` di Supabase → SQL Editor.

## Menjalankan
```
cp .env.example .env.local   # isi key Supabase
npm install
npm run dev
npm test                     # uji logika perhitungan dan sinkron Sheet
```
Lihat tampilan tanpa database: `DEMO_MODE=1 npm run dev` (data contoh, tidak tersimpan).

## Deploy (Vercel)
1. Import repo ini di Vercel (framework terdeteksi Next.js).
2. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` (sama dengan aplikasi lama). Jangan isi `DEMO_MODE`.
3. Supabase → **Authentication → URL Configuration**: tambahkan domain baru ke *Redirect URLs* (`https://DOMAIN/auth/callback`). *Site URL* boleh tetap salah satu domain.

## Google Sheet untuk audit (opsional)
Salin `google-apps-script/Code.gs` ke Apps Script, deploy sebagai Web app, lalu isi `SHEETS_WEBHOOK_URL`, `SHEETS_WEBHOOK_SECRET`, dan opsional `NEXT_PUBLIC_SHEET_URL` di Vercel. Sinkron bersifat satu arah dan best-effort.

## Desain
Tema *Cobalt* (modern-minimal): token di `app/tokens.css`, huruf Space Grotesk, Geist, dan JetBrains Mono.

## Pengingat Telegram (opsional)

Tiap pagi 08.00 WIB (Vercel Cron, `vercel.json`) bot mengirim kebutuhan yang waktunya dibeli tapi belum dibeli.

1. Telegram → cari **@BotFather** → `/newbot` → salin **token**.
2. Jalankan `supabase/tambah-telegram.sql` di Supabase SQL Editor.
3. Vercel → Settings → Environment Variables: `TELEGRAM_BOT_TOKEN`, `CRON_SECRET` (string acak panjang), `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API → *service_role*, rahasia, jangan diawali `NEXT_PUBLIC_`). Redeploy.
- Opsional, catat pengeluaran lewat chat: setelah Chat ID terhubung, buka Pengaturan → Pengingat Telegram → *Aktifkan pencatatan lewat chat*. Rahasia webhook diturunkan otomatis dari token bot, tanpa variabel tambahan. Tulis misalnya `Makan siang 20 ribu` atau `Kopi 25k gopay kemarin`.
4. Buka bot kamu di Telegram, tekan **Start**. Ambil Chat ID dari **@userinfobot**.
5. Arus → Pengaturan → Pengingat Telegram → isi Chat ID → *Hubungkan dan kirim tes*.

## Kantor Arus (opsional)

Kantor 3D virtual (repo **kantor-ai**) yang karyawannya bereaksi pada data Arus. Isi `NEXT_PUBLIC_KANTOR_URL` dengan alamat web kantor di Vercel, lalu Redeploy.

- Ringkasan akan menampilkan kartu kecil berisi status kantor (Aman, Waspada, atau Kritis) dan satu baris aktivitas karyawan.
- Kartu ini hanya berisi teks. Kantor 3D baru dimuat setelah kartunya diketuk, jadi Arus di HP dan PWA tetap ringan.
- Kartu bisa disembunyikan di **Pengaturan → Kantor Arus**. Pilihan ini tersimpan per perangkat.
