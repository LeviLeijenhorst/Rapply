import { callSecureApi } from '../core/secureApi'

export async function listAdminContactSubmissions(limit = 200) {
  return callSecureApi('/admin/contact-submissions/list', { limit })
}

export async function listAdminWachtlijst(limit = 200) {
  return callSecureApi('/admin/wachtlijst/list', { limit })
}

export async function listAdminPlans() {
  return callSecureApi('/admin/plans/list', {})
}

export async function listAdminUsers() {
  return callSecureApi('/admin/users/list', {})
}

export async function listAdminFeedback(limit = 200) {
  return callSecureApi('/admin/feedback/list', { limit })
}

export async function getAdminTranscriptionMode() {
  return callSecureApi('/admin/transcription/mode/get', {})
}

export async function setAdminTranscriptionMode(settings: { mode?: string; provider?: string }) {
  return callSecureApi('/admin/transcription/mode/set', settings)
}

export async function getAdminAnalyticsOverview(days = 30) {
  return callSecureApi('/admin/analytics/overview', { days })
}

export async function listAccountAllowlist() {
  return callSecureApi('/admin/account-allowlist/list', {})
}

export async function addAccountAllowlistEmail(email: string) {
  return callSecureApi('/admin/account-allowlist/add', { email })
}

export async function removeAccountAllowlistEmail(email: string) {
  return callSecureApi('/admin/account-allowlist/remove', { email })
}

export async function upsertAdminPlan(payload: {
  id: string
  name: string
  description: string
  monthlyPrice: number
  minutesPerMonth: number
  isActive: boolean
  displayOrder: number
}) {
  return callSecureApi('/admin/plans/upsert', payload)
}

export async function updateAdminUserPricingControls(payload: {
  userId: string
  planId: string | null
  customMonthlyPrice: number | null
  extraMinutes: number
  accountType: 'admin' | 'paid' | 'test'
  isAllowlisted: boolean
  canSeePricingPage: boolean
  pilotFlag: boolean
  adminNotes: string
}) {
  return callSecureApi('/admin/users/update-pricing-controls', payload)
}

export async function addAdminUserMonthlyMinutes(payload: { userId: string; additionalMinutes: number }) {
  return callSecureApi('/admin/users/add-monthly-minutes', payload)
}

