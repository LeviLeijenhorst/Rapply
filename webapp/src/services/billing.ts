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

export type MollieCheckoutResponse = {
  ok: boolean
  checkoutUrl: string
  paymentId: string
}

export async function fetchBillingStatus(): Promise<BillingStatusResponse> {
  return callSecureApi<BillingStatusResponse>('/billing/status', {})
}

export async function createMollieCheckout(planId: string): Promise<MollieCheckoutResponse> {
  return callSecureApi<MollieCheckoutResponse>('/billing/mollie/create-checkout', { planId })
}
