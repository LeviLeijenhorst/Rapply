import * as SecureStore from "expo-secure-store"
import * as Crypto from "expo-crypto"
import { Buffer } from "buffer"

const encryptionKeyIdentifier = "encryption_key"

export async function getOrCreateLocalEncryptionKey() {
  let encryptionKey = await SecureStore.getItemAsync(encryptionKeyIdentifier)
  if (!encryptionKey) {
    const randomBytes = await Crypto.getRandomBytesAsync(32)
    encryptionKey = Buffer.from(randomBytes).toString("base64")
    await SecureStore.setItemAsync(encryptionKeyIdentifier, encryptionKey)
  }
  return encryptionKey
}

