alter table public.tasks
  add column if not exists all_day boolean not null default true;
