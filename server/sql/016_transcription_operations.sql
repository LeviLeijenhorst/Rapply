create table if not exists public.transcription_operations (
  operation_id text primary key,
  owner_user_id text not null references public.users (id) on delete cascade,
  status text not null,
  seconds_charged integer,
  charged_cycle_seconds integer,
  charged_non_expiring_seconds integer,
  remaining_seconds_after integer,
  plan_key text,
  cycle_key text,
  error_message text,
  created_at timestamptz not null default now(),
  charged_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  refunded_at timestamptz,
  constraint transcription_operations_operation_id_length check (char_length(operation_id) > 0 and char_length(operation_id) <= 200)
);

create index if not exists transcription_operations_owner_user_id_idx on public.transcription_operations (owner_user_id);
create index if not exists transcription_operations_status_idx on public.transcription_operations (status);

create table if not exists public.upload_tokens (
  token text primary key,
  owner_user_id text not null references public.users (id) on delete cascade,
  operation_id text not null references public.transcription_operations (operation_id) on delete cascade,
  upload_blob_name text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint upload_tokens_token_length check (char_length(token) > 0 and char_length(token) <= 256),
  constraint upload_tokens_upload_blob_name_length check (char_length(upload_blob_name) > 0 and char_length(upload_blob_name) <= 500)
);

create index if not exists upload_tokens_owner_user_id_idx on public.upload_tokens (owner_user_id);
create index if not exists upload_tokens_operation_id_idx on public.upload_tokens (operation_id);
