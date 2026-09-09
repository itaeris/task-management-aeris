# Task Management

Webapp kolaborasi task untuk tim: product log, scrum, daily check, kanban, calendar, timeline, share project, attachment, dan siapa yang sedang aktif.

Stack: **Next.js 16** (App Router), **React 19**, **Tailwind CSS v4**, **Framer Motion**, **Supabase**.

## Fitur

- Login dengan email/username + password, atau Google OAuth
- Buat project, join lewat kode share, ganti icon Flaticon (UIcons)
- Product log, Scrum log, Daily check, Kanban, Calendar, Timeline
- Komentar, attachment, dan aktivitas project
- Presence di header: siapa sedang buka halaman atau task
- Settings: ubah nama tampilan dan reset password
- Loading pakai skeleton, bukan spinner
- Bisa dipasang sebagai aplikasi (PWA) di HP dan desktop

## Setup

### 1. Environment

Salin `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Isi:

| Variable | Keterangan |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SUPABASE_SECRET_KEY` | Secret key (server only, jangan di-commit) |
| `APP_URL` | URL publik, production: `https://pipeline.aerisbeaute.com` |
| `GOOGLE_CLIENT_ID` | OAuth client ID (opsional) |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret (opsional) |

Jangan commit `.env`.

### 2. Database

Di Supabase SQL Editor:

1. Project baru: jalankan `supabase/schema.sql`
2. Kalau tabel `users` sudah ada: jalankan `supabase/migration_auth.sql`
3. Fitur “sedang aktif”: jalankan `supabase/migration_presence.sql`

Schema juga membuat bucket storage `attachments` (private).

### 3. Install dan seed

```bash
npm install
npm run db:seed
npm run dev
```

Hanya butuh akun admin, tanpa data demo:

```bash
npm run db:admin
```

Buka [http://localhost:3000/login](http://localhost:3000/login).

## Login demo

Setelah seed:

| | |
| --- | --- |
| Username | `itaeris` |
| Email | `it@aerisbeaute.com` |
| Password | `aerisbeaute` |

Project demo: **Relia Pay**. Kode share: `RELI-7K2M`.

## Google login

Di [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials:

Authorized JavaScript origins:

```
http://localhost:3000
https://pipeline.aerisbeaute.com
```

Authorized redirect URIs:

```
http://localhost:3000/api/auth/google/callback
https://pipeline.aerisbeaute.com/api/auth/google/callback
```

User Google dicocokkan/dibuat di `public.users` berdasarkan email.

## Production (`pipeline.aerisbeaute.com`)

1. Domain HTTPS (PWA dan cookie login butuh HTTPS).
2. Di server, set `APP_URL=https://pipeline.aerisbeaute.com` plus env Supabase/Google.
3. Google Console: tambah origin dan redirect URI production di atas.
4. Build: `npm run build && npm run start` (atau proses manager di belakang reverse proxy). Proxy harus meneruskan `Host` dan `X-Forwarded-Proto: https`.
5. PWA: service worker aktif otomatis di domain (bukan localhost). Chrome/Edge: menu ⋮ → Install app. iOS: Safari Share → Add to Home Screen.

## PWA

App bisa dipasang ke home screen / desktop (standalone).

- Manifest: `/manifest.webmanifest`
- Ikon: `public/icons/`
- Service worker (production): `public/sw.js` — halaman offline jika navigasi gagal
- Chrome/Edge: menu ⋮ → Install app
- iOS Safari: Share → Add to Home Screen
- Banner muncul saat koneksi terputus

Service worker tidak aktif di `next dev` supaya cache tidak mengganggu HMR. Tes install di `npm run build && npm run start`, atau pakai Chrome di `localhost`.

## Scripts

| Command | Fungsi |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Jalankan hasil build |
| `npm run lint` | ESLint |
| `npm run db:seed` | Seed user + project demo |
| `npm run db:admin` | Buat/update akun admin `itaeris` |

Ikon PWA bisa digenerate ulang: `node scripts/generate-pwa-icons.mjs`.

## Alur singkat

1. Login, lalu buat project atau join pakai kode.
2. Pilih icon Flaticon saat buat project. Project lama yang masih lingkaran warna: klik icon (ada pensil) di kartu beranda atau sidebar — owner only.
3. Kerja di menu project: Overview, Product log, Scrum log, Daily check, Kanban, Calendar, Timeline, Share.
4. Share mengundang anggota. Owner bisa rotasi kode dan ubah nama/deskripsi/icon.
5. Header menampilkan siapa yang sedang aktif di app.

## Struktur

```
src/app/                 # routes, loading skeleton, API
src/components/          # UI (shell, boards, drawer, picker)
src/lib/actions/         # server actions
src/lib/                 # auth, queries, supabase client
supabase/                # schema + migrations
scripts/                 # seed & admin
```

Icon Flaticon diambil dari [UIcons](https://www.flaticon.com/uicons) (solid rounded + brands).
