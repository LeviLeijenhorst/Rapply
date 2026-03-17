alter table public.snippets
  add column if not exists field_ids text[];

update public.snippets
set field_ids = array[
  coalesce(nullif(trim(field_id), ''), nullif(trim(snippet_type), ''), 'general')
]
where field_ids is null
   or cardinality(field_ids) = 0;

alter table public.snippets
  alter column field_ids set not null;

create index if not exists snippets_field_ids_gin_idx on public.snippets using gin (field_ids);
