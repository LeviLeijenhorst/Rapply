create table if not exists public.e2ee_user_keys (
  user_id uuid primary key references public.users (id) on delete cascade,
  crypto_version integer not null default 1,
  key_version integer not null default 1,
  argon2_salt text not null,
  argon2_time_cost integer not null,
  argon2_memory_cost_kib integer not null,
  argon2_parallelism integer not null,
  wrapped_ark_user_passphrase text not null,
  wrapped_ark_recovery_code text,
  recovery_policy text not null default 'self_service',
  custodian_threshold integer,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint e2ee_user_keys_recovery_policy_check check (recovery_policy in ('self_service', 'custodian_only', 'hybrid'))
);

create table if not exists public.e2ee_object_keys (
  user_id uuid not null references public.users (id) on delete cascade,
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
