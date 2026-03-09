create table if not exists public.meeting_recordings (
  id text primary key,
  owner_user_id uuid not null references public.users (id) on delete cascade,
  session_id text not null references public.sessions (id) on delete cascade,
  audio_stream_id text not null references public.audio_streams (id) on delete cascade,
  status text not null,
  language_code text not null,
  mime_type text not null,
  sample_rate_hz integer,
  channel_count integer,
  source_app text,
  provider text,
  started_at_unix_ms bigint not null,
  last_chunk_at_unix_ms bigint,
  ended_at_unix_ms bigint,
  expected_next_sequence integer not null default 0,
  received_chunk_count integer not null default 0,
  received_bytes bigint not null default 0,
  received_duration_ms bigint not null default 0,
  partial_transcript_text text,
  final_transcript_text text,
  stop_reason text,
  error_message text,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint meeting_recordings_status_allowed check (
    status in ('starting', 'recording', 'stopping', 'finalizing', 'completed', 'interrupted', 'failed', 'cancelled')
  )
);

create index if not exists meeting_recordings_owner_user_id_idx on public.meeting_recordings (owner_user_id);
create index if not exists meeting_recordings_session_id_idx on public.meeting_recordings (session_id);
create index if not exists meeting_recordings_status_idx on public.meeting_recordings (status);

create table if not exists public.meeting_recording_tokens (
  token text primary key,
  owner_user_id uuid not null references public.users (id) on delete cascade,
  meeting_recording_id text not null references public.meeting_recordings (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists meeting_recording_tokens_owner_user_id_idx on public.meeting_recording_tokens (owner_user_id);
create index if not exists meeting_recording_tokens_meeting_recording_id_idx on public.meeting_recording_tokens (meeting_recording_id);
