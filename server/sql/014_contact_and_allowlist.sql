create table if not exists public.signup_email_allowlist (
  id uuid primary key,
  email text not null unique,
  added_by_email text not null,
  created_at timestamptz not null default now(),
  constraint signup_email_allowlist_email_length check (char_length(email) > 0 and char_length(email) <= 320),
  constraint signup_email_allowlist_added_by_email_length check (char_length(added_by_email) > 0 and char_length(added_by_email) <= 320)
);

create table if not exists public.contact_submissions (
  id uuid primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  message text not null,
  account_email text,
  created_at timestamptz not null default now(),
  constraint contact_submissions_name_length check (char_length(name) > 0 and char_length(name) <= 200),
  constraint contact_submissions_email_length check (char_length(email) > 0 and char_length(email) <= 320),
  constraint contact_submissions_phone_length check (phone is null or char_length(phone) <= 50),
  constraint contact_submissions_message_length check (char_length(message) > 0 and char_length(message) <= 5000),
  constraint contact_submissions_account_email_length check (account_email is null or char_length(account_email) <= 320)
);

create index if not exists contact_submissions_created_at_idx on public.contact_submissions (created_at desc);

insert into public.signup_email_allowlist (id, email, added_by_email)
values ('d44fc71f-3afe-4726-a35f-66741b0920ed', 'ltleijenhorst@gmail.com', 'ltleijenhorst@gmail.com')
on conflict (email) do nothing;
