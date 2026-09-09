create table if not exists public.google_calendar_connections (
  user_id text primary key references public.users (id) on delete cascade,
  google_email text not null,
  calendar_id text not null default 'primary',
  access_token text not null,
  refresh_token text not null,
  token_expiry timestamptz not null,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz
);

create table if not exists public.google_calendar_events (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public.users (id) on delete cascade,
  task_id text not null references public.tasks (id) on delete cascade,
  event_id text not null,
  calendar_id text not null default 'primary',
  unique (user_id, task_id)
);

create index if not exists google_calendar_events_task_idx
  on public.google_calendar_events (task_id);

alter table public.google_calendar_connections enable row level security;
alter table public.google_calendar_events enable row level security;
