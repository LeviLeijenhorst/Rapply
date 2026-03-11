import { callSecureApi } from '../secureApi'

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
  requiresRedirect?: boolean
}

export async function fetchBillingStatus(): Promise<BillingStatusResponse> {
  return callSecureApi<BillingStatusResponse>('/billing/status', {})
}

export async function createMollieCheckout(planId: string): Promise<MollieCheckoutResponse> {
  return callSecureApi<MollieCheckoutResponse>('/billing/mollie/create-checkout', { planId })
}

export async function createMollieExtraMinutesCheckout(): Promise<MollieCheckoutResponse> {
  return callSecureApi<MollieCheckoutResponse>('/billing/mollie/create-extra-minutes-checkout', {})
}

export async function cancelMollieSubscription(): Promise<{ ok: boolean; canceled: boolean }> {
  return callSecureApi<{ ok: boolean; canceled: boolean }>('/billing/mollie/cancel-subscription', {})
}

