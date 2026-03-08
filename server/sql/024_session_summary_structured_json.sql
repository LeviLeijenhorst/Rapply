alter table public.coachee_sessions
  add column if not exists summary_structured_json jsonb;
