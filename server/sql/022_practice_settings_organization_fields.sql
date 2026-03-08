alter table public.practice_settings
  add column if not exists visit_address text not null default '',
  add column if not exists postal_address text not null default '',
  add column if not exists postal_code_city text not null default '',
  add column if not exists contact_name text not null default '',
  add column if not exists contact_role text not null default '',
  add column if not exists contact_phone text not null default '',
  add column if not exists contact_email text not null default '';

alter table public.practice_settings
  drop constraint if exists practice_settings_visit_address_length,
  drop constraint if exists practice_settings_postal_address_length,
  drop constraint if exists practice_settings_postal_code_city_length,
  drop constraint if exists practice_settings_contact_name_length,
  drop constraint if exists practice_settings_contact_role_length,
  drop constraint if exists practice_settings_contact_phone_length,
  drop constraint if exists practice_settings_contact_email_length;

alter table public.practice_settings
  add constraint practice_settings_visit_address_length check (char_length(visit_address) <= 4000),
  add constraint practice_settings_postal_address_length check (char_length(postal_address) <= 4000),
  add constraint practice_settings_postal_code_city_length check (char_length(postal_code_city) <= 4000),
  add constraint practice_settings_contact_name_length check (char_length(contact_name) <= 4000),
  add constraint practice_settings_contact_role_length check (char_length(contact_role) <= 4000),
  add constraint practice_settings_contact_phone_length check (char_length(contact_phone) <= 4000),
  add constraint practice_settings_contact_email_length check (char_length(contact_email) <= 4000);
