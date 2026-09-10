create table if not exists public.task_assignees (
  id text primary key default gen_random_uuid()::text,
  task_id text not null references public.tasks (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, user_id)
);

create index if not exists task_assignees_task_idx on public.task_assignees (task_id);
create index if not exists task_assignees_user_idx on public.task_assignees (user_id);

insert into public.task_assignees (task_id, user_id)
select id, assignee_id
from public.tasks
where assignee_id is not null
on conflict (task_id, user_id) do nothing;

alter table public.task_assignees enable row level security;
