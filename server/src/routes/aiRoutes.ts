import type { Express, RequestHandler } from "express"
import { requireAuthenticatedUser } from "../auth"
import { readManualPricingContextForUser } from "../billing/manualPricing"
import { isMollieConfigured, syncMollieSubscriptionForUser, syncRecentMolliePaymentsForUser } from "../billing/mollie"
import { derivePlanStateFromRevenueCatSubscriber, fetchRevenueCatSubscriber } from "../billing/revenuecat"
import { ensureBillingUser, readBillingStatus } from "../billing/store"
import { completeChatWithAzureOpenAi } from "../chat/azureOpenAiChat"
import { asyncHandler, sendError } from "../http"
import { generateSummary } from "../summary/summary"
import { applyEmailBillingOverrides } from "./billingOverrides"
import { readSummaryTemplate } from "./requestParsers"

type RegisterAiRoutesParams = {
  rateLimitAi: RequestHandler
}

// Registers AI endpoints for chat completions and summary generation.
export function registerAiRoutes(app: Express, params: RegisterAiRoutesParams): void {
  app.post(
    "/chat",
    params.rateLimitAi,
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
          console.warn("[ai:chat] mollie sync failed; continuing with existing billing state", {
            userId: user.userId,
            message,
          })
        }
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
      if (billingStatus.remainingSeconds <= 0) {
        sendError(res, 402, "U heeft geen minuten meer. Ga naar Mijn abonnement om extra minuten toe te voegen.")
        return
      }

      const messages = req.body?.messages
      const temperature = req.body?.temperature
      const scope = req.body?.scope
      const sessionId = req.body?.sessionId

      const text = await completeChatWithAzureOpenAi({ messages, temperature, scope, sessionId })
      res.status(200).json({ text })
    }),
  )

  app.post(
    "/summary/generate",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)

      const transcript = typeof req.body?.transcript === "string" ? req.body.transcript : ""
      const template = readSummaryTemplate(req.body?.template)

      if (!String(transcript || "").trim()) {
        sendError(res, 400, "Missing transcript")
        return
      }

      const summary = await generateSummary({ transcript, template })
      res.status(200).json({ summary })
    }),
  )
}
