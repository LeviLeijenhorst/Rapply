import type { Express, RequestHandler } from "express"
import { requireAuthenticatedUser } from "../auth"
import { derivePlanStateFromRevenueCatSubscriber, derivePurchasedSecondsFromRevenueCatSubscriber, fetchRevenueCatSubscriber } from "../billing/revenuecat"
import { readManualPricingContextForUser } from "../billing/manualPricing"
import { ensureBillingUser, readBillingStatus } from "../billing/store"
import { execute } from "../db"
import { asyncHandler } from "../http"
import { applyEmailBillingOverrides } from "./billingOverrides"

type RegisterBillingRoutesParams = {
  rateLimitBilling: RequestHandler
}

// Registers billing synchronization and current status endpoints.
export function registerBillingRoutes(app: Express, params: RegisterBillingRoutesParams): void {
  app.post(
    "/billing/sync",
    params.rateLimitBilling,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)

      await ensureBillingUser(user.userId)

      const subscriber = await fetchRevenueCatSubscriber(user.userId)
      const planState = derivePlanStateFromRevenueCatSubscriber(subscriber)
      const purchasedSecondsFromRevenueCat = derivePurchasedSecondsFromRevenueCatSubscriber(subscriber)
      const manualPricing = await readManualPricingContextForUser(user.userId)
      const useManualCycle = manualPricing.includedSecondsPerCycle > 0 || manualPricing.planId != null || manualPricing.customMonthlyPrice != null

      await execute(`update public.billing_users set purchased_seconds = $1, updated_at = now() where user_id = $2`, [purchasedSecondsFromRevenueCat, user.userId])

      const billingStatusRaw = await readBillingStatus({
        userId: user.userId,
        planKey: useManualCycle ? null : planState.planKey,
        cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : planState.cycleStartMs,
        cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : planState.cycleEndMs,
        includedSecondsOverride: useManualCycle ? manualPricing.includedSecondsPerCycle : null,
      })
      const billingStatus = applyEmailBillingOverrides(billingStatusRaw, user.email)

      res.status(200).json({
        ok: true,
        planKey: useManualCycle ? null : planState.planKey,
        cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : planState.cycleStartMs,
        cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : planState.cycleEndMs,
        billingStatus,
      })
    }),
  )

  app.post(
    "/billing/status",
    params.rateLimitBilling,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)

      await ensureBillingUser(user.userId)

      const subscriber = await fetchRevenueCatSubscriber(user.userId)
      const planState = derivePlanStateFromRevenueCatSubscriber(subscriber)
      const manualPricing = await readManualPricingContextForUser(user.userId)
      const useManualCycle = manualPricing.includedSecondsPerCycle > 0 || manualPricing.planId != null || manualPricing.customMonthlyPrice != null
      const billingStatusRaw = await readBillingStatus({
        userId: user.userId,
        planKey: useManualCycle ? null : planState.planKey,
        cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : planState.cycleStartMs,
        cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : planState.cycleEndMs,
        includedSecondsOverride: useManualCycle ? manualPricing.includedSecondsPerCycle : null,
      })
      const billingStatus = applyEmailBillingOverrides(billingStatusRaw, user.email)

      res.status(200).json({
        planKey: useManualCycle ? null : planState.planKey,
        cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : planState.cycleStartMs,
        cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : planState.cycleEndMs,
        billingStatus,
      })
    }),
  )
}
