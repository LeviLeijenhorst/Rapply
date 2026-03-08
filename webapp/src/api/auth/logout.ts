import { signOutFromEntra } from '../../screens/authentication/internal/entraAuth'

export async function logout() {
  return signOutFromEntra()
}
