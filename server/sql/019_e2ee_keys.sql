create table if not exists public.e2ee_user_keys (
  user_id text primary key references public.users (id) on delete cascade,
  crypto_version integer not null default 1,
  key_version integer not null default 1,
  argon2_salt text,
  argon2_time_cost integer,
  argon2_memory_cost_kib integer,
  argon2_parallelism integer,
  wrapped_ark_user_passphrase text,
  wrapped_ark_recovery_code text,
  wrapped_ark_server_kms text,
  recovery_policy text not null default 'self_service',
  custody_mode text not null default 'server_managed',
  custodian_threshold integer,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint e2ee_user_keys_recovery_policy_check check (recovery_policy in ('self_service', 'custodian_only', 'hybrid')),
  constraint e2ee_user_keys_custody_mode_check check (custody_mode in ('server_managed', 'user_managed'))
);

create table if not exists public.e2ee_object_keys (
  user_id text not null references public.users (id) on delete cascade,
  object_type text not null,
  object_id text not null,
  key_version integer not null,
  crypto_version integer not null default 1,
  wrapped_dek text not null,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  primary key (user_id, object_type, object_id, key_version)
);

create index if not exists e2ee_object_keys_user_object_idx on public.e2ee_object_keys (user_id, object_type, object_id);
