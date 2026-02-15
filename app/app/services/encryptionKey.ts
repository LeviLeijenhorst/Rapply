import { getLocalEncryptionKeyOrThrow } from "./e2eeMobile"

export async function getOrCreateLocalEncryptionKey() {
  return await getLocalEncryptionKeyOrThrow()
}
