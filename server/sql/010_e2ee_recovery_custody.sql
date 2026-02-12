alter table if exists public.e2ee_users
  add column if not exists recovery_custody_mode text not null default 'self';

alter table if exists public.e2ee_users
  add column if not exists escrow_reference_id text;

alter table if exists public.e2ee_users
  add column if not exists escrow_updated_at_unix_ms bigint;

alter table if exists public.e2ee_users
  drop constraint if exists e2ee_users_recovery_custody_mode_check;

alter table if exists public.e2ee_users
  add constraint e2ee_users_recovery_custody_mode_check check (recovery_custody_mode in ('self', 'escrow'));

