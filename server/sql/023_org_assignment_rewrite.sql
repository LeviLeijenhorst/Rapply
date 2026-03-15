alter table public.clients
  add column if not exists organization_id text references public.organizations (id) on delete cascade,
  add column if not exists created_by_user_id text references public.users (id) on delete set null,
  add column if not exists primary_coach_user_id text references public.users (id) on delete set null,
  add column if not exists trajectory_start_date text,
  add column if not exists trajectory_end_date text;

create index if not exists clients_organization_id_idx on public.clients (organization_id);
create index if not exists clients_primary_coach_user_id_idx on public.clients (primary_coach_user_id);

drop table if exists public.client_organizations;
drop table if exists public.client_owners;

create table if not exists public.client_assignments (
  client_id text not null references public.clients (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  role text not null default 'coach',
  created_at_unix_ms bigint not null default (extract(epoch from now())::bigint * 1000),
  primary key (client_id, user_id)
);

create index if not exists client_assignments_user_id_idx on public.client_assignments (user_id);

alter table public.inputs
  add column if not exists created_by_user_id text references public.users (id) on delete set null;

alter table public.notes
  add column if not exists created_by_user_id text references public.users (id) on delete set null;

alter table public.snippets
  add column if not exists created_by_user_id text references public.users (id) on delete set null;

alter table public.reports
  add column if not exists created_by_user_id text references public.users (id) on delete set null,
  add column if not exists primary_author_user_id text references public.users (id) on delete set null;

alter table public.trajectories
  drop column if exists owner_user_id;

drop index if exists trajectories_owner_user_id_idx;
drop index if exists trajectories_owner_client_idx;
drop index if exists trajectories_one_active_per_client_idx;
create unique index if not exists trajectories_one_active_per_client_idx
  on public.trajectories (client_id)
  where is_active;

create table if not exists public.report_coaches (
  report_id text not null references public.reports (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  created_at_unix_ms bigint not null default (extract(epoch from now())::bigint * 1000),
  primary key (report_id, user_id)
);

create index if not exists report_coaches_user_id_idx on public.report_coaches (user_id);

create table if not exists public.billing_organizations (
  organization_id text primary key references public.organizations (id) on delete cascade,
  purchased_seconds integer not null default 0,
  admin_granted_seconds integer not null default 0,
  non_expiring_used_seconds integer not null default 0,
  cycle_used_seconds_by_key jsonb not null default '{}'::jsonb,
  cycle_granted_seconds_by_key jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

