# Naze AI

Asisten AI pribadi yang mengenal konteks percakapanmu. Dibangun dengan
Next.js 14, Prisma, dan Gemini.

## Fitur

* Chat dengan jawaban yang mengalir real time
* Memori jangka panjang yang bisa dilihat, diubah, dan dihapus
* Pembuatan gambar dari deskripsi teks
* Mode panggilan suara (Naze Call) memakai Web Speech API
* Riwayat percakapan dengan pencarian, sematan, arsip, dan ganti nama
* Akun email dan password, data terikat ke akun
* PWA: bisa dipasang di layar utama dan tetap terbuka saat offline
* Tema gelap dan terang, dengan pilihan warna aksen di Pengaturan

## Model

Model teks: **gemini-3.6-flash** dari Gemini API. Tersedia di free tier
Google AI Studio, tanpa perlu billing. Buat API key di
aistudio.google.com/apikey lalu isi `GEMINI_API_KEY`.

Gambar: Pollinations (gratis). Suara: Web Speech API bawaan browser.

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local   # isi DATABASE_URL dan GEMINI_API_KEY
npm run db:push              # membuat tabel dari prisma/schema.prisma
npm run dev
```

`DATABASE_URL` butuh connection string Postgres. Tier gratis Neon,
Supabase, atau Vercel Postgres semuanya bisa dipakai.

### Catatan Supabase

Jika memakai Supabase, siapkan dua URL dari Project Settings, bagian
Database, Connection string:

```
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

Keduanya lewat pooler. Proyek Supabase baru hanya memberi alamat IPv6
untuk koneksi direct, sementara fungsi Vercel tidak bisa melakukan
koneksi keluar IPv6, jadi host `db.<project-ref>.supabase.co` akan gagal
dengan error `P1001: Can't reach database server`. Pakai Session pooler
(port 5432) untuk `DIRECT_URL`.

`DATABASE_URL` dipakai aplikasi saat runtime. `DIRECT_URL` hanya dipakai
oleh `prisma db push` dan `prisma migrate`.

`npm run db:push` cocok untuk pengembangan solo. Begitu lebih dari satu
orang menyentuh schema, pindah ke `prisma migrate dev`.

### Menjalankan dari Termux (Android)

Engine Prisma tidak mendukung Android, jadi `npm install` dan
`db:push` akan gagal di sana. Dorong kode ke GitHub dari Termux, set
`DATABASE_URL`, `DIRECT_URL`, dan `GEMINI_API_KEY` sebagai Environment
Variables di pengaturan proyek Vercel, lalu deploy. `npm run build`
sudah menjalankan `prisma db push` otomatis, jadi tabel terbuat saat
deploy pertama.

## Struktur

```
src/app           halaman dan API routes (Next.js App Router)
src/components    komponen UI
src/features      logika per fitur (chat, history, memory, settings, voice)
src/lib/ai        provider Gemini, persona, context builder
src/lib/database  akses Prisma (conversations, messages, memories, settings)
src/lib/memory    Memory Analyzer dan retrieval
src/lib/security  session, rate limit, validasi input
src/lib/voice     speech to text dan text to speech bawaan browser
prisma            schema database
```
