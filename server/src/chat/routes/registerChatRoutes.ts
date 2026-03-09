import type { Express, RequestHandler } from "express"
import { normalizeText } from "../../ai/shared/normalize"
import { requireAuthenticatedUser } from "../../auth"
import { readManualPricingContextForUser } from "../../billing/manualPricing"
import { isMollieConfigured, syncMollieSubscriptionForUser, syncRecentMolliePaymentsForUser } from "../../billing/mollie"
import { ensureBillingUser, readBillingStatus } from "../../billing/store"
import { completeChatWithAzureOpenAi } from "../../chat/azureOpenAiChat"
import { asyncHandler, sendError } from "../../http"

type RegisterChatRoutesParams = {
  rateLimitAi: RequestHandler
}

export function registerChatRoutes(app: Express, params: RegisterChatRoutesParams): void {
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

      const manualPricing = await readManualPricingContextForUser(user.userId)
      const useManualCycle = useMollie || manualPricing.includedSecondsPerCycle > 0 || manualPricing.planId != null || manualPricing.customMonthlyPrice != null
      const hasDashboardMinutesConfigured = manualPricing.planId != null || manualPricing.includedSecondsPerCycle > 0
      const freeSecondsOverride = hasDashboardMinutesConfigured ? 0 : null
      const billingStatus = await readBillingStatus({
        userId: user.userId,
        planKey: null,
        cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : null,
        cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : null,
        includedSecondsOverride: useManualCycle ? manualPricing.includedSecondsPerCycle : null,
        freeSecondsOverride,
      })
      if (billingStatus.remainingSeconds <= 0) {
        sendError(res, 402, "U heeft geen minuten meer. Ga naar Mijn abonnement om extra minuten toe te voegen.")
        return
      }

      const messages = req.body?.messages
      const temperature = req.body?.temperature
      const scope = req.body?.scope
      const sessionId = normalizeText(req.body?.sessionId) || undefined

      const text = await completeChatWithAzureOpenAi({ messages, temperature, scope, sessionId })
      res.status(200).json({ text })
    }),
  )
}
