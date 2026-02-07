create table if not exists public.audio_blobs (
  id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  mime_type text not null,
  bytes bytea not null,
  created_at_unix_ms bigint not null
);

create index if not exists audio_blobs_user_id_idx on public.audio_blobs (user_id);

create table if not exists public.audio_blobs (
  id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  mime_type text not null,
  bytes bytea not null,
  created_at_unix_ms bigint not null
);

create index if not exists audio_blobs_user_id_idx on public.audio_blobs (user_id);

