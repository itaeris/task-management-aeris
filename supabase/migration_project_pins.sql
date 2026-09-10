create table if not exists public.project_pins (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public.users (id) on delete cascade,
  project_id text not null references public.projects (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, project_id)
);

create index if not exists project_pins_user_idx on public.project_pins (user_id);
create index if not exists project_pins_project_idx on public.project_pins (project_id);

alter table public.project_pins enable row level security;
