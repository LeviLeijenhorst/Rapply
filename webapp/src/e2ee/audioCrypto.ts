const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()
const authTagLengthBytes = 16
const audioChunkSizeBytes = 64 * 1024

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

function encodeUint16(value: number) {
  const view = new DataView(new ArrayBuffer(2))
  view.setUint16(0, value, false)
  return new Uint8Array(view.buffer)
}

function decodeUint16(bytes: Uint8Array) {
  const view = new DataView(toArrayBuffer(bytes))
  return view.getUint16(0, false)
}

function encodeUint32(value: number) {
  const view = new DataView(new ArrayBuffer(4))
  view.setUint32(0, value, false)
  return new Uint8Array(view.buffer)
}

function decodeUint32(bytes: Uint8Array) {
  const view = new DataView(toArrayBuffer(bytes))
  return view.getUint32(0, false)
}

function createStreamReader(reader: ReadableStreamDefaultReader<Uint8Array>) {
  let buffer = toBytes(new Uint8Array(0))

  async function readBytes(length: number): Promise<Uint8Array> {
    if (length <= 0) {
      return new Uint8Array(0)
    }
    while (buffer.length < length) {
      const result = await reader.read()
      if (result.done) {
        break
      }
      const value = toBytes(result.value || new Uint8Array(0))
      buffer = buffer.length ? concatBytes([buffer, value]) : value
    }
    if (buffer.length < length) {
      throw new Error('Onvolledige audio data')
    }
    const output = buffer.slice(0, length)
    buffer = buffer.slice(length)
    return output
  }

  async function readRemaining(): Promise<Uint8Array> {
    const parts: Uint8Array[] = buffer.length ? [toBytes(buffer)] : []
    buffer = toBytes(new Uint8Array(0))
    while (true) {
      const result = await reader.read()
      if (result.done) {
        break
      }
      if (result.value && result.value.length) {
        parts.push(toBytes(result.value))
      }
    }
    return parts.length ? concatBytes(parts) : new Uint8Array(0)
  }

  return { readBytes, readRemaining }
}

function normalizeMimeType(value: string) {
  const mimeType = value.trim() || 'application/octet-stream'
  const mimeTypeBytes = textEncoder.encode(mimeType)
  if (mimeTypeBytes.length > 65535) {
    throw new Error('Mime type is too long')
  }
  return { mimeType, mimeTypeBytes }
}

export async function encryptAudioForStorage(params: { key: CryptoKey; audioBlob: Blob; mimeType: string }): Promise<Blob> {
  const { mimeTypeBytes } = normalizeMimeType(params.mimeType || '')
  const totalLength = params.audioBlob.size
  if (totalLength > 4294967295) {
    throw new Error('Audio is too large')
  }
  if (audioChunkSizeBytes <= 0) {
    throw new Error('Invalid audio chunk size')
  }

  const headerParts = [
    textEncoder.encode('E2A02'),
    encodeUint16(mimeTypeBytes.length),
    mimeTypeBytes,
    encodeUint32(audioChunkSizeBytes),
    encodeUint32(totalLength),
  ]
  const parts: BlobPart[] = headerParts.map((part) => toArrayBuffer(part))

  let offset = 0
  while (offset < totalLength) {
    const nextSize = Math.min(audioChunkSizeBytes, totalLength - offset)
    const chunk = new Uint8Array(await params.audioBlob.slice(offset, offset + nextSize).arrayBuffer())
    const initializationVector = toBytes(crypto.getRandomValues(new Uint8Array(12)))
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(initializationVector) }, params.key, toArrayBuffer(chunk))
    parts.push(toArrayBuffer(initializationVector), ciphertext)
    offset += nextSize
  }

  return new Blob(parts, { type: 'application/octet-stream' })
}

export async function encryptAudioChunkForStorage(params: { key: CryptoKey; audioBytes: Uint8Array }): Promise<Uint8Array> {
  const initializationVector = toBytes(crypto.getRandomValues(new Uint8Array(12)))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(initializationVector) },
    params.key,
    toArrayBuffer(params.audioBytes),
  )
  return concatBytes([initializationVector, toBytes(new Uint8Array(ciphertext))])
}

export async function decryptAudioChunkFromStorage(params: { key: CryptoKey; encryptedChunk: Uint8Array }): Promise<Uint8Array> {
  if (params.encryptedChunk.length < 13) {
    throw new Error('Ongeldige audio chunk')
  }
  const initializationVector = params.encryptedChunk.slice(0, 12)
  const ciphertext = params.encryptedChunk.slice(12)
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(initializationVector) },
    params.key,
    toArrayBuffer(ciphertext),
  )
  return new Uint8Array(plaintextBuffer)
}

