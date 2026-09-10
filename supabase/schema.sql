create extension if not exists pgcrypto;

drop table if exists public.activities cascade;
drop table if exists public.daily_logs cascade;
drop table if exists public.attachments cascade;
drop table if exists public.comments cascade;
drop table if exists public.tasks cascade;
drop table if exists public.sprints cascade;
drop table if exists public.project_members cascade;
drop table if exists public.project_pins cascade;
drop table if exists public.projects cascade;
drop table if exists public.group_members cascade;
drop table if exists public.groups cascade;
drop table if exists public.users cascade;

create table public.users (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  username text unique,
  email text not null unique,
  password_hash text,
  role text not null default 'member',
  initials text not null,
  color text not null,
  created_at timestamptz not null default now()
);

create table public.groups (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  created_by text not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.group_members (
  id text primary key default gen_random_uuid()::text,
  group_id text not null references public.groups (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  unique (group_id, user_id)
);

create table public.projects (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  description text not null default '',
  color text not null,
  share_code text not null unique,
  owner_id text not null references public.users (id) on delete restrict,
  access text not null default 'personal' check (access in ('personal', 'group', 'organization')),
  group_id text references public.groups (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (access = 'group' and group_id is not null)
    or (access <> 'group' and group_id is null)
  )
);

create table public.project_members (
  id text primary key default gen_random_uuid()::text,
  project_id text not null references public.projects (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  role text not null default 'member',
  source text not null default 'invite' check (source in ('owner', 'invite', 'access')),
  joined_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table public.project_pins (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public.users (id) on delete cascade,
  project_id text not null references public.projects (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, project_id)
);

create table public.sprints (
  id text primary key default gen_random_uuid()::text,
  project_id text not null references public.projects (id) on delete cascade,
  name text not null,
  goal text not null default '',
  start_date timestamptz not null,
  end_date timestamptz not null,
  status text not null default 'planning'
);

create table public.tasks (
  id text primary key default gen_random_uuid()::text,
  project_id text not null references public.projects (id) on delete cascade,
  sprint_id text references public.sprints (id) on delete set null,
  title text not null,
  description text not null default '',
  status text not null default 'backlog',
  priority text not null default 'medium',
  type text not null default 'story',
  points int,
  rank double precision not null default 0,
  start_date timestamptz,
  due_date timestamptz,
  assignee_id text references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_assignees (
  id text primary key default gen_random_uuid()::text,
  task_id text not null references public.tasks (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, user_id)
);

create table public.comments (
  id text primary key default gen_random_uuid()::text,
  task_id text not null references public.tasks (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.attachments (
  id text primary key default gen_random_uuid()::text,
  task_id text not null references public.tasks (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  filename text not null,
  mime_type text not null,
  size int not null,
  stored_name text not null,
  created_at timestamptz not null default now()
);

create table public.daily_logs (
  id text primary key default gen_random_uuid()::text,
  project_id text not null references public.projects (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  date text not null,
  yesterday text not null default '',
  today text not null default '',
  blockers text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, user_id, date)
);

create table public.activities (
  id text primary key default gen_random_uuid()::text,
  project_id text not null references public.projects (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create index tasks_project_rank_idx on public.tasks (project_id, rank, created_at);
create index task_assignees_task_idx on public.task_assignees (task_id);
create index task_assignees_user_idx on public.task_assignees (user_id);
create index comments_task_idx on public.comments (task_id, created_at);
create index activities_project_idx on public.activities (project_id, created_at desc);
create index projects_access_idx on public.projects (access);
create index projects_group_id_idx on public.projects (group_id);
create index group_members_user_idx on public.group_members (user_id);
create index group_members_group_idx on public.group_members (group_id);
create index project_pins_user_idx on public.project_pins (user_id);
create index project_pins_project_idx on public.project_pins (project_id);

create table public.presences (
  user_id text primary key references public.users (id) on delete cascade,
  project_id text references public.projects (id) on delete set null,
  task_id text references public.tasks (id) on delete set null,
  path text not null default '/',
  updated_at timestamptz not null default now()
);

create index presences_updated_idx on public.presences (updated_at desc);

create table public.google_calendar_connections (
  user_id text primary key references public.users (id) on delete cascade,
  google_email text not null,
  calendar_id text not null default 'primary',
  access_token text not null,
  refresh_token text not null,
  token_expiry timestamptz not null,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz
);

create table public.google_calendar_events (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public.users (id) on delete cascade,
  task_id text not null references public.tasks (id) on delete cascade,
  event_id text not null,
  calendar_id text not null default 'primary',
  unique (user_id, task_id)
);

create index google_calendar_events_task_idx on public.google_calendar_events (task_id);

alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_pins enable row level security;
alter table public.sprints enable row level security;
alter table public.tasks enable row level security;
alter table public.comments enable row level security;
alter table public.attachments enable row level security;
alter table public.daily_logs enable row level security;
alter table public.activities enable row level security;
alter table public.presences enable row level security;
alter table public.google_calendar_connections enable row level security;
alter table public.google_calendar_events enable row level security;

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;
