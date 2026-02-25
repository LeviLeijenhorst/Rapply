alter table public.e2ee_user_keys
  add column if not exists custody_mode text not null default 'user_managed';

alter table public.e2ee_user_keys
  add column if not exists wrapped_ark_server_kms text;

alter table public.e2ee_user_keys
  alter column argon2_salt drop not null,
  alter column argon2_time_cost drop not null,
  alter column argon2_memory_cost_kib drop not null,
  alter column argon2_parallelism drop not null,
  alter column wrapped_ark_user_passphrase drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'e2ee_user_keys_custody_mode_check'
  ) then
    alter table public.e2ee_user_keys
      add constraint e2ee_user_keys_custody_mode_check
      check (custody_mode in ('server_managed', 'user_managed'));
  end if;
end
$$;
