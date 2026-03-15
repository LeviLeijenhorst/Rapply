create table if not exists public.trajectories (
  id text primary key,
  client_id text not null references public.clients (id) on delete cascade,
  is_active boolean not null default true,
  name text not null default '',
  service_type text not null default 'werkfit',
  uwv_contact_name text,
  uwv_contact_phone text,
  uwv_contact_email text,
  order_number text,
  start_date text,
  plan_of_action_json jsonb,
  max_hours integer not null default 0,
  max_admin_hours integer not null default 0,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null
);

create index if not exists trajectories_client_id_idx on public.trajectories (client_id);
create unique index if not exists trajectories_one_active_per_client_idx
  on public.trajectories (client_id)
  where is_active;

alter table public.inputs
  add column if not exists trajectory_id text references public.trajectories (id) on delete set null;

alter table public.snippets
  add column if not exists trajectory_id text references public.trajectories (id) on delete set null;

alter table public.reports
  add column if not exists trajectory_id text references public.trajectories (id) on delete set null;

create index if not exists inputs_trajectory_id_idx on public.inputs (trajectory_id);
create index if not exists snippets_trajectory_id_idx on public.snippets (trajectory_id);
create index if not exists reports_trajectory_id_idx on public.reports (trajectory_id);

