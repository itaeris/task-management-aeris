create table if not exists public.project_analyses (
  project_id text primary key references public.projects (id) on delete cascade,
  content text not null,
  model text not null,
  created_by text references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_analyses enable row level security;
