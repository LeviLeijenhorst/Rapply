create table if not exists public.clients (
  id text primary key,
  name text not null,
  client_details text not null default '',
  employer_details text not null default '',
  trajectory_start_date text,
  trajectory_end_date text,
  is_archived boolean not null default false,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint clients_name_length check (char_length(name) > 0 and char_length(name) <= 200),
  constraint clients_client_details_length check (char_length(client_details) <= 4000),
  constraint clients_employer_details_length check (char_length(employer_details) <= 4000),
  constraint clients_trajectory_start_date_length check (trajectory_start_date is null or char_length(trajectory_start_date) <= 100),
  constraint clients_trajectory_end_date_length check (trajectory_end_date is null or char_length(trajectory_end_date) <= 100)
);

create index if not exists clients_is_archived_idx on public.clients (is_archived);
