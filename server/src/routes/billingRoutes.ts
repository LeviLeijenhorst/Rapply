import type { Express, RequestHandler } from "express"
import { requireAuthenticatedUser } from "../auth"
import { derivePlanStateFromRevenueCatSubscriber, derivePurchasedSecondsFromRevenueCatSubscriber, fetchRevenueCatSubscriber } from "../billing/revenuecat"
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

      await execute(`update public.billing_users set purchased_seconds = $1, updated_at = now() where user_id = $2`, [purchasedSecondsFromRevenueCat, user.userId])

      const billingStatusRaw = await readBillingStatus({
        userId: user.userId,
        planKey: planState.planKey,
        cycleStartMs: planState.cycleStartMs,
        cycleEndMs: planState.cycleEndMs,
      })
      const billingStatus = applyEmailBillingOverrides(billingStatusRaw, user.email)

      res.status(200).json({
        ok: true,
        planKey: planState.planKey,
        cycleStartMs: planState.cycleStartMs,
        cycleEndMs: planState.cycleEndMs,
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
      const billingStatusRaw = await readBillingStatus({
        userId: user.userId,
        planKey: planState.planKey,
        cycleStartMs: planState.cycleStartMs,
        cycleEndMs: planState.cycleEndMs,
      })
      const billingStatus = applyEmailBillingOverrides(billingStatusRaw, user.email)

      res.status(200).json({
        planKey: planState.planKey,
        cycleStartMs: planState.cycleStartMs,
        cycleEndMs: planState.cycleEndMs,
        billingStatus,
      })
    }),
  )
}
