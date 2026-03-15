create table if not exists public.inputs (
  id text primary key,
  client_id text not null references public.clients (id) on delete cascade,
  organization_id text not null references public.organizations (id) on delete cascade,
  created_by_user_id text references public.users (id) on delete set null,
  input_type text not null,
  title text not null default '',
  source_text text,
  source_upload_id text references public.audio_uploads (id) on delete set null,
  source_file_name text,
  source_mime_type text,
  processing_status text not null default 'idle',
  processing_error text,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint inputs_type_allowed check (
    input_type in ('full_audio_recording', 'spoken_recap_recording', 'written_recap', 'uploaded_audio', 'uploaded_document')
  ),
  constraint inputs_processing_status_allowed check (
    processing_status in ('idle', 'transcribing', 'summarizing', 'done', 'error')
  ),
  constraint inputs_title_length check (char_length(title) <= 200),
  constraint inputs_source_file_name_length check (source_file_name is null or char_length(source_file_name) <= 500),
  constraint inputs_source_mime_type_length check (source_mime_type is null or char_length(source_mime_type) <= 200)
);

create index if not exists inputs_client_id_idx on public.inputs (client_id);
create index if not exists inputs_organization_id_idx on public.inputs (organization_id);
create index if not exists inputs_created_by_user_id_idx on public.inputs (created_by_user_id);
create index if not exists inputs_input_type_idx on public.inputs (input_type);
create index if not exists inputs_processing_status_idx on public.inputs (processing_status);
