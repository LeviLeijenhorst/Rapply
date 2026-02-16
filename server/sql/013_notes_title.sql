alter table if exists public.session_notes
add column if not exists title text not null default '';
