import { getStoredAccessToken } from '../../screens/authentication/internal/entraAuth'

export function getInitialAuthenticationState(): boolean {
  return Boolean(getStoredAccessToken())
}
