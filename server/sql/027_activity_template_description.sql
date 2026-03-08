alter table public.activity_templates
  add column if not exists description text not null default '';
