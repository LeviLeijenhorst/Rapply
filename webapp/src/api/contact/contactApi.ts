import { callSecureApi } from '../secureApi'

export async function submitContactSubmission(params: {
  name: string
  email: string
  phone: string | null
  message: string
}): Promise<void> {
  await callSecureApi<{ ok: true }>('/contact/submission', params)
}