export async function decryptAudioFromStorage(params: { key: CryptoKey; encryptedBlob: Blob }): Promise<{ audioBlob: Blob; mimeType: string }> {
  const reader = params.encryptedBlob.stream().getReader()
  const streamReader = createStreamReader(reader)
  const magicBytes = await streamReader.readBytes(5)
  const magic = textDecoder.decode(magicBytes)
  if (magic === 'E2A01') {
    const combined = new Uint8Array(await params.encryptedBlob.arrayBuffer())
    const legacyMagic = textDecoder.decode(combined.slice(0, 5))
    if (legacyMagic !== 'E2A01') {
      throw new Error('Ongeldige audio versleuteling')
    }
    const initializationVector = combined.slice(5, 17)
    const ciphertext = combined.slice(17)
    const plaintextBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(initializationVector) }, params.key, toArrayBuffer(ciphertext))
    const plaintext = new Uint8Array(plaintextBuffer)
    const mimeTypeLength = decodeUint16(plaintext.slice(0, 2))
    const mimeTypeBytes = plaintext.slice(2, 2 + mimeTypeLength)
    const audioBytes = plaintext.slice(2 + mimeTypeLength)
    const mimeType = textDecoder.decode(mimeTypeBytes) || 'application/octet-stream'
    return { audioBlob: new Blob([toArrayBuffer(audioBytes)], { type: mimeType }), mimeType }
  }
  if (magic !== 'E2A02') {
    throw new Error('Ongeldige audio versleuteling')
  }

  const mimeTypeLength = decodeUint16(await streamReader.readBytes(2))
  const mimeTypeBytes = mimeTypeLength ? await streamReader.readBytes(mimeTypeLength) : new Uint8Array(0)
  const mimeType = textDecoder.decode(mimeTypeBytes) || 'application/octet-stream'
  const chunkSizeBytes = decodeUint32(await streamReader.readBytes(4))
  const totalLength = decodeUint32(await streamReader.readBytes(4))
  if (chunkSizeBytes <= 0) {
    throw new Error('Ongeldige audio chunk grootte')
  }
  if (totalLength === 0) {
    return { audioBlob: new Blob([], { type: mimeType }), mimeType }
  }

  const chunkCount = Math.ceil(totalLength / chunkSizeBytes)
  const audioParts: Uint8Array[] = []
  for (let index = 0; index < chunkCount; index += 1) {
    const isLast = index === chunkCount - 1
    const plaintextLength = isLast ? totalLength - chunkSizeBytes * (chunkCount - 1) : chunkSizeBytes
    const ciphertextLength = plaintextLength + authTagLengthBytes
    const initializationVector = await streamReader.readBytes(12)
    const ciphertext = await streamReader.readBytes(ciphertextLength)
    try {
      const plaintextBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(initializationVector) }, params.key, toArrayBuffer(ciphertext))
      audioParts.push(toBytes(new Uint8Array(plaintextBuffer)))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Audio chunk decryptie mislukt (${index + 1}/${chunkCount}): ${message}`)
    }
  }

  return { audioBlob: new Blob(audioParts.map((part) => toArrayBuffer(part)), { type: mimeType }), mimeType }
}

export async function decryptAudioStreamFromStorage(params: {
  key: CryptoKey
  encryptedStream: ReadableStream<Uint8Array>
}): Promise<{ stream: ReadableStream<Uint8Array>; mimeType: string }> {
  const reader = params.encryptedStream.getReader()
  const streamReader = createStreamReader(reader)
  const magicBytes = await streamReader.readBytes(5)
  const magic = textDecoder.decode(magicBytes)
  if (magic === 'E2A01') {
    const remaining = await streamReader.readRemaining()
    const combined = concatBytes([magicBytes, remaining])
    const initializationVector = combined.slice(5, 17)
    const ciphertext = combined.slice(17)
    const plaintextBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(initializationVector) }, params.key, toArrayBuffer(ciphertext))
    const plaintext = new Uint8Array(plaintextBuffer)
    const mimeTypeLength = decodeUint16(plaintext.slice(0, 2))
    const mimeTypeBytes = plaintext.slice(2, 2 + mimeTypeLength)
    const audioBytes = plaintext.slice(2 + mimeTypeLength)
    const mimeType = textDecoder.decode(mimeTypeBytes) || 'application/octet-stream'
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(toBytes(audioBytes))
        controller.close()
      },
    })
    return { stream, mimeType }
  }
  if (magic !== 'E2A02') {
    throw new Error('Ongeldige audio versleuteling')
  }

  const mimeTypeLength = decodeUint16(await streamReader.readBytes(2))
  const mimeTypeBytes = mimeTypeLength ? await streamReader.readBytes(mimeTypeLength) : new Uint8Array(0)
  const mimeType = textDecoder.decode(mimeTypeBytes) || 'application/octet-stream'
  const chunkSizeBytes = decodeUint32(await streamReader.readBytes(4))
  const totalLength = decodeUint32(await streamReader.readBytes(4))
  if (chunkSizeBytes <= 0) {
    throw new Error('Ongeldige audio chunk grootte')
  }
  if (totalLength === 0) {
    return { stream: new ReadableStream<Uint8Array>({ start(controller) { controller.close() } }), mimeType }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const chunkCount = Math.ceil(totalLength / chunkSizeBytes)
      for (let index = 0; index < chunkCount; index += 1) {
        const isLast = index === chunkCount - 1
        const plaintextLength = isLast ? totalLength - chunkSizeBytes * (chunkCount - 1) : chunkSizeBytes
        const ciphertextLength = plaintextLength + authTagLengthBytes
        const initializationVector = await streamReader.readBytes(12)
        const ciphertext = await streamReader.readBytes(ciphertextLength)
        try {
          const plaintextBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(initializationVector) }, params.key, toArrayBuffer(ciphertext))
          controller.enqueue(new Uint8Array(plaintextBuffer))
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          controller.error(new Error(`Audio chunk decryptie mislukt (${index + 1}/${chunkCount}): ${message}`))
          return
        }
      }
      controller.close()
    },
  })

  return { stream, mimeType }
}

