alter table public.users add column if not exists username text;
alter table public.users add column if not exists password_hash text;
alter table public.users add column if not exists role text not null default 'member';

create unique index if not exists users_username_key on public.users (username);
