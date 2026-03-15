alter table public.snippets
  add column if not exists field_id text;

update public.snippets
set field_id = coalesce(nullif(trim(field_id), ''), nullif(trim(snippet_type), ''), 'general')
where field_id is null or trim(field_id) = '';

alter table public.snippets
  alter column field_id set not null;

create index if not exists snippets_field_id_idx on public.snippets (field_id);
