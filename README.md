# Task Management

A team collaboration workspace: product log, scrum, daily check, kanban, calendar, timeline, project sharing, attachments, and who is active now.

Stack: **Next.js 16** (App Router) + **NestJS** API in an npm workspaces monorepo, **React 19**, **Tailwind CSS v4**, **Framer Motion**, **Supabase**, **Upstash Redis**.

## Features

- Sign in with email/username + password (Cloudflare Turnstile) or Google OAuth
- Create a project as **Personal**, **Group**, or **Organization**; pin organization projects to the top of your own list; join with a share code; change the Flaticon icon (UIcons)
- Product log, Scrum log, Daily check, Kanban, Calendar, Timeline, **Analyze**
- AI Analyze is saved per project (not shared across projects)
- Task start/due with time of day, or **All day**; Google Calendar / CalDAV sync uses the same
- Comments, attachments, and project activity
- Presence in the header: who has a page or task open
- Settings: change display name and reset password
- Loading uses skeletons, not a spinner
- Installable as an app (PWA) on phone and desktop

## Setup

### 1. Environment

Frontend env lives at the repo root. Backend env lives in `apps/api`.

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

**Frontend (`.env`)**

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SUPABASE_SECRET_KEY` | Secret key (server only, do not commit) |
| `APP_URL` | Public URL, production: `https://pipeline.aerisbeaute.com` |
| `GOOGLE_CLIENT_ID` | OAuth client ID (optional) |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret (optional) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (production login) |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret (server only, do not commit) |
| `AI_BASE_URL` | OpenAI-compatible API base, default `https://9router.aerisfti.web.id/v1` |
| `AI_API_KEY` | Server-only key for Analyze (do not commit) |
| `AI_MODEL` | Model id, default `free-forever` |
| `NEST_API_URL` | NestJS API origin. Local: `http://localhost:4000` |
| `NEST_INTERNAL_SECRET` | Shared secret with the API (same value as backend) |

**Backend (`apps/api/.env`)**

| Variable | Description |
| --- | --- |
| `PORT` | Nest listen port, local default `4000` |
| `APP_URL` | Frontend origin for CORS |
| `NEST_INTERNAL_SECRET` | Shared secret with the frontend (same value) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token (do not commit) |

On `localhost` / `127.0.0.1`, login uses Cloudflare’s dummy Turnstile keys (`1x00000000000000000000AA`) so the widget always passes without adding the hostname in the dashboard. Production still uses the keys above.

Do not commit `.env` or `apps/api/.env`.

### 2. Database

In the Supabase SQL Editor:

1. New project: run `supabase/schema.sql`
2. If the `users` table already exists: run `supabase/migration_auth.sql`
3. Presence (“active now”): run `supabase/migration_presence.sql`
4. Project access (personal / group / organization): run `supabase/migration_project_access.sql`
5. Per-user organization pins: run `supabase/migration_project_pins.sql`
6. Task start/due times + all-day: run `supabase/migration_task_all_day.sql`
7. AI Analyze per project: run `supabase/migration_project_analyses.sql`

The schema also creates a private storage bucket named `attachments`.

### 3. Install and seed

```bash
npm install
npm run db:seed
npm run dev
```

`npm run dev` starts Next.js on [http://localhost:3000](http://localhost:3000) and NestJS on [http://localhost:4000](http://localhost:4000). Use `npm run dev:web` or `npm run dev:api` to run one side.

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
4. For timed vs all-day events: run `supabase/migration_task_all_day.sql` if the project is not a fresh `schema.sql` install.

Tasks with a start or due date sync to the **primary** calendar of the connected Google account (Asia/Jakarta). Leave **All day** on for a date-only event; uncheck it to send a clock time. CalDAV clients that sync that Google calendar (Apple Calendar, Thunderbird, and similar) see the same all-day or timed event.

Personal projects copy every dated task; group and organization projects copy only tasks assigned to you. **Sync** forces a refresh; create/update/assign/delete also push while the connection is active.

## Production (`pipeline.aerisbeaute.com`)

1. HTTPS domain (PWA and login cookies require HTTPS).
2. In **Vercel → Project → Settings → Environment Variables**, set (Production + Preview):

   **Next.js project** (root), copied from `.env`:

   | Name | Required |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | yes |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes |
   | `SUPABASE_SECRET_KEY` | yes |
   | `APP_URL` | `https://pipeline.aerisbeaute.com` |
   | `GOOGLE_CLIENT_ID` | yes, if you use Google login |
   | `GOOGLE_CLIENT_SECRET` | yes, if you use Google login |
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | yes, password login |
   | `TURNSTILE_SECRET_KEY` | yes, password login |
   | `AI_BASE_URL` | yes, if you use Analyze |
   | `AI_API_KEY` | yes, if you use Analyze |
   | `AI_MODEL` | optional, default `free-forever` |
   | `NEST_API_URL` | yes, NestJS deployment URL |
   | `NEST_INTERNAL_SECRET` | yes, same value as the API project |

   **NestJS project** (`apps/api`), copied from `apps/api/.env`:

   | Name | Required |
   | --- | --- |
   | `APP_URL` | `https://pipeline.aerisbeaute.com` |
   | `NEST_INTERNAL_SECRET` | yes, same value as the Next.js project |
   | `UPSTASH_REDIS_REST_URL` | yes |
   | `UPSTASH_REDIS_REST_TOKEN` | yes |

   This repo is a monorepo. Keep the existing Vercel project pointed at the **repository root** (Next.js). Add a **second** Vercel project for NestJS:

   1. Import the same Git repo.
   2. Set **Root Directory** to `apps/api`.
   3. Enable including files outside the root directory so npm workspaces resolve.
   4. Set the backend env vars on that project.
   5. Set `NEST_API_URL` on the Next.js project to the NestJS URL (for example `https://your-api.vercel.app`).

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
| `npm run dev` | Next.js + NestJS together |
| `npm run dev:web` | Next.js only |
| `npm run dev:api` | NestJS only (port 4000) |
| `npm run build` | Next.js production build (Vercel web) |
| `npm run build:api` | NestJS production build (Vercel API) |
| `npm run start` | Run the Next.js production build |
| `npm run lint` | ESLint |
| `npm run db:seed` | Seed users + demo project |
| `npm run db:admin` | Create/update admin account `itaeris` |

Regenerate PWA icons with `node scripts/generate-pwa-icons.mjs`.

## Quick flow

1. Sign in, then create a project (personal, group, or organization) or join with a code.
2. Pick a Flaticon icon when creating a project. Older projects that still use a color circle: click the icon (pencil) on the home card or sidebar — owner only.
3. Work in the project menu: Overview, Product log, Scrum log, Daily check, Kanban, Calendar, Timeline, Analyze, Share. On a task, set start/due with a time, or check **All day**. Connect Google Calendar if you want those dates on your phone calendar. Open **Analyze** for an AI health report of that project only, including a work table and plan timeline.
4. Group and organization projects are open to those people automatically. Share still works for extra invites. The owner can rotate the code and change the name/description/icon.
5. The header shows who is active in the app.

## Structure

```
apps/api/                # NestJS + Upstash Redis cache
src/app/                 # Next.js routes, loading skeleton, API
src/components/          # UI (shell, boards, drawer, picker)
src/lib/actions/         # server actions
src/lib/                 # auth, queries, supabase, Nest cache client
supabase/                # schema + migrations
scripts/                 # seed & admin
```

Flaticon icons come from [UIcons](https://www.flaticon.com/uicons) (solid rounded + brands).
