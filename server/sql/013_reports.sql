create table if not exists public.reports (
  id text primary key,
  client_id text not null references public.clients (id) on delete cascade,
  source_input_id text references public.inputs (id) on delete set null,
  created_by_user_id text references public.users (id) on delete set null,
  primary_author_user_id text references public.users (id) on delete set null,
  title text not null default '',
  report_type text not null default 'session_report',
  state text not null default 'needs_review',
  report_text text not null default '',
  report_structured_json jsonb,
  report_date text,
  first_sick_day text,
  wvp_week_number text,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint reports_state_allowed check (state in ('incomplete', 'needs_review', 'complete')),
  constraint reports_type_length check (char_length(report_type) > 0 and char_length(report_type) <= 120),
  constraint reports_title_length check (char_length(title) <= 300)
);

create index if not exists reports_client_id_idx on public.reports (client_id);
create index if not exists reports_source_input_id_idx on public.reports (source_input_id);
create index if not exists reports_created_by_user_id_idx on public.reports (created_by_user_id);
create index if not exists reports_primary_author_user_id_idx on public.reports (primary_author_user_id);
create index if not exists reports_state_idx on public.reports (state);
