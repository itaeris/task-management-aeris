# Task Management

A team collaboration workspace: product log, scrum, daily check, kanban, calendar, timeline, project sharing, attachments, and who is active now.

Stack: **Next.js 16** (App Router) + **Merlot API** (NestJS on **Fastify**) in an npm workspaces monorepo, **React 19**, **Tailwind CSS v4**, **Framer Motion**, **MySQL 8**, **Redis**.

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
| `DATABASE_URL` | MySQL 8 URL, e.g. `mysql://root:password@127.0.0.1:3306/task_management` |
| `APP_URL` | Public URL, production: `https://pipeline.aerisbeaute.com` |
| `GOOGLE_CLIENT_ID` | OAuth client ID (optional) |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret (optional) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (production login) |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret (server only, do not commit) |
| `AI_BASE_URL` | OpenAI-compatible API base, default `https://9router.aerisfti.web.id/v1` |
| `AI_API_KEY` | Server-only key for Analyze (do not commit) |
| `AI_MODEL` | Model id, default `free-forever` |
| `NEST_API_URL` | Merlot API origin. Local: `http://localhost:4000` |
| `NEST_INTERNAL_SECRET` | Shared secret with the API (same value as backend) |
| `ATTACHMENT_DIR` | Folder for uploaded files. Default `/DATA/AppData/pipeline/attachment` |

**Backend (`apps/api/.env`)**

| Variable | Description |
| --- | --- |
| `PORT` | Nest listen port, local default `4000` |
| `APP_URL` | Frontend origin for CORS |
| `NEST_INTERNAL_SECRET` | Shared secret with the frontend (same value) |
| `REDIS_URL` | Redis URL. Local: `redis://127.0.0.1:6379`. Server: `redis://pipeline_redis:6379` |

On `localhost` / `127.0.0.1`, login uses Cloudflare’s dummy Turnstile keys (`1x00000000000000000000AA`) so the widget always passes without adding the hostname in the dashboard. Production still uses the keys above.

Do not commit `.env` or `apps/api/.env`.

### 2. Database (MySQL 8)

Point `.env` at MySQL 8 on localhost:

```
DATABASE_URL=mysql://root:password@127.0.0.1:3306/task_management
```

Create an empty schema:

```bash
mysql -h 127.0.0.1 -u root -p task_management < mysql/schema.sql
```

Files are stored in `file_blobs` (LONGBLOB), not a storage bucket.

Merlot API cache uses Redis at `REDIS_URL` (local: `redis://127.0.0.1:6379`, no password).

### 3. Install and seed

```bash
npm install
npm run db:seed
npm run dev
```

