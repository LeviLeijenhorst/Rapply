create table if not exists public.coachees (
  id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  is_archived boolean not null default false,
  constraint coachees_name_length check (char_length(name) > 0 and char_length(name) <= 200)
);

create index if not exists coachees_user_id_idx on public.coachees (user_id);

create table if not exists public.coachee_sessions (
  id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  coachee_id text references public.coachees (id) on delete cascade,
  title text not null,
  kind text not null,
  audio_blob_id text,
  upload_file_name text,
  transcript text,
  summary text,
  transcription_status text not null default 'idle',
  transcription_error text,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint coachee_sessions_title_length check (char_length(title) > 0 and char_length(title) <= 200),
  constraint coachee_sessions_kind_length check (char_length(kind) > 0 and char_length(kind) <= 20)
);

create index if not exists coachee_sessions_user_id_idx on public.coachee_sessions (user_id);
create index if not exists coachee_sessions_coachee_id_idx on public.coachee_sessions (coachee_id);

create table if not exists public.session_notes (
  id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  session_id text not null references public.coachee_sessions (id) on delete cascade,
  text text not null,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint session_notes_text_length check (char_length(text) > 0 and char_length(text) <= 10000)
);

create index if not exists session_notes_user_id_idx on public.session_notes (user_id);
create index if not exists session_notes_session_id_idx on public.session_notes (session_id);

create table if not exists public.session_written_reports (
  session_id text primary key references public.coachee_sessions (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  text text not null,
  updated_at_unix_ms bigint not null,
  constraint session_written_reports_text_length check (char_length(text) > 0 and char_length(text) <= 20000)
);

create index if not exists session_written_reports_user_id_idx on public.session_written_reports (user_id);
