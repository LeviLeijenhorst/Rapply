alter table if exists public.coachees
  drop constraint if exists coachees_name_length;

alter table if exists public.coachee_sessions
  drop constraint if exists coachee_sessions_title_length;

alter table if exists public.session_notes
  drop constraint if exists session_notes_text_length;

alter table if exists public.session_written_reports
  drop constraint if exists session_written_reports_text_length;

create table if not exists public.e2ee_users (
  user_id uuid primary key references public.users (id) on delete cascade,
  wrapped_user_data_key_for_recovery text not null,
  recovery_key_updated_at_unix_ms bigint not null
);

create table if not exists public.e2ee_devices (
  user_id uuid not null references public.users (id) on delete cascade,
  device_id text not null,
  public_key_jwk jsonb not null,
  created_at_unix_ms bigint not null,
  pairing_expires_at_unix_ms bigint,
  approved_at_unix_ms bigint,
  revoked_at_unix_ms bigint,
  primary key (user_id, device_id)
);

create index if not exists e2ee_devices_user_id_idx on public.e2ee_devices (user_id);

create table if not exists public.e2ee_device_keys (
  user_id uuid not null,
  device_id text not null,
  wrapped_user_data_key_for_device text,
  updated_at_unix_ms bigint not null,
  primary key (user_id, device_id),
  constraint e2ee_device_keys_device_fk foreign key (user_id, device_id) references public.e2ee_devices (user_id, device_id) on delete cascade
);
