-- Align product-domain SQL terminology and core report modeling.
-- This migration assumes low/no data risk in the new app environment.

do $$
begin
  -- Avoid collision: existing public.sessions is the auth token table.
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'sessions'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'sessions' and column_name = 'token'
  ) then
    alter table public.sessions rename to auth_sessions;
  end if;
end
$$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'coachees')
     and not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'clients') then
    alter table public.coachees rename to clients;
  end if;
end
$$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'coachee_sessions')
     and not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'sessions') then
    alter table public.coachee_sessions rename to sessions;
  end if;
end
$$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'audio_blobs')
     and not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'audio_uploads') then
    alter table public.audio_blobs rename to audio_uploads;
  end if;
end
$$;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'user_id') then
    alter table public.clients rename column user_id to owner_user_id;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'sessions' and column_name = 'user_id') then
    alter table public.sessions rename column user_id to owner_user_id;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'sessions' and column_name = 'coachee_id') then
    alter table public.sessions rename column coachee_id to client_id;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'sessions' and column_name = 'kind') then
    alter table public.sessions rename column kind to input_type;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'sessions' and column_name = 'audio_blob_id') then
    alter table public.sessions rename column audio_blob_id to audio_upload_id;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'sessions' and column_name = 'transcript') then
    alter table public.sessions rename column transcript to transcript_text;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'sessions' and column_name = 'summary') then
    alter table public.sessions rename column summary to summary_text;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'session_notes' and column_name = 'user_id') then
    alter table public.session_notes rename column user_id to owner_user_id;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'trajectories' and column_name = 'user_id') then
    alter table public.trajectories rename column user_id to owner_user_id;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'trajectories' and column_name = 'coachee_id') then
    alter table public.trajectories rename column coachee_id to client_id;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'trajectories' and column_name = 'dienst_type') then
    alter table public.trajectories rename column dienst_type to service_type;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'trajectories' and column_name = 'plan_van_aanpak_json') then
    alter table public.trajectories rename column plan_van_aanpak_json to plan_of_action_json;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'activities' and column_name = 'user_id') then
    alter table public.activities rename column user_id to owner_user_id;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'activity_templates' and column_name = 'user_id') then
    alter table public.activity_templates rename column user_id to owner_user_id;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'templates' and column_name = 'user_id') then
    alter table public.templates rename column user_id to owner_user_id;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'audio_uploads' and column_name = 'user_id') then
    alter table public.audio_uploads rename column user_id to owner_user_id;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'snippets' and column_name = 'user_id') then
    alter table public.snippets rename column user_id to owner_user_id;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'snippets' and column_name = 'item_id') then
    alter table public.snippets rename column item_id to source_session_id;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'snippets' and column_name = 'field') then
    alter table public.snippets rename column field to snippet_type;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'snippets' and column_name = 'date') then
    alter table public.snippets rename column date to snippet_date;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'snippets' and column_name = 'status') then
    alter table public.snippets rename column status to approval_status;
  end if;
end
$$;

alter table public.snippets
  add column if not exists client_id text references public.clients (id) on delete cascade;

update public.snippets s
set client_id = ss.client_id
from public.sessions ss
where s.source_session_id = ss.id
  and s.client_id is null;

update public.snippets s
set client_id = t.client_id
from public.trajectories t
where s.trajectory_id = t.id
  and s.client_id is null;

create table if not exists public.reports (
  id text primary key,
  owner_user_id uuid not null references public.users (id) on delete cascade,
  client_id text references public.clients (id) on delete cascade,
  trajectory_id text references public.trajectories (id) on delete set null,
  source_session_id text references public.sessions (id) on delete set null,
  title text not null default '',
  report_type text not null default 'session_report',
  state text not null default 'needs_review',
  report_text text not null default '',
  report_structured_json jsonb,
  report_date text,
  first_sick_day text,
  wvp_week_number text,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint reports_state_allowed check (state in ('incomplete', 'needs_review', 'complete')),
  constraint reports_type_length check (char_length(report_type) > 0 and char_length(report_type) <= 120),
  constraint reports_title_length check (char_length(title) <= 300)
);

create index if not exists reports_owner_user_id_idx on public.reports (owner_user_id);
create index if not exists reports_client_id_idx on public.reports (client_id);
create index if not exists reports_trajectory_id_idx on public.reports (trajectory_id);
create index if not exists reports_source_session_id_idx on public.reports (source_session_id);

insert into public.reports (
  id,
  owner_user_id,
  client_id,
  trajectory_id,
  source_session_id,
  title,
  report_type,
  state,
  report_text,
  report_date,
  first_sick_day,
  wvp_week_number,
  created_at_unix_ms,
  updated_at_unix_ms
)
select
  'report_' || md5(swr.session_id || ':' || swr.user_id::text),
  swr.user_id,
  s.client_id,
  s.trajectory_id,
  swr.session_id,
  coalesce(s.title, ''),
  'session_report',
  'needs_review',
  swr.text,
  s.report_date,
  s.report_first_sick_day,
  s.wvp_week_number,
  coalesce(s.created_at_unix_ms, swr.updated_at_unix_ms),
  swr.updated_at_unix_ms
from public.session_written_reports swr
left join public.sessions s on s.id = swr.session_id
on conflict (id) do update
set report_text = excluded.report_text,
    updated_at_unix_ms = excluded.updated_at_unix_ms;

drop table if exists public.session_written_reports;

alter table public.sessions drop column if exists report_date;
alter table public.sessions drop column if exists wvp_week_number;
alter table public.sessions drop column if exists report_first_sick_day;

