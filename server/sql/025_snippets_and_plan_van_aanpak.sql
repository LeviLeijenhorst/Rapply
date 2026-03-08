alter table public.trajectories
  add column if not exists plan_van_aanpak_json jsonb;

create table if not exists public.snippets (
  id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  trajectory_id text not null references public.trajectories (id) on delete cascade,
  item_id text not null references public.coachee_sessions (id) on delete cascade,
  field text not null,
  text text not null,
  date bigint not null,
  status text not null default 'pending',
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint snippets_status_allowed check (status in ('pending', 'approved', 'rejected')),
  constraint snippets_field_length check (char_length(field) > 0 and char_length(field) <= 120),
  constraint snippets_text_length check (char_length(text) > 0 and char_length(text) <= 4000)
);

create index if not exists snippets_user_id_idx on public.snippets (user_id);
create index if not exists snippets_trajectory_id_idx on public.snippets (trajectory_id);
create index if not exists snippets_item_id_idx on public.snippets (item_id);
create index if not exists snippets_date_idx on public.snippets (date);
