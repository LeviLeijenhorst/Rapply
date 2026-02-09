create table if not exists public.templates (
  id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  sections_json jsonb not null,
  is_saved boolean not null default false,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint templates_name_length check (char_length(name) > 0 and char_length(name) <= 200)
);

create index if not exists templates_user_id_idx on public.templates (user_id);
