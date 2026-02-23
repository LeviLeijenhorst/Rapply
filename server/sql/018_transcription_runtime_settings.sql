create table if not exists public.transcription_runtime_settings (
  singleton boolean primary key default true,
  mode text not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

insert into public.transcription_runtime_settings (singleton, mode)
values (true, 'azure-fast-batch')
on conflict (singleton) do nothing;
