import { callSecureApi } from '../api/secureApi'

export async function fetchCurrentUserProfile() {
  return callSecureApi<{
    givenName?: string | null
    surname?: string | null
    name?: string | null
    displayName?: string | null
    email?: string | null
  }>('/auth/me', {})
}
