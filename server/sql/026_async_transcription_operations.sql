create table if not exists public.async_transcription_operations (
  operation_id text primary key,
  owner_user_id text not null references public.users (id) on delete cascade,
  input_id text references public.inputs (id) on delete set null,
  status text not null,
  mode text,
  provider text,
  upload_path text,
  language_code text,
  mime_type text,
  external_job_id text,
  external_status_path text,
  external_result_path text,
  transcript_text text,
  provider_error text,
  seconds_charged integer,
  charged_cycle_seconds integer,
  charged_non_expiring_seconds integer,
  remaining_seconds_after integer,
  plan_key text,
  cycle_key text,
  error_message text,
  created_at timestamptz not null default now(),
  charged_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  refunded_at timestamptz,
  last_polled_at timestamptz,
  cancelled_at timestamptz,
  constraint async_transcription_operations_operation_id_length check (char_length(operation_id) > 0 and char_length(operation_id) <= 200)
);

create index if not exists async_transcription_operations_owner_user_id_idx
  on public.async_transcription_operations (owner_user_id);

create index if not exists async_transcription_operations_owner_status_idx
  on public.async_transcription_operations (owner_user_id, status);

create index if not exists async_transcription_operations_status_idx
  on public.async_transcription_operations (status);

create index if not exists async_transcription_operations_started_at_idx
  on public.async_transcription_operations (started_at);

create table if not exists public.async_transcription_upload_tokens (
  token text primary key,
  owner_user_id text not null references public.users (id) on delete cascade,
  operation_id text not null references public.async_transcription_operations (operation_id) on delete cascade,
  upload_blob_name text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint async_transcription_upload_tokens_token_length check (char_length(token) > 0 and char_length(token) <= 256),
  constraint async_transcription_upload_tokens_upload_blob_name_length check (char_length(upload_blob_name) > 0 and char_length(upload_blob_name) <= 500)
);

create index if not exists async_transcription_upload_tokens_owner_user_id_idx
  on public.async_transcription_upload_tokens (owner_user_id);

create index if not exists async_transcription_upload_tokens_operation_id_idx
  on public.async_transcription_upload_tokens (operation_id);
