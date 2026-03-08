import { argon2id } from '@noble/hashes/argon2.js'
import { utf8ToBytes } from '@noble/hashes/utils.js'

import { fromBase64Url, toBase64Url } from './base64'

export type Argon2Params = {
  timeCost: number
  memoryCostKib: number
  parallelism: number
}

export const defaultArgon2Params: Argon2Params = {
  timeCost: 3,
  memoryCostKib: 64 * 1024,
  parallelism: 1,
}

// Creates a random Argon2 salt encoded for transport/storage.
export function createArgon2SaltBase64Url(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(16)))
}

// Derives a 32-byte passphrase key using Argon2id and configured KDF parameters.
export async function derivePassphraseKeyBytes(params: {
  passphrase: string
  saltBase64Url: string
  argon2: Argon2Params
}): Promise<Uint8Array> {
  const passphraseBytes = utf8ToBytes(params.passphrase)
  const saltBytes = fromBase64Url(params.saltBase64Url)
  const keyBytes = argon2id(passphraseBytes, saltBytes, {
    t: params.argon2.timeCost,
    m: params.argon2.memoryCostKib,
    p: params.argon2.parallelism,
    dkLen: 32,
  })
  return new Uint8Array(keyBytes)
}
