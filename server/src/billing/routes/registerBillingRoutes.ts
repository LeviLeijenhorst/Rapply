import express, { type Express, type RequestHandler } from "express"
import { requireAuthenticatedUser } from "../../auth"
import { queryOne } from "../../db"
import { asyncHandler, sendError } from "../../http"
import { readManualPricingContextForUser } from "../manualPricing"
import { cancelMollieSubscriptionForUser, changeMollieSubscriptionPlanForUser, createMollieExtraMinutesCheckout, createMolliePlanCheckout, isMollieConfigured, processMolliePaymentWebhook, syncMollieSubscriptionForUser, syncRecentMolliePaymentsForUser } from "../mollie"
import { ensureBillingUser, readBillingStatus } from "../store"

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
        console.warn("[billing:mollie:webhook] failed", { paymentId, message })
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

      const currentPricing = await readManualPricingContextForUser(user.userId)
      const currentPlanId = currentPricing.planId
      if (currentPlanId) {
        const prices = await queryOne<{ current_monthly_price: string; target_monthly_price: string }>(
          `
          select
            (select monthly_price from public.plans where id = $1 limit 1) as current_monthly_price,
            (select monthly_price from public.plans where id = $2 limit 1) as target_monthly_price
          `,
          [currentPlanId, plan.id],
        )
        const currentPrice = Number(prices?.current_monthly_price ?? NaN)
        const targetPrice = Number(prices?.target_monthly_price ?? NaN)
        const isDowngradeOrEqual = Number.isFinite(currentPrice) && Number.isFinite(targetPrice) && targetPrice <= currentPrice
        if (isDowngradeOrEqual && currentPlanId !== plan.id) {
          await changeMollieSubscriptionPlanForUser({ userId: user.userId, planId: plan.id })
          res.status(200).json({
            ok: true,
            checkoutUrl: "",
            paymentId: "",
            requiresRedirect: false,
          })
          return
        }
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
        requiresRedirect: checkout.requiresRedirect,
      })
    }),
  )

  app.post(
    "/billing/mollie/create-extra-minutes-checkout",
    params.rateLimitBilling,
    asyncHandler(async (req, res) => {
      if (!isMollieConfigured()) {
        sendError(res, 400, "Mollie is not configured")
        return
      }

      const user = await requireAuthenticatedUser(req)
      const checkout = await createMollieExtraMinutesCheckout({
        userId: user.userId,
        email: user.email,
        displayName: user.displayName,
      })

      res.status(200).json({
        ok: true,
        checkoutUrl: checkout.checkoutUrl,
        paymentId: checkout.paymentId,
        requiresRedirect: checkout.requiresRedirect,
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
        try {
          await syncRecentMolliePaymentsForUser(user.userId)
          await syncMollieSubscriptionForUser(user.userId)
        } catch (error: any) {
          const message = String(error?.message || error || "")
          console.warn("[billing:sync] mollie sync failed; continuing with existing billing state", {
            userId: user.userId,
            message,
          })
        }
      }

      const manualPricing = await readManualPricingContextForUser(user.userId)
      const useManualCycle = useMollie || manualPricing.includedSecondsPerCycle > 0 || manualPricing.planId != null || manualPricing.customMonthlyPrice != null
      const hasDashboardMinutesConfigured = manualPricing.planId != null || manualPricing.includedSecondsPerCycle > 0
      const freeSecondsOverride = hasDashboardMinutesConfigured ? 0 : null

      const billingStatusRaw = await readBillingStatus({
        userId: user.userId,
        planKey: null,
        cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : null,
        cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : null,
        includedSecondsOverride: useManualCycle ? manualPricing.includedSecondsPerCycle : null,
        freeSecondsOverride,
      })
      const billingStatus = billingStatusRaw

      res.status(200).json({
        ok: true,
        planKey: null,
        cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : null,
        cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : null,
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
        try {
          await syncRecentMolliePaymentsForUser(user.userId)
          await syncMollieSubscriptionForUser(user.userId)
        } catch (error: any) {
          const message = String(error?.message || error || "")
          console.warn("[billing:status] mollie sync failed; continuing with existing billing state", {
            userId: user.userId,
            message,
          })
        }
      }

      const manualPricing = await readManualPricingContextForUser(user.userId)
      const useManualCycle = useMollie || manualPricing.includedSecondsPerCycle > 0 || manualPricing.planId != null || manualPricing.customMonthlyPrice != null
      const hasDashboardMinutesConfigured = manualPricing.planId != null || manualPricing.includedSecondsPerCycle > 0
      const freeSecondsOverride = hasDashboardMinutesConfigured ? 0 : null
      const billingStatusRaw = await readBillingStatus({
        userId: user.userId,
        planKey: null,
        cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : null,
        cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : null,
        includedSecondsOverride: useManualCycle ? manualPricing.includedSecondsPerCycle : null,
        freeSecondsOverride,
      })
      const billingStatus = billingStatusRaw

      res.status(200).json({
        planKey: null,
        cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : null,
        cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : null,
        billingStatus,
      })
    }),
  )
}
