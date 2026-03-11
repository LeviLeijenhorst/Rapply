create table if not exists public.snippets (
  id text primary key,
  client_id text not null references public.clients (id) on delete cascade,
  source_input_id text references public.inputs (id) on delete set null,
  owner_user_id text references public.users (id) on delete set null,
  snippet_type text not null,
  snippet_text text not null,
  snippet_date bigint not null,
  approval_status text not null default 'pending',
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint snippets_type_length check (char_length(snippet_type) > 0 and char_length(snippet_type) <= 120),
  constraint snippets_text_length check (char_length(snippet_text) > 0 and char_length(snippet_text) <= 4000),
  constraint snippets_status_allowed check (approval_status in ('pending', 'approved', 'rejected'))
);

create index if not exists snippets_client_id_idx on public.snippets (client_id);
create index if not exists snippets_source_input_id_idx on public.snippets (source_input_id);
create index if not exists snippets_owner_user_id_idx on public.snippets (owner_user_id);
create index if not exists snippets_snippet_date_idx on public.snippets (snippet_date);
create index if not exists snippets_approval_status_idx on public.snippets (approval_status);
