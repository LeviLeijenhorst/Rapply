create table if not exists public.notes (
  id text primary key,
  client_id text not null references public.clients (id) on delete cascade,
  input_id text references public.inputs (id) on delete set null,
  created_by_user_id text references public.users (id) on delete set null,
  title text not null default '',
  text text not null,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint notes_title_length check (char_length(title) <= 200),
  constraint notes_text_length check (char_length(text) > 0 and char_length(text) <= 10000)
);

create index if not exists notes_client_id_idx on public.notes (client_id);
create index if not exists notes_input_id_idx on public.notes (input_id);
create index if not exists notes_created_by_user_id_idx on public.notes (created_by_user_id);
