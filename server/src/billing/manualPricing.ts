import { queryOne } from "../db"

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

function getCurrentUtcMonthCycleWindow(nowMs: number = Date.now()): { cycleStartMs: number; cycleEndMs: number } {
  const now = new Date(nowMs)
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const cycleStartMs = Date.UTC(year, month, 1, 0, 0, 0, 0)
  const cycleEndMs = Date.UTC(year, month + 1, 1, 0, 0, 0, 0)
  return { cycleStartMs, cycleEndMs }
}

export async function readManualPricingContextForUser(userId: string): Promise<ManualPricingContext> {
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

