create table if not exists public.users (
  id text primary key,
  entra_user_id text unique,
  email text,
  display_name text,
  full_name text,
  phone_number text,
  job_title text,
  account_type text not null default 'paid',
  role text not null default 'regular',
  is_allowlisted boolean not null default true,
  can_see_pricing_page boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_account_type_allowed check (account_type in ('admin', 'paid', 'test')),
  constraint users_role_allowed check (role in ('admin', 'regular')),
  constraint users_email_length check (email is null or char_length(email) <= 320),
  constraint users_display_name_length check (display_name is null or char_length(display_name) <= 200),
  constraint users_full_name_length check (full_name is null or char_length(full_name) <= 200),
  constraint users_phone_number_length check (phone_number is null or char_length(phone_number) <= 80),
  constraint users_job_title_length check (job_title is null or char_length(job_title) <= 200)
);

create index if not exists users_role_idx on public.users (role);
