create table if not exists public.organization_transcription_settings (
  organization_id text primary key references public.organizations (id) on delete cascade,
  provider text not null default 'azure',
  mode text not null default 'fast_batch',
  language_code text not null default 'nl-NL',
  updated_at_unix_ms bigint not null default 0,
  updated_by_user_id text references public.users (id) on delete set null,
  constraint organization_transcription_settings_provider_allowed check (
    provider in ('azure', 'openai')
  ),
  constraint organization_transcription_settings_mode_allowed check (
    mode in ('fast_batch', 'realtime')
  ),
  constraint organization_transcription_settings_language_code_length check (
    char_length(language_code) > 0 and char_length(language_code) <= 20
  )
);
