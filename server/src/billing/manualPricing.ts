import { execute, queryOne } from "../db"

export type ManualPricingContext = {
  planId: string | null
  customMonthlyPrice: number | null
  canSeePricingPage: boolean
  includedSecondsPerCycle: number
  cycleStartMs: number
  cycleEndMs: number
}

type ManualPricingRow = {
  plan_id: string | null
  custom_monthly_price: string | null
  extra_minutes: number
  account_type: "admin" | "paid" | "test"
  can_see_pricing_page: boolean
  plan_minutes_per_month: number | null
}

let ensureManualPricingSchemaPromise: Promise<void> | null = null

export async function ensureManualPricingSchema(): Promise<void> {
  if (!ensureManualPricingSchemaPromise) {
    ensureManualPricingSchemaPromise = execute(
      `
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
        constraint plans_name_length check (char_length(name) > 0 and char_length(name) <= 200),
        constraint plans_monthly_price_non_negative check (monthly_price >= 0),
        constraint plans_minutes_non_negative check (minutes_per_month >= 0)
      );

      create index if not exists plans_active_order_idx on public.plans (is_active, display_order asc, created_at asc);

      alter table public.users
        add column if not exists plan_id uuid references public.plans (id),
        add column if not exists custom_monthly_price numeric(10, 2),
        add column if not exists extra_minutes integer not null default 0,
        add column if not exists can_see_pricing_page boolean not null default true;

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
          where conname = 'users_custom_monthly_price_non_negative'
        ) then
          alter table public.users
            add constraint users_custom_monthly_price_non_negative
            check (custom_monthly_price is null or custom_monthly_price >= 0);
        end if;
      end
      $$;

      insert into public.plans (
        id,
        name,
        description,
        monthly_price,
        minutes_per_month,
        is_active,
        display_order,
        created_at,
        updated_at
      )
      select
        '11111111-1111-1111-1111-111111111111'::uuid,
        'Abonnement',
        null,
        85.00,
        3000,
        true,
        0,
        now(),
        now()
      where not exists (
        select 1
        from public.plans
        where is_active = true
          and monthly_price > 0
          and minutes_per_month > 0
      );
      `,
      [],
    ).catch((error) => {
      ensureManualPricingSchemaPromise = null
      throw error
    })
  }

  await ensureManualPricingSchemaPromise
}

function getCurrentUtcMonthCycleWindow(nowMs: number = Date.now()): { cycleStartMs: number; cycleEndMs: number } {
  const now = new Date(nowMs)
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const cycleStartMs = Date.UTC(year, month, 1, 0, 0, 0, 0)
  const cycleEndMs = Date.UTC(year, month + 1, 1, 0, 0, 0, 0)
  return { cycleStartMs, cycleEndMs }
}

export async function readManualPricingContextForUser(userId: string): Promise<ManualPricingContext> {
  await ensureManualPricingSchema()

  const row = await queryOne<ManualPricingRow>(
    `
    select
      u.plan_id,
      u.custom_monthly_price,
      coalesce(u.extra_minutes, 0) as extra_minutes,
      u.account_type,
      coalesce(u.can_see_pricing_page, true) as can_see_pricing_page,
      p.minutes_per_month as plan_minutes_per_month
    from public.users u
    left join public.plans p on p.id = u.plan_id
    where u.id = $1
    limit 1
    `,
    [userId],
  )

  const includedMinutes = Math.max(0, Number(row?.plan_minutes_per_month || 0) + Number(row?.extra_minutes || 0))
  const { cycleStartMs, cycleEndMs } = getCurrentUtcMonthCycleWindow()
  const canSeePricingPage = Boolean(row && row.account_type !== "test" && row.can_see_pricing_page)

  return {
    planId: row?.plan_id ?? null,
    customMonthlyPrice: row?.custom_monthly_price == null ? null : Number(row.custom_monthly_price),
    canSeePricingPage,
    includedSecondsPerCycle: includedMinutes * 60,
    cycleStartMs,
    cycleEndMs,
  }
}
