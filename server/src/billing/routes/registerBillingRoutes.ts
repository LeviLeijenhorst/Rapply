import type { Express, RequestHandler } from "express"
import { requireAuthenticatedUser } from "../../identity/auth"
import { asyncHandler, sendError } from "../../http"
import { readManualPricingContextForUser } from "../manualPricing"
import {
  cancelMollieSubscriptionForUser,
  createMollieExtraMinutesCheckout,
  createMolliePlanCheckout,
  isMollieConfigured,
  syncMollieSubscriptionForUser,
  syncRecentMolliePaymentsForUser,
} from "../mollie"
import { ensureBillingUser, readBillingStatus } from "../store"

type RegisterBillingRoutesParams = {
  rateLimitBilling: RequestHandler
}

type BillingStatusResponse = {
  includedSeconds: number
  cycleUsedSeconds: number
  nonExpiringTotalSeconds: number
  nonExpiringUsedSeconds: number
}

type BillingSnapshot = {
  cycleStartMs: number | null
  cycleEndMs: number | null
  billingStatus: BillingStatusResponse
}

async function syncMollieDataIfConfigured(userId: string): Promise<boolean> {
  const useMollie = isMollieConfigured()
  if (!useMollie) return false
  try {
    await syncRecentMolliePaymentsForUser(userId)
    await syncMollieSubscriptionForUser(userId)
  } catch (error: any) {
    const message = String(error?.message || error || "")
    console.warn("[billing] mollie sync failed; continuing with existing billing state", { userId, message })
  }
  return true
}

async function readBillingSnapshotForUser(userId: string): Promise<BillingSnapshot> {
  await ensureBillingUser(userId)
  const useMollie = await syncMollieDataIfConfigured(userId)
  const manualPricing = await readManualPricingContextForUser(userId)
  const useManualCycle =
    useMollie ||
    manualPricing.includedSecondsPerCycle > 0 ||
    manualPricing.planId != null ||
    manualPricing.customMonthlyPrice != null
  const hasDashboardMinutesConfigured = manualPricing.planId != null || manualPricing.includedSecondsPerCycle > 0
  const freeSecondsOverride = hasDashboardMinutesConfigured ? 0 : null

  const status = await readBillingStatus({
    userId,
    planKey: null,
    cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : null,
    cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : null,
    includedSecondsOverride: useManualCycle ? manualPricing.includedSecondsPerCycle : null,
    freeSecondsOverride,
  })

  return {
    cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : null,
    cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : null,
    billingStatus: {
      includedSeconds: status.includedSeconds,
      cycleUsedSeconds: status.cycleUsedSeconds,
      nonExpiringTotalSeconds: status.nonExpiringTotalSeconds,
      nonExpiringUsedSeconds: status.nonExpiringUsedSeconds,
    },
  }
}

export function registerBillingRoutes(app: Express, params: RegisterBillingRoutesParams): void {
  app.post(
    "/billing/status",
    params.rateLimitBilling,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const snapshot = await readBillingSnapshotForUser(user.userId)
      res.status(200).json({
        planKey: null,
        cycleStartMs: snapshot.cycleStartMs,
        cycleEndMs: snapshot.cycleEndMs,
        billingStatus: snapshot.billingStatus,
      })
    }),
  )

  app.post(
    "/billing/sync",
    params.rateLimitBilling,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const snapshot = await readBillingSnapshotForUser(user.userId)
      res.status(200).json({
        ok: true,
        planKey: null,
        cycleStartMs: snapshot.cycleStartMs,
        cycleEndMs: snapshot.cycleEndMs,
        billingStatus: snapshot.billingStatus,
      })
    }),
  )

  app.post(
    "/billing/mollie/create-checkout",
    params.rateLimitBilling,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const planId = typeof req.body?.planId === "string" ? req.body.planId.trim() : ""
      if (!planId) {
        sendError(res, 400, "Missing planId")
        return
      }
      if (!isMollieConfigured()) {
        sendError(res, 503, "Mollie is not configured")
        return
      }

      const manualPricing = await readManualPricingContextForUser(user.userId)
      if (!manualPricing.canSeePricingPage) {
        sendError(res, 403, "Pricing page is unavailable for this account")
        return
      }

      await syncMollieDataIfConfigured(user.userId)
      const result = await createMolliePlanCheckout({
        userId: user.userId,
        email: user.email,
        displayName: user.displayName,
        planId,
      })
      res.status(200).json({ ok: true, checkoutUrl: result.checkoutUrl, paymentId: result.paymentId, requiresRedirect: result.requiresRedirect })
    }),
  )

  app.post(
    "/billing/mollie/create-extra-minutes-checkout",
    params.rateLimitBilling,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      if (!isMollieConfigured()) {
        sendError(res, 503, "Mollie is not configured")
        return
      }

      const manualPricing = await readManualPricingContextForUser(user.userId)
      if (!manualPricing.canSeePricingPage) {
        sendError(res, 403, "Pricing page is unavailable for this account")
        return
      }

      await syncMollieDataIfConfigured(user.userId)
      const result = await createMollieExtraMinutesCheckout({
        userId: user.userId,
        email: user.email,
        displayName: user.displayName,
      })
      res.status(200).json({ ok: true, checkoutUrl: result.checkoutUrl, paymentId: result.paymentId, requiresRedirect: result.requiresRedirect })
    }),
  )

  app.post(
    "/billing/mollie/cancel-subscription",
    params.rateLimitBilling,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      if (!isMollieConfigured()) {
        res.status(200).json({ ok: true, canceled: false })
        return
      }
      const result = await cancelMollieSubscriptionForUser(user.userId)
      res.status(200).json({ ok: true, canceled: result.canceled })
    }),
  )
}
