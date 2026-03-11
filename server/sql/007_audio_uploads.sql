create table if not exists public.audio_uploads (
  id text primary key,
  owner_user_id text not null references public.users (id) on delete cascade,
  mime_type text not null,
  bytes bytea not null,
  created_at_unix_ms bigint not null,
  constraint audio_uploads_mime_type_length check (char_length(mime_type) > 0 and char_length(mime_type) <= 200)
);

create index if not exists audio_uploads_owner_user_id_idx on public.audio_uploads (owner_user_id);
