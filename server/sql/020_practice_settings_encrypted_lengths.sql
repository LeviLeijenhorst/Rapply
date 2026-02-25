alter table public.practice_settings
  drop constraint if exists practice_settings_practice_name_length,
  drop constraint if exists practice_settings_website_length,
  drop constraint if exists practice_settings_tint_color_length;

alter table public.practice_settings
  add constraint practice_settings_practice_name_length check (char_length(practice_name) <= 4000),
  add constraint practice_settings_website_length check (char_length(website) <= 4000),
  add constraint practice_settings_tint_color_length check (char_length(tint_color) <= 4000);
