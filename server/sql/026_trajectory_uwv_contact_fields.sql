alter table public.trajectories
  add column if not exists uwv_contact_name text,
  add column if not exists uwv_contact_phone text,
  add column if not exists uwv_contact_email text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'trajectories_uwv_contact_name_length') then
    alter table public.trajectories
      add constraint trajectories_uwv_contact_name_length check (uwv_contact_name is null or char_length(uwv_contact_name) <= 200);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'trajectories_uwv_contact_phone_length') then
    alter table public.trajectories
      add constraint trajectories_uwv_contact_phone_length check (uwv_contact_phone is null or char_length(uwv_contact_phone) <= 80);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'trajectories_uwv_contact_email_length') then
    alter table public.trajectories
      add constraint trajectories_uwv_contact_email_length check (uwv_contact_email is null or char_length(uwv_contact_email) <= 200);
  end if;
end $$;

