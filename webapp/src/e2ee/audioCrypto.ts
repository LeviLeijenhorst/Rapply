const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const slice = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  return slice as ArrayBuffer
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

function encodeUint16(value: number) {
  const view = new DataView(new ArrayBuffer(2))
  view.setUint16(0, value, false)
  return new Uint8Array(view.buffer)
}

function decodeUint16(bytes: Uint8Array) {
  const view = new DataView(toArrayBuffer(bytes))
  return view.getUint16(0, false)
}

export async function encryptAudioForStorage(params: { key: CryptoKey; audioBlob: Blob; mimeType: string }): Promise<Blob> {
  const mime = params.mimeType || 'application/octet-stream'
  const mimeBytes = textEncoder.encode(mime)
  if (mimeBytes.length > 65535) {
    throw new Error('Mime type is too long')
  }

  const audioBytes = new Uint8Array(await params.audioBlob.arrayBuffer())
  const plaintext = concatBytes([encodeUint16(mimeBytes.length), mimeBytes, audioBytes])

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, params.key, toArrayBuffer(plaintext))
  const combined = concatBytes([textEncoder.encode('E2A01'), iv, new Uint8Array(ciphertext)])
  return new Blob([combined], { type: 'application/octet-stream' })
}

export async function decryptAudioFromStorage(params: { key: CryptoKey; encryptedBlob: Blob }): Promise<{ audioBlob: Blob; mimeType: string }> {
  const combined = new Uint8Array(await params.encryptedBlob.arrayBuffer())
  const magic = textDecoder.decode(combined.slice(0, 5))
  if (magic !== 'E2A01') {
    throw new Error('Ongeldige audio versleuteling')
  }

  const iv = combined.slice(5, 17)
  const ciphertext = combined.slice(17)
  const plaintextBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, params.key, toArrayBuffer(ciphertext))
  const plaintext = new Uint8Array(plaintextBuffer)

  const mimeLen = decodeUint16(plaintext.slice(0, 2))
  const mimeBytes = plaintext.slice(2, 2 + mimeLen)
  const audioBytes = plaintext.slice(2 + mimeLen)

  const mimeType = textDecoder.decode(mimeBytes) || 'application/octet-stream'
  return { audioBlob: new Blob([audioBytes], { type: mimeType }), mimeType }
}
