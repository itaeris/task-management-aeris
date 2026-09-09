create table if not exists public.groups (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  created_by text not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id text primary key default gen_random_uuid()::text,
  group_id text not null references public.groups (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  unique (group_id, user_id)
);

alter table public.projects
  add column if not exists access text not null default 'personal',
  add column if not exists group_id text references public.groups (id) on delete set null;

alter table public.project_members
  add column if not exists source text not null default 'invite';

update public.project_members
set source = 'owner'
where role = 'owner' and source = 'invite';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_access_check'
  ) then
    alter table public.projects
      add constraint projects_access_check
      check (access in ('personal', 'group', 'organization'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'projects_group_access_check'
  ) then
    alter table public.projects
      add constraint projects_group_access_check
      check (
        (access = 'group' and group_id is not null)
        or (access <> 'group' and group_id is null)
      );
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'project_members_source_check'
  ) then
    alter table public.project_members
      add constraint project_members_source_check
      check (source in ('owner', 'invite', 'access'));
  end if;
end $$;

create index if not exists projects_access_idx on public.projects (access);
create index if not exists projects_group_id_idx on public.projects (group_id);
create index if not exists group_members_user_idx on public.group_members (user_id);
create index if not exists group_members_group_idx on public.group_members (group_id);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
