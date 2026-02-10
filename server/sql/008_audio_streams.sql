create table if not exists public.audio_streams (
  id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  mime_type text not null,
  total_duration_milliseconds bigint,
  chunk_count integer,
  created_at_unix_milliseconds bigint not null
);

create index if not exists audio_streams_user_id_idx on public.audio_streams (user_id);

create table if not exists public.audio_stream_chunks (
  audio_stream_id text not null references public.audio_streams (id) on delete cascade,
  chunk_index integer not null,
  start_milliseconds bigint not null,
  duration_milliseconds bigint not null,
  bytes bytea not null,
  created_at_unix_milliseconds bigint not null,
  primary key (audio_stream_id, chunk_index)
);

create index if not exists audio_stream_chunks_stream_id_idx on public.audio_stream_chunks (audio_stream_id);
