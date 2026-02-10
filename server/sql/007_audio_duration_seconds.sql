alter table public.coachee_sessions
add column if not exists audio_duration_seconds double precision;
