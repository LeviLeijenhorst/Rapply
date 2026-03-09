create table if not exists public.pipedrive_import_jobs (
  id text primary key,
  owner_user_id uuid not null references public.users (id) on delete cascade,
  connection_id text not null references public.integration_connections (id) on delete cascade,
  status text not null,
  entity_types_json jsonb not null,
  mapping_version text not null,
  options_json jsonb,
  progress_json jsonb,
  warnings_json jsonb,
  error_message text,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  completed_at_unix_ms bigint,
  constraint pipedrive_import_jobs_status_allowed check (status in ('queued', 'fetching', 'mapping', 'applying', 'completed', 'failed', 'cancelled'))
);

create index if not exists pipedrive_import_jobs_owner_user_id_idx on public.pipedrive_import_jobs (owner_user_id);
create index if not exists pipedrive_import_jobs_status_idx on public.pipedrive_import_jobs (status);

create table if not exists public.pipedrive_raw_entities (
  id text primary key,
  job_id text not null references public.pipedrive_import_jobs (id) on delete cascade,
  owner_user_id uuid not null references public.users (id) on delete cascade,
  entity_type text not null,
  external_id text not null,
  payload_json jsonb not null,
  payload_hash text not null,
  fetched_at_unix_ms bigint not null,
  mapping_status text not null default 'pending',
  mapping_notes text,
  constraint pipedrive_raw_entities_mapping_status_allowed check (mapping_status in ('pending', 'mapped', 'skipped', 'failed'))
);

create index if not exists pipedrive_raw_entities_job_id_idx on public.pipedrive_raw_entities (job_id);
create index if not exists pipedrive_raw_entities_owner_user_id_idx on public.pipedrive_raw_entities (owner_user_id);
create index if not exists pipedrive_raw_entities_entity_type_idx on public.pipedrive_raw_entities (entity_type);
create unique index if not exists pipedrive_raw_entities_unique_per_job_idx on public.pipedrive_raw_entities (job_id, entity_type, external_id);

create table if not exists public.external_source_links (
  id text primary key,
  owner_user_id uuid not null references public.users (id) on delete cascade,
  provider text not null,
  external_type text not null,
  external_id text not null,
  internal_type text not null,
  internal_id text not null,
  source_job_id text references public.pipedrive_import_jobs (id) on delete set null,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint external_source_links_provider_allowed check (provider in ('pipedrive'))
);

create index if not exists external_source_links_owner_user_id_idx on public.external_source_links (owner_user_id);
create unique index if not exists external_source_links_unique_external_idx
  on public.external_source_links (owner_user_id, provider, external_type, external_id);
