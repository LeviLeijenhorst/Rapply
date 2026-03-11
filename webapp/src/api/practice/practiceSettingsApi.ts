import { callSecureApi } from '../secureApi'

export async function updatePracticeSettingsRemote(params: {
  practiceName?: string
  website?: string
  visitAddress?: string
  postalAddress?: string
  postalCodeCity?: string
  contactName?: string
  contactRole?: string
  contactPhone?: string
  contactEmail?: string
  tintColor?: string
  logoDataUrl?: string | null
  updatedAtUnixMs: number
}): Promise<void> {
  await callSecureApi('/practice-settings/update', params)
}
