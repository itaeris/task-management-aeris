create table if not exists public.presences (
  user_id text primary key references public.users (id) on delete cascade,
  project_id text references public.projects (id) on delete set null,
  task_id text references public.tasks (id) on delete set null,
  path text not null default '/',
  updated_at timestamptz not null default now()
);

create index if not exists presences_updated_idx on public.presences (updated_at desc);

alter table public.presences enable row level security;
