import { callSecureApi } from '../services/secureApi'

export async function fetchSubscriptionAccessApi() {
  return callSecureApi<{ planId?: string | null; canSeePricingPage?: boolean }>('/pricing/me-visibility', {})
}

export async function fetchCurrentUserProfileApi() {
  return callSecureApi<{
    email: string | null
    name?: string | null
    displayName?: string | null
    givenName?: string | null
    surname?: string | null
    accountType?: 'admin' | 'paid' | 'test' | null
  }>('/auth/me', {})
}

export async function deleteAccountApi() {
  return callSecureApi<{ ok: boolean }>('/account/delete', { confirmText: 'VERWIJDEREN' })
}

export async function submitFeedbackApi(message: string) {
  return callSecureApi<{ ok: true }>('/feedback', { message })
}
