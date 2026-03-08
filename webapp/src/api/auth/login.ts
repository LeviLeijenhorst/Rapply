import { signInWithEntra } from '../../screens/authentication/internal/entraAuth'

export async function login() {
  return signInWithEntra()
}
