import { getStoredAccessToken } from '../../screens/authentication/internal/entraAuth'

function isDevAuthBypassEnabled(): boolean {
  return String(process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS || '').trim().toLowerCase() === 'true'
}

export function getInitialAuthenticationState(): boolean {
  if (isDevAuthBypassEnabled()) return true
  return Boolean(getStoredAccessToken())
}
