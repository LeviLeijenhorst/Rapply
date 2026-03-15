drop table if exists public.client_organizations;

create table if not exists public.client_assignments (
  client_id text not null references public.clients (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  role text not null default 'coach',
  created_at_unix_ms bigint not null,
  primary key (client_id, user_id)
);

create index if not exists client_assignments_user_id_idx on public.client_assignments (user_id);

