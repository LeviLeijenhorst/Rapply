import express, { type Express, type RequestHandler } from "express"
import { requireAuthenticatedUser } from "../auth"
import { cancelMollieSubscriptionForUser, createMolliePlanCheckout, isMollieConfigured, processMolliePaymentWebhook, syncMollieSubscriptionForUser } from "../billing/mollie"
import { derivePlanStateFromRevenueCatSubscriber, derivePurchasedSecondsFromRevenueCatSubscriber, fetchRevenueCatSubscriber } from "../billing/revenuecat"
import { readManualPricingContextForUser } from "../billing/manualPricing"
import { ensureBillingUser, readBillingStatus } from "../billing/store"
import { execute, queryOne } from "../db"
import { asyncHandler, sendError } from "../http"
import { applyEmailBillingOverrides } from "./billingOverrides"

type RegisterBillingRoutesParams = {
  rateLimitBilling: RequestHandler
}

// Registers billing synchronization and current status endpoints.
export function registerBillingRoutes(app: Express, params: RegisterBillingRoutesParams): void {
  app.post(
    "/billing/mollie/webhook",
    express.urlencoded({ extended: false }),
    asyncHandler(async (req, res) => {
      const paymentId = typeof req.body?.id === "string" ? req.body.id.trim() : ""
      if (!paymentId) {
        sendError(res, 400, "Missing Mollie payment id")
        return
      }

      try {
        await processMolliePaymentWebhook(paymentId)
      } catch (error: any) {
        const message = String(error?.message || error || "")
        console.log("[billing:mollie:webhook] failed", { paymentId, message })
      }

      res.status(200).send("ok")
    }),
  )

  app.post(
    "/billing/mollie/create-checkout",
    params.rateLimitBilling,
    asyncHandler(async (req, res) => {
      if (!isMollieConfigured()) {
        sendError(res, 400, "Mollie is not configured")
        return
      }

      const user = await requireAuthenticatedUser(req)
      const planId = typeof req.body?.planId === "string" ? req.body.planId.trim() : ""
      if (!planId) {
        sendError(res, 400, "Missing planId")
        return
      }

      const plan = await queryOne<{ id: string }>(
        `
        select id
        from public.plans
        where id = $1 and is_active = true
        limit 1
        `,
        [planId],
      )
      if (!plan?.id) {
        sendError(res, 404, "Plan not found")
        return
      }

      const checkout = await createMolliePlanCheckout({
        userId: user.userId,
        email: user.email,
        displayName: user.displayName,
        planId: plan.id,
      })

      res.status(200).json({
        ok: true,
        checkoutUrl: checkout.checkoutUrl,
        paymentId: checkout.paymentId,
      })
    }),
  )

  app.post(
    "/billing/mollie/cancel-subscription",
    params.rateLimitBilling,
    asyncHandler(async (req, res) => {
      if (!isMollieConfigured()) {
        sendError(res, 400, "Mollie is not configured")
        return
      }
      const user = await requireAuthenticatedUser(req)
      const result = await cancelMollieSubscriptionForUser(user.userId)
      res.status(200).json({ ok: true, canceled: result.canceled })
    }),
  )

  app.post(
    "/billing/sync",
    params.rateLimitBilling,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)

      await ensureBillingUser(user.userId)

      const useMollie = isMollieConfigured()
      if (useMollie) {
        await syncMollieSubscriptionForUser(user.userId)
      }

      const subscriber = useMollie ? {} : await fetchRevenueCatSubscriber(user.userId)
      const planState = useMollie ? { planKey: null, cycleStartMs: null, cycleEndMs: null } : derivePlanStateFromRevenueCatSubscriber(subscriber)
      const purchasedSecondsFromRevenueCat = useMollie ? 0 : derivePurchasedSecondsFromRevenueCatSubscriber(subscriber)
      const manualPricing = await readManualPricingContextForUser(user.userId)
      const useManualCycle = useMollie || manualPricing.includedSecondsPerCycle > 0 || manualPricing.planId != null || manualPricing.customMonthlyPrice != null
      const hasDashboardMinutesConfigured = manualPricing.planId != null || manualPricing.includedSecondsPerCycle > 0
      const freeSecondsOverride = hasDashboardMinutesConfigured ? 0 : null

      if (!useMollie) {
        await execute(`update public.billing_users set purchased_seconds = $1, updated_at = now() where user_id = $2`, [purchasedSecondsFromRevenueCat, user.userId])
      }

      const billingStatusRaw = await readBillingStatus({
        userId: user.userId,
        planKey: useManualCycle ? null : planState.planKey,
        cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : planState.cycleStartMs,
        cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : planState.cycleEndMs,
        includedSecondsOverride: useManualCycle ? manualPricing.includedSecondsPerCycle : null,
        freeSecondsOverride,
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

      const useMollie = isMollieConfigured()
      if (useMollie) {
        await syncMollieSubscriptionForUser(user.userId)
      }

      const subscriber = useMollie ? {} : await fetchRevenueCatSubscriber(user.userId)
      const planState = useMollie ? { planKey: null, cycleStartMs: null, cycleEndMs: null } : derivePlanStateFromRevenueCatSubscriber(subscriber)
      const manualPricing = await readManualPricingContextForUser(user.userId)
      const useManualCycle = useMollie || manualPricing.includedSecondsPerCycle > 0 || manualPricing.planId != null || manualPricing.customMonthlyPrice != null
      const hasDashboardMinutesConfigured = manualPricing.planId != null || manualPricing.includedSecondsPerCycle > 0
      const freeSecondsOverride = hasDashboardMinutesConfigured ? 0 : null
      const billingStatusRaw = await readBillingStatus({
        userId: user.userId,
        planKey: useManualCycle ? null : planState.planKey,
        cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : planState.cycleStartMs,
        cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : planState.cycleEndMs,
        includedSecondsOverride: useManualCycle ? manualPricing.includedSecondsPerCycle : null,
        freeSecondsOverride,
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
