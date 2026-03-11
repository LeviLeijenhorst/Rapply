create table if not exists public.client_owners (
  client_id text not null references public.clients (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  created_at_unix_ms bigint not null,
  primary key (client_id, user_id)
);

create index if not exists client_owners_user_id_idx on public.client_owners (user_id);
