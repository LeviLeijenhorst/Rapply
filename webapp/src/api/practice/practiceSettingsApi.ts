import { callSecureApi } from '../secureApi'

export async function updateOrganizationSettingsRemote(params: {
  practiceName?: string
  website?: string
  visitAddress?: string
  postalAddress?: string
  postalCodeCity?: string
  tintColor?: string
  logoDataUrl?: string | null
  updatedAtUnixMs: number
}): Promise<void> {
  await callSecureApi('/organization-settings/update', params)
}

export async function updateUserSettingsRemote(params: {
  contactName?: string
  contactRole?: string
  contactPhone?: string
  contactEmail?: string
  updatedAtUnixMs: number
}): Promise<void> {
  await callSecureApi('/user-settings/update', params)
}