`npm run dev` starts Next.js on [http://localhost:3000](http://localhost:3000) and Merlot API on [http://localhost:4000](http://localhost:4000). Use `npm run dev:web` or `npm run dev:api` to run one side.

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
3. Google Calendar tables are in `mysql/schema.sql` (`google_calendar_connections`, `google_calendar_events`).
4. Timed vs all-day tasks use the `all_day` column on `tasks`.

Tasks with a start or due date sync to the **primary** calendar of the connected Google account (Asia/Jakarta). Leave **All day** on for a date-only event; uncheck it to send a clock time. CalDAV clients that sync that Google calendar (Apple Calendar, Thunderbird, and similar) see the same all-day or timed event.

Personal projects copy every dated task; group and organization projects copy only tasks assigned to you. **Sync** forces a refresh; create/update/assign/delete also push while the connection is active.

## Production (`pipeline.aerisbeaute.com`)

GitHub Actions builds Docker images, pushes them to Docker Hub, then SSH-deploys with `docker run` (no Compose, no new MySQL container).

Images:

- `itaeris/pipeline_frontend_app` (host port **2028** → container 3000)
- `itaeris/pipeline_backend_app` (host port **2027** → container 4000)

NGINX on the server:

- `https://pipeline.aerisbeaute.com` → frontend `:2028`
- `host.docker.local` → backend `:2027`

Containers join Docker network `pipeline-network`. Deploy starts an internal Redis container `pipeline_redis` (no host port). Existing MySQL is attached to that network if present; it is never created by this deploy. Task attachments are stored on disk at `/DATA/AppData/pipeline/attachment` and bind-mounted into the frontend container.

### GitHub secrets

| Secret | Purpose |
| --- | --- |
| `DOCKERHUB_USERNAME` | Docker Hub user |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `BACKEND_ENV` | Full `apps/api` env file contents |
| `FRONTEND_ENV` | Full root `.env` contents (needed) |
| `SERVER_HOST` | SSH host |
| `SERVER_USER` | SSH user |
| `SERVER_SSH_KEY` | SSH private key |

Example **FRONTEND_ENV** (from inside the frontend container, MySQL on the host is `host.docker.local`):

```
DATABASE_URL=mysql://root:password@host.docker.local:3306/task_management
APP_URL=https://pipeline.aerisbeaute.com
NEST_API_URL=http://pipeline_backend_app:4000
NEST_INTERNAL_SECRET=same-as-backend
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AI_BASE_URL=
AI_API_KEY=
AI_MODEL=free-forever
ATTACHMENT_DIR=/DATA/AppData/pipeline/attachment
```

Example **BACKEND_ENV**:

```
PORT=4000
APP_URL=https://pipeline.aerisbeaute.com
NEST_INTERNAL_SECRET=same-as-frontend
DATABASE_URL=mysql://root:password@host.docker.local:3306/task_management
REDIS_URL=redis://pipeline_redis:6379
```

After the backend container is up, deploy runs `node /app/migrate.mjs`: create missing tables, add missing columns, skip what already exists.

The SSH user needs Docker plus passwordless `sudo` for NGINX (`cp` into `/etc/nginx/conf.d`, `nginx -t`, `systemctl reload nginx`). TLS certs are expected at `/etc/letsencrypt/live/pipeline.aerisbeaute.com/`.

Google Console: add production origin `https://pipeline.aerisbeaute.com` and redirect `https://pipeline.aerisbeaute.com/api/auth/google/callback`.

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
| `npm run dev` | Next.js + Merlot API together |
| `npm run dev:web` | Next.js only |
| `npm run dev:api` | Merlot API only (port 4000) |
| `npm run build` | Next.js production build (Vercel web) |
| `npm run build:api` | Merlot API production build (Vercel API) |
| `npm run start` | Run the Next.js production build |
| `npm run lint` | ESLint |
| `npm run db:seed` | Seed users + demo project |
| `npm run db:admin` | Create/update admin account `itaeris` |
| `npm run db:migrate` | Create missing MySQL tables/columns (skip existing) |

Regenerate PWA icons with `node scripts/generate-pwa-icons.mjs`.

## Quick flow

1. Sign in, then create a project (personal, group, or organization) or join with a code.
2. Pick a Flaticon icon when creating a project. Older projects that still use a color circle: click the icon (pencil) on the home card or sidebar — owner only.
3. Work in the project menu: Overview, Product log, Scrum log, Daily check, Kanban, Calendar, Timeline, Analyze, Share. On a task, set start/due with a time, or check **All day**. Connect Google Calendar if you want those dates on your phone calendar. Open **Analyze** for an AI health report of that project only, including a work table and plan timeline.
4. Group and organization projects are open to those people automatically. Share still works for extra invites. The owner can rotate the code and change the name/description/icon.
5. The header shows who is active in the app.

## Structure

```
apps/api/                # Merlot API (Fastify) + Redis cache
src/app/                 # Next.js routes, loading skeleton, API
src/components/          # UI (shell, boards, drawer, picker)
src/lib/actions/         # server actions
src/lib/                 # auth, queries, MySQL client, Nest cache client
mysql/                   # schema + idempotent migrate
deploy/                  # NGINX + server deploy script
.github/workflows/       # Docker Hub + SSH deploy
scripts/                 # seed, admin, migrate
```

Flaticon icons come from [UIcons](https://www.flaticon.com/uicons) (solid rounded + brands).
