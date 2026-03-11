create table if not exists public.client_organizations (
  client_id text not null references public.clients (id) on delete cascade,
  organization_id text not null references public.organizations (id) on delete cascade,
  created_at_unix_ms bigint not null,
  primary key (client_id, organization_id)
);

create index if not exists client_organizations_organization_id_idx on public.client_organizations (organization_id);
