create table if not exists public.audio_streams (
  id text primary key,
  owner_user_id text not null references public.users (id) on delete cascade,
  mime_type text not null,
  total_duration_milliseconds bigint,
  chunk_count integer,
  created_at_unix_milliseconds bigint not null,
  constraint audio_streams_mime_type_length check (char_length(mime_type) > 0 and char_length(mime_type) <= 200)
);

create index if not exists audio_streams_owner_user_id_idx on public.audio_streams (owner_user_id);

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
