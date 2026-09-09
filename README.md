# Task Management

A team collaboration workspace: product log, scrum, daily check, kanban, calendar, timeline, project sharing, attachments, and who is active now.

Stack: **Next.js 16** (App Router), **React 19**, **Tailwind CSS v4**, **Framer Motion**, **Supabase**.

## Features

- Sign in with email/username + password, or Google OAuth
- Create a project as **Personal**, **Group**, or **Organization**; join with a share code; change the Flaticon icon (UIcons)
- Product log, Scrum log, Daily check, Kanban, Calendar, Timeline
- Comments, attachments, and project activity
- Presence in the header: who has a page or task open
- Settings: change display name and reset password
- Loading uses skeletons, not a spinner
- Installable as an app (PWA) on phone and desktop

## Setup

### 1. Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SUPABASE_SECRET_KEY` | Secret key (server only, do not commit) |
| `APP_URL` | Public URL, production: `https://pipeline.aerisbeaute.com` |
| `GOOGLE_CLIENT_ID` | OAuth client ID (optional) |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret (optional) |

Do not commit `.env`.

### 2. Database

In the Supabase SQL Editor:

1. New project: run `supabase/schema.sql`
2. If the `users` table already exists: run `supabase/migration_auth.sql`
3. Presence (“active now”): run `supabase/migration_presence.sql`
4. Project access (personal / group / organization): run `supabase/migration_project_access.sql`

The schema also creates a private storage bucket named `attachments`.

### 3. Install and seed

```bash
npm install
npm run db:seed
npm run dev
```

Admin account only, no demo data:

```bash
npm run db:admin
```

Open [http://localhost:3000/login](http://localhost:3000/login).

## Demo login

After seed:

| | |
| --- | --- |
| Username | `itaeris` |
| Email | `it@aerisbeaute.com` |
| Password | `aerisbeaute` |

Demo project: **Relia Pay**. Share code: `RELI-7K2M`.

## Google login

In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials:

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

Google users are matched or created in `public.users` by email.

## Google Calendar

On Calendar, **Connect Google Calendar** uses the same OAuth client (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`). The redirect URI is the same as login:

```
http://localhost:3000/api/auth/google/callback
https://pipeline.aerisbeaute.com/api/auth/google/callback
```

In Google Cloud Console:

1. Enable **Google Calendar API** (CalDAV is covered by the Calendar scope).
2. OAuth consent screen: add scope `https://www.googleapis.com/auth/calendar`.
3. Run `supabase/migration_google_calendar.sql` in the SQL Editor.

Tasks with a due date sync to the **primary** calendar of the connected Google account. **Sync** forces a refresh; create/update/delete also push while the connection is active.

## Production (`pipeline.aerisbeaute.com`)

1. HTTPS domain (PWA and login cookies require HTTPS).
2. In **Vercel → Project → Settings → Environment Variables**, set (Production + Preview), copied from local `.env`:

   | Name | Required |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | yes |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes |
   | `SUPABASE_SECRET_KEY` | yes |
   | `APP_URL` | `https://pipeline.aerisbeaute.com` |
   | `GOOGLE_CLIENT_ID` | yes, if you use Google login |
   | `GOOGLE_CLIENT_SECRET` | yes, if you use Google login |

   Then **Redeploy**.
3. Google Console: add the production origin and redirect URI above.
4. PWA: the service worker activates automatically on the domain. Chrome/Edge: menu ⋮ → Install app. iOS: Safari Share → Add to Home Screen.

## PWA

The app can be installed to the home screen / desktop (standalone).

- Manifest: `/manifest.webmanifest`
- Icons: `public/icons/`
- Service worker (production): `public/sw.js` — offline page if navigation fails
- Chrome/Edge: menu ⋮ → Install app
- iOS Safari: Share → Add to Home Screen
- A banner appears when the connection drops

The service worker is not active in `next dev` so cache does not interfere with HMR. Test install with `npm run build && npm run start`, or use Chrome on `localhost`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run db:seed` | Seed users + demo project |
| `npm run db:admin` | Create/update admin account `itaeris` |

Regenerate PWA icons with `node scripts/generate-pwa-icons.mjs`.

## Quick flow

1. Sign in, then create a project (personal, group, or organization) or join with a code.
2. Pick a Flaticon icon when creating a project. Older projects that still use a color circle: click the icon (pencil) on the home card or sidebar — owner only.
3. Work in the project menu: Overview, Product log, Scrum log, Daily check, Kanban, Calendar, Timeline, Share.
4. Group and organization projects are open to those people automatically. Share still works for extra invites. The owner can rotate the code and change the name/description/icon.
5. The header shows who is active in the app.

## Structure

```
src/app/                 # routes, loading skeleton, API
src/components/          # UI (shell, boards, drawer, picker)
src/lib/actions/         # server actions
src/lib/                 # auth, queries, supabase client
supabase/                # schema + migrations
scripts/                 # seed & admin
```

Flaticon icons come from [UIcons](https://www.flaticon.com/uicons) (solid rounded + brands).
