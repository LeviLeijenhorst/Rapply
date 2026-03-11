create table if not exists public.organization_users (
  organization_id text not null references public.organizations (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  role text not null default 'regular',
  created_at_unix_ms bigint not null,
  primary key (organization_id, user_id),
  constraint organization_users_role_allowed check (role in ('admin', 'regular'))
);

create index if not exists organization_users_user_id_idx on public.organization_users (user_id);
