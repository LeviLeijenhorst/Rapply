alter table public.coachees
  add column if not exists client_details text not null default '',
  add column if not exists employer_details text not null default '',
  add column if not exists first_sick_day text not null default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'coachees_client_details_length') then
    alter table public.coachees add constraint coachees_client_details_length check (char_length(client_details) <= 2000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coachees_employer_details_length') then
    alter table public.coachees add constraint coachees_employer_details_length check (char_length(employer_details) <= 2000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coachees_first_sick_day_length') then
    alter table public.coachees add constraint coachees_first_sick_day_length check (char_length(first_sick_day) <= 100);
  end if;
end $$;

alter table public.coachee_sessions
  add column if not exists report_date text,
  add column if not exists wvp_week_number text,
  add column if not exists report_first_sick_day text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'coachee_sessions_report_date_length') then
    alter table public.coachee_sessions add constraint coachee_sessions_report_date_length check (report_date is null or char_length(report_date) <= 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coachee_sessions_wvp_week_number_length') then
    alter table public.coachee_sessions add constraint coachee_sessions_wvp_week_number_length check (wvp_week_number is null or char_length(wvp_week_number) <= 50);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coachee_sessions_report_first_sick_day_length') then
    alter table public.coachee_sessions add constraint coachee_sessions_report_first_sick_day_length check (report_first_sick_day is null or char_length(report_first_sick_day) <= 100);
  end if;
end $$;
