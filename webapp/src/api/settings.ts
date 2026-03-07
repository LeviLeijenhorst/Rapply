import { callSecureApi } from '../services/secureApi'

export type PricingPlan = {
  id: string
  name: string
  description: string | null
  monthlyPrice: number
  minutesPerMonth: number
}

export type PricingVisibility = {
  canSeePricingPage: boolean
  planId: string | null
}

export async function submitContactSubmission(params: {
  name: string
  email: string
  phone: string | null
  message: string
}): Promise<void> {
  await callSecureApi<{ ok: true }>('/contact/submission', params)
}

export async function fetchPricingPlansAndVisibility(): Promise<{ plans: PricingPlan[]; visibility: PricingVisibility }> {
  const [plansResponse, visibilityResponse] = await Promise.all([
    callSecureApi<{ items: PricingPlan[] }>('/pricing/plans/public', {}),
    callSecureApi<PricingVisibility>('/pricing/me-visibility', {}),
  ])

  return {
    plans: Array.isArray(plansResponse.items) ? plansResponse.items : [],
    visibility: {
      canSeePricingPage: Boolean(visibilityResponse.canSeePricingPage),
      planId: typeof visibilityResponse.planId === 'string' ? visibilityResponse.planId : null,
    },
  }
}

export async function fetchPricingVisibility(): Promise<PricingVisibility> {
  const response = await callSecureApi<PricingVisibility>('/pricing/me-visibility', {})
  return {
    canSeePricingPage: Boolean(response.canSeePricingPage),
    planId: typeof response.planId === 'string' ? response.planId : null,
  }
}
