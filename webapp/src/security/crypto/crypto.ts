import { fromBase64Url, toBase64Url } from './base64'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function toArrayBuffer(bytes: Uint8Array<ArrayBufferLike>): ArrayBuffer {
  const output = new Uint8Array(bytes.byteLength)
  output.set(bytes)
  return output.buffer
}

function toBytes(bytes: Uint8Array<ArrayBufferLike>): Uint8Array<ArrayBuffer> {
  const output = new Uint8Array(new ArrayBuffer(bytes.byteLength))
  output.set(bytes)
  return output
}

function concatBytes(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const combined = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    combined.set(part, offset)
    offset += part.length
  }
  return combined
}

export function createRandomId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createRecoveryKey(): string {
  const bytes = toBytes(crypto.getRandomValues(new Uint8Array(32)))
  return toBase64Url(bytes)
}

export function createUserDataKeyBytes(): Uint8Array {
  return toBytes(crypto.getRandomValues(new Uint8Array(32)))
}

export async function importAesKey(rawKeyBytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', toArrayBuffer(rawKeyBytes), { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
}

export async function encryptBytesWithAesGcm(params: { key: CryptoKey; plaintext: Uint8Array }): Promise<string> {
  const iv = toBytes(crypto.getRandomValues(new Uint8Array(12)))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, params.key, toArrayBuffer(params.plaintext))
  const combined = concatBytes([textEncoder.encode('E2EE1'), iv, new Uint8Array(ciphertext)])
  return toBase64Url(combined)
}

export async function decryptBytesWithAesGcm(params: { key: CryptoKey; encrypted: string }): Promise<Uint8Array> {
  const combined = fromBase64Url(params.encrypted)
  const magic5 = textDecoder.decode(combined.slice(0, 5))
  let iv: Uint8Array<ArrayBuffer>
  let ciphertext: Uint8Array<ArrayBuffer>
  if (magic5 === 'E2EE1') {
    iv = toBytes(combined.slice(5, 17))
    ciphertext = toBytes(combined.slice(17))
  } else {
    const magic4 = textDecoder.decode(combined.slice(0, 4))
    if (magic4 !== 'CSA1') {
      throw new Error('Ongeldige versleuteling')
    }
    iv = toBytes(combined.slice(4, 16))
    ciphertext = toBytes(combined.slice(16))
  }
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, params.key, toArrayBuffer(ciphertext))
  return new Uint8Array(plaintext)
}

export async function encryptText(params: { key: CryptoKey; plaintext: string }): Promise<string> {
  const bytes = textEncoder.encode(params.plaintext)
  return encryptBytesWithAesGcm({ key: params.key, plaintext: bytes })
}

export async function decryptText(params: { key: CryptoKey; encrypted: string }): Promise<string> {
  const bytes = await decryptBytesWithAesGcm({ key: params.key, encrypted: params.encrypted })
  return textDecoder.decode(bytes)
}

export async function generateRsaKeyPair(): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey; publicKeyJwk: JsonWebKey; privateKeyPkcs8: Uint8Array }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt'],
  )

  const publicKeyJwk = (await crypto.subtle.exportKey('jwk', keyPair.publicKey)) as JsonWebKey
  const privateKeyPkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey))

  return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey, publicKeyJwk, privateKeyPkcs8 }
}

export async function importRsaPrivateKeyFromPkcs8(privateKeyPkcs8: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('pkcs8', toArrayBuffer(privateKeyPkcs8), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt'])
}

export async function importRsaPublicKeyFromJwk(publicKeyJwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', publicKeyJwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt'])
}

export async function wrapUserDataKeyForDevice(params: { devicePublicKey: CryptoKey; userDataKeyBytes: Uint8Array }): Promise<string> {
  const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, params.devicePublicKey, toArrayBuffer(params.userDataKeyBytes))
  return toBase64Url(new Uint8Array(encrypted))
}

export async function unwrapUserDataKeyForDevice(params: { devicePrivateKey: CryptoKey; wrappedUserDataKeyForDevice: string }): Promise<Uint8Array> {
  const encryptedBytes = fromBase64Url(params.wrappedUserDataKeyForDevice)
  const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, params.devicePrivateKey, toArrayBuffer(encryptedBytes))
  return new Uint8Array(decrypted)
}

export async function wrapUserDataKeyForRecovery(params: { recoveryKey: string; userDataKeyBytes: Uint8Array }): Promise<string> {
  const recoveryBytes = fromBase64Url(params.recoveryKey)
  if (recoveryBytes.length !== 32) {
    throw new Error('Ongeldige Rapply-code')
  }
  const key = await importAesKey(recoveryBytes)
  return encryptBytesWithAesGcm({ key, plaintext: params.userDataKeyBytes })
}

export async function unwrapUserDataKeyForRecovery(params: { recoveryKey: string; wrappedUserDataKeyForRecovery: string }): Promise<Uint8Array> {
  const recoveryBytes = fromBase64Url(params.recoveryKey)
  if (recoveryBytes.length !== 32) {
    throw new Error('Ongeldige Rapply-code')
  }
  const key = await importAesKey(recoveryBytes)
  return decryptBytesWithAesGcm({ key, encrypted: params.wrappedUserDataKeyForRecovery })
}
