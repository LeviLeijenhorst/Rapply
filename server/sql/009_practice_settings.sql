create table if not exists public.practice_settings (
  user_id uuid primary key references public.users (id) on delete cascade,
  practice_name text not null default '',
  website text not null default '',
  tint_color text not null default '#BE0165',
  logo_data_url text,
  updated_at_unix_ms bigint not null default 0,
  constraint practice_settings_practice_name_length check (char_length(practice_name) <= 4000),
  constraint practice_settings_website_length check (char_length(website) <= 4000),
  constraint practice_settings_tint_color_length check (char_length(tint_color) <= 4000),
  constraint practice_settings_logo_data_url_length check (logo_data_url is null or char_length(logo_data_url) <= 2000000)
);
