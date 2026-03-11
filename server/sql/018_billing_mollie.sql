create table if not exists public.billing_customers (
  organization_id text primary key references public.organizations (id) on delete cascade,
  mollie_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_customers_mollie_customer_id_length check (char_length(mollie_customer_id) > 0 and char_length(mollie_customer_id) <= 200)
);

create table if not exists public.billing_subscriptions (
  organization_id text primary key references public.organizations (id) on delete cascade,
  mollie_customer_id text not null,
  mollie_subscription_id text not null unique,
  status text not null,
  plan_key text,
  current_period_start_at timestamptz,
  current_period_end_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_subscriptions_status_length check (char_length(status) > 0 and char_length(status) <= 80),
  constraint billing_subscriptions_plan_key_length check (plan_key is null or char_length(plan_key) <= 120),
  constraint billing_subscriptions_mollie_customer_id_length check (char_length(mollie_customer_id) > 0 and char_length(mollie_customer_id) <= 200),
  constraint billing_subscriptions_mollie_subscription_id_length check (char_length(mollie_subscription_id) > 0 and char_length(mollie_subscription_id) <= 200)
);

create index if not exists billing_subscriptions_status_idx on public.billing_subscriptions (status);

create table if not exists public.billing_payments (
  id text primary key,
  organization_id text references public.organizations (id) on delete set null,
  mollie_payment_id text not null unique,
  status text not null,
  amount_value numeric(10,2),
  amount_currency text,
  description text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_payments_status_length check (char_length(status) > 0 and char_length(status) <= 80),
  constraint billing_payments_amount_currency_length check (amount_currency is null or char_length(amount_currency) <= 10),
  constraint billing_payments_mollie_payment_id_length check (char_length(mollie_payment_id) > 0 and char_length(mollie_payment_id) <= 200)
);

create index if not exists billing_payments_organization_id_idx on public.billing_payments (organization_id);
create index if not exists billing_payments_status_idx on public.billing_payments (status);
