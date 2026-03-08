alter table if exists public.transcription_runtime_settings
  add column if not exists provider text;

update public.transcription_runtime_settings
set provider = 'azure'
where provider is null or btrim(provider) = '';
