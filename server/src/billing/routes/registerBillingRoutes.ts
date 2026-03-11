import type { Express, RequestHandler } from "express"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"

type RegisterBillingRoutesParams = {
  rateLimitBilling: RequestHandler
}

const defaultBillingStatus = {
  includedSeconds: 0,
  cycleUsedSeconds: 0,
  nonExpiringTotalSeconds: 0,
  nonExpiringUsedSeconds: 0,
}

export function registerBillingRoutes(app: Express, params: RegisterBillingRoutesParams): void {
  app.post(
    "/billing/status",
    params.rateLimitBilling,
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      res.status(200).json({
        planKey: null,
        cycleStartMs: null,
        cycleEndMs: null,
        billingStatus: defaultBillingStatus,
      })
    }),
  )

  app.post(
    "/billing/sync",
    params.rateLimitBilling,
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      res.status(200).json({
        ok: true,
        planKey: null,
        cycleStartMs: null,
        cycleEndMs: null,
        billingStatus: defaultBillingStatus,
      })
    }),
  )

  app.post(
    "/billing/mollie/create-checkout",
    params.rateLimitBilling,
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      res.status(200).json({ ok: false, checkoutUrl: "", paymentId: "", requiresRedirect: false })
    }),
  )

  app.post(
    "/billing/mollie/create-extra-minutes-checkout",
    params.rateLimitBilling,
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      res.status(200).json({ ok: false, checkoutUrl: "", paymentId: "", requiresRedirect: false })
    }),
  )

  app.post(
    "/billing/mollie/cancel-subscription",
    params.rateLimitBilling,
    asyncHandler(async (_req, res) => {
      res.status(200).json({ ok: true, canceled: false })
    }),
  )
}
