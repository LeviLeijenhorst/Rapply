create table if not exists public.report_coaches (
  report_id text not null references public.reports (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  created_at_unix_ms bigint not null,
  primary key (report_id, user_id)
);

create index if not exists report_coaches_user_id_idx on public.report_coaches (user_id);

