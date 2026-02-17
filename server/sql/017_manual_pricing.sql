create table if not exists public.plans (
  id uuid primary key,
  name text not null,
  description text,
  monthly_price numeric(10, 2) not null,
  minutes_per_month integer not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plans_name_length check (char_length(name) > 0 and char_length(name) <= 120),
  constraint plans_description_length check (description is null or char_length(description) <= 2000),
  constraint plans_monthly_price_non_negative check (monthly_price >= 0),
  constraint plans_minutes_per_month_non_negative check (minutes_per_month >= 0)
);

create index if not exists plans_active_order_idx on public.plans (is_active, display_order asc, created_at asc);

alter table public.users
  add column if not exists plan_id uuid references public.plans (id),
  add column if not exists custom_monthly_price numeric(10, 2),
  add column if not exists extra_minutes integer not null default 0,
  add column if not exists account_type text not null default 'paid',
  add column if not exists is_allowlisted boolean not null default true,
  add column if not exists can_see_pricing_page boolean not null default true,
  add column if not exists admin_notes text,
  add column if not exists pilot_flag boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_extra_minutes_non_negative'
  ) then
    alter table public.users
      add constraint users_extra_minutes_non_negative check (extra_minutes >= 0);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_account_type_allowed_values'
  ) then
    alter table public.users
      add constraint users_account_type_allowed_values check (account_type in ('admin', 'paid', 'test'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_custom_monthly_price_non_negative'
  ) then
    alter table public.users
      add constraint users_custom_monthly_price_non_negative check (custom_monthly_price is null or custom_monthly_price >= 0);
  end if;
end
$$;
