create table if not exists public.input_summaries (
  input_id text primary key references public.inputs (id) on delete cascade,
  summary_text text not null default '',
  summary_structured_json jsonb,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null
);
