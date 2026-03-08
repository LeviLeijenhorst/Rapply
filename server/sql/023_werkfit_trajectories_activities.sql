create table if not exists public.trajectories (
  id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  coachee_id text not null references public.coachees (id) on delete cascade,
  name text not null,
  dienst_type text not null default 'Werkfit maken',
  order_number text,
  start_date text,
  max_hours numeric(10,2) not null default 41,
  max_admin_hours numeric(10,2) not null default 3,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint trajectories_name_length check (char_length(name) > 0 and char_length(name) <= 200),
  constraint trajectories_dienst_type_length check (char_length(dienst_type) > 0 and char_length(dienst_type) <= 120),
  constraint trajectories_order_number_length check (order_number is null or char_length(order_number) <= 200),
  constraint trajectories_start_date_length check (start_date is null or char_length(start_date) <= 100)
);

create index if not exists trajectories_user_id_idx on public.trajectories (user_id);
create index if not exists trajectories_coachee_id_idx on public.trajectories (coachee_id);

alter table public.coachee_sessions
  add column if not exists trajectory_id text references public.trajectories (id) on delete set null;

create index if not exists coachee_sessions_trajectory_id_idx on public.coachee_sessions (trajectory_id);

create table if not exists public.activity_templates (
  id text primary key,
  user_id uuid references public.users (id) on delete cascade,
  name text not null,
  description text not null default '',
  category text not null,
  default_hours numeric(10,2) not null default 0,
  is_admin boolean not null default false,
  organization_id text,
  is_active boolean not null default true,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint activity_templates_name_length check (char_length(name) > 0 and char_length(name) <= 200),
  constraint activity_templates_category_length check (char_length(category) > 0 and char_length(category) <= 120),
  constraint activity_templates_organization_id_length check (organization_id is null or char_length(organization_id) <= 200)
);

create index if not exists activity_templates_user_id_idx on public.activity_templates (user_id);
create index if not exists activity_templates_is_active_idx on public.activity_templates (is_active);
create index if not exists activity_templates_organization_id_idx on public.activity_templates (organization_id);

create table if not exists public.activities (
  id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  trajectory_id text not null references public.trajectories (id) on delete cascade,
  session_id text references public.coachee_sessions (id) on delete set null,
  template_id text references public.activity_templates (id) on delete set null,
  name text not null,
  category text not null,
  status text not null,
  planned_hours numeric(10,2),
  actual_hours numeric(10,2),
  source text not null default 'manual',
  is_admin boolean not null default false,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint activities_name_length check (char_length(name) > 0 and char_length(name) <= 200),
  constraint activities_category_length check (char_length(category) > 0 and char_length(category) <= 120),
  constraint activities_status_allowed check (status in ('planned', 'executed')),
  constraint activities_source_allowed check (source in ('manual', 'ai_detected'))
);

create index if not exists activities_user_id_idx on public.activities (user_id);
create index if not exists activities_trajectory_id_idx on public.activities (trajectory_id);
create index if not exists activities_session_id_idx on public.activities (session_id);

insert into public.activity_templates (
  id,
  user_id,
  name,
  description,
  category,
  default_hours,
  is_admin,
  organization_id,
  is_active,
  created_at_unix_ms,
  updated_at_unix_ms
)
values
  ('activity-template-werkfit-admin', null, 'Administratie en verslaglegging', '', 'administratie', 3, true, null, true, 0, 0),
  ('activity-template-werkfit-cv', null, 'CV optimalisatie', '', 'sollicitatie', 8, false, null, true, 0, 0),
  ('activity-template-werkfit-arbeidsmarktanalyse', null, 'Arbeidsmarktanalyse', '', 'arbeidsmarkt', 8, false, null, true, 0, 0),
  ('activity-template-werkfit-sollicitatiecoaching', null, 'Sollicitatiecoaching', '', 'sollicitatie', 14, false, null, true, 0, 0),
  ('activity-template-werkfit-persoonlijke-effectiviteit', null, 'Persoonlijke effectiviteit', '', 'persoonlijke-effectiviteit', 8, false, null, true, 0, 0)
on conflict (id) do nothing;

insert into public.trajectories (
  id,
  user_id,
  coachee_id,
  name,
  dienst_type,
  order_number,
  start_date,
  max_hours,
  max_admin_hours,
  created_at_unix_ms,
  updated_at_unix_ms
)
select
  'trajectory_default_' || md5(c.id),
  c.user_id,
  c.id,
  'Default',
  'Werkfit maken',
  null,
  null,
  41,
  3,
  greatest(c.created_at_unix_ms, 0),
  greatest(c.updated_at_unix_ms, c.created_at_unix_ms, 0)
from public.coachees c
where not exists (
  select 1
  from public.trajectories t
  where t.id = 'trajectory_default_' || md5(c.id)
);

update public.coachee_sessions s
set trajectory_id = 'trajectory_default_' || md5(s.coachee_id)
where s.coachee_id is not null
  and s.trajectory_id is null;
