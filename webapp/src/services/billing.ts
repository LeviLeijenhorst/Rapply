import { callSecureApi } from './secureApi'

export type BillingStatus = {
  includedSeconds: number
  cycleUsedSeconds: number
  nonExpiringTotalSeconds: number
  nonExpiringUsedSeconds: number
}

export type BillingStatusResponse = {
  billingStatus: BillingStatus | null
}

export async function fetchBillingStatus(): Promise<BillingStatusResponse> {
  return callSecureApi<BillingStatusResponse>('/billing/status', {})
}
