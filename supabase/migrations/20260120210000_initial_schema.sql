create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (display_name is null or char_length(display_name) <= 200)
);

alter table public.profiles enable row level security;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, null)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text,
  email text,
  message text not null,
  created_at timestamptz not null default now(),
  constraint feedback_name_length check (name is null or char_length(name) <= 200),
  constraint feedback_email_length check (email is null or char_length(email) <= 320),
  constraint feedback_message_length check (char_length(message) > 0 and char_length(message) <= 5000)
);

alter table public.feedback enable row level security;

create policy feedback_insert_own
on public.feedback
for insert
to authenticated
with check (auth.uid() = user_id);

create table if not exists public.praktijk_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  account_email text,
  message text not null,
  created_at timestamptz not null default now(),
  constraint praktijk_requests_email_length check (char_length(email) > 0 and char_length(email) <= 320),
  constraint praktijk_requests_account_email_length check (account_email is null or char_length(account_email) <= 320),
  constraint praktijk_requests_message_length check (char_length(message) > 0 and char_length(message) <= 5000)
);

alter table public.praktijk_requests enable row level security;

create policy praktijk_requests_insert_own
on public.praktijk_requests
for insert
to authenticated
with check (auth.uid() = user_id);

create table if not exists public.subscription_cancel_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  selected_plan text not null,
  selected_reason text not null,
  other_reason_text text,
  tips_text text,
  account_email text,
  created_at timestamptz not null default now(),
  constraint subscription_cancel_selected_plan_length check (char_length(selected_plan) > 0 and char_length(selected_plan) <= 50),
  constraint subscription_cancel_selected_reason_length check (char_length(selected_reason) > 0 and char_length(selected_reason) <= 80),
  constraint subscription_cancel_other_reason_length check (other_reason_text is null or char_length(other_reason_text) <= 1000),
  constraint subscription_cancel_tips_length check (tips_text is null or char_length(tips_text) <= 2000),
  constraint subscription_cancel_account_email_length check (account_email is null or char_length(account_email) <= 320)
);

alter table public.subscription_cancel_feedback enable row level security;

create policy subscription_cancel_feedback_insert_own
on public.subscription_cancel_feedback
for insert
to authenticated
with check (auth.uid() = user_id);

create table if not exists public.billing_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  purchased_seconds integer not null default 0,
  non_expiring_used_seconds integer not null default 0,
  cycle_used_seconds_by_key jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_users_non_negative_purchased check (purchased_seconds >= 0),
  constraint billing_users_non_negative_used check (non_expiring_used_seconds >= 0)
);

alter table public.billing_users enable row level security;

create table if not exists public.transcription_operations (
  operation_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null,
  seconds_charged integer,
  charged_cycle_seconds integer,
  charged_non_expiring_seconds integer,
  remaining_seconds_after integer,
  plan_key text,
  cycle_key text,
  transcript text,
  error_message text,
  created_at timestamptz not null default now(),
  charged_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  refunded_at timestamptz,
  constraint transcription_operations_operation_id_length check (char_length(operation_id) > 0 and char_length(operation_id) <= 200)
);

alter table public.transcription_operations enable row level security;

create table if not exists public.upload_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  operation_id text not null,
  upload_path text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint upload_tokens_token_length check (char_length(token) > 0 and char_length(token) <= 256)
);

alter table public.upload_tokens enable row level security;

insert into storage.buckets (id, name, public)
values ('transcription-uploads', 'transcription-uploads', false)
on conflict (id) do nothing;

create policy transcription_uploads_write_own_folder
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'transcription-uploads'
  and owner = auth.uid()
  and name like (auth.uid()::text || '/%')
);

