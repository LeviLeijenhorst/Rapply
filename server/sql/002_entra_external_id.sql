alter table public.users add column if not exists entra_user_id text;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'users'
      and indexname = 'users_entra_user_id_key'
  ) then
    create unique index users_entra_user_id_key on public.users (entra_user_id);
  end if;
end
$$;

alter table public.users alter column email drop not null;
alter table public.users drop constraint if exists users_email_key;

alter table public.users alter column password_salt drop not null;
alter table public.users alter column password_hash drop not null;

drop table if exists public.sessions;

