import { readManualPricingContextForUser } from "../../billing/manualPricing"
import { isMollieConfigured, syncMollieSubscriptionForUser } from "../../billing/mollie"

export type TranscriptionChargeContext = {
  cycleStartMs: number | null
  cycleEndMs: number | null
  includedSecondsOverride: number | null
  freeSecondsOverride: number | null
}

// Reads the billing context used for charging transcription seconds.
export async function readTranscriptionChargeContext(params: { userId: string }): Promise<TranscriptionChargeContext> {
  const useMollie = isMollieConfigured()
  if (useMollie) {
    await syncMollieSubscriptionForUser(params.userId)
  }

  const manualPricing = await readManualPricingContextForUser(params.userId)
  const useManualCycle =
    useMollie ||
    manualPricing.includedSecondsPerCycle > 0 ||
    manualPricing.planId != null ||
    manualPricing.customMonthlyPrice != null
  const hasDashboardMinutesConfigured = manualPricing.planId != null || manualPricing.includedSecondsPerCycle > 0
  const freeSecondsOverride = hasDashboardMinutesConfigured ? 0 : null

  return {
    cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : null,
    cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : null,
    includedSecondsOverride: useManualCycle ? manualPricing.includedSecondsPerCycle : null,
    freeSecondsOverride,
  }
}
