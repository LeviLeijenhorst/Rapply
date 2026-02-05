import { callSecureApi } from './secureApi'

async function createRandomKeyBase64(): Promise<string> {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
}

async function encryptAudioBlob(blob: Blob, keyBase64: string): Promise<Blob> {
  const keyData = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0))
  if (keyData.length !== 32) {
    throw new Error('Invalid AES key length')
  }
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM', length: 256 }, false, ['encrypt'])

  const nonce = crypto.getRandomValues(new Uint8Array(12))
  const arrayBuffer = await blob.arrayBuffer()
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, arrayBuffer)

  const magic = new TextEncoder().encode('CSA1')
  const combined = new Uint8Array(magic.length + nonce.length + encrypted.byteLength)
  combined.set(magic, 0)
  combined.set(nonce, magic.length)
  combined.set(new Uint8Array(encrypted), magic.length + nonce.length)

  return new Blob([combined], { type: 'application/octet-stream' })
}

export async function transcribeAudio(params: {
  audioBlob: Blob
  mimeType: string
  languageCode?: string
}): Promise<{ transcript: string; summary: string }> {
  const { audioBlob, mimeType, languageCode = 'nl' } = params

  const keyBase64 = await createRandomKeyBase64()
  const encryptedBlob = await encryptAudioBlob(audioBlob, keyBase64)

  const preflight = (await callSecureApi('/transcription/preflight', {})) as {
    allowed?: boolean
    operationId?: string
    uploadToken?: string
    uploadUrl?: string
    uploadHeaders?: Record<string, string>
  }

  if (!preflight.allowed) {
    throw new Error('Not enough seconds remaining for transcription')
  }

  const operationId = String(preflight.operationId || '').trim()
  const uploadToken = String(preflight.uploadToken || '').trim()
  const uploadUrl = String(preflight.uploadUrl || '').trim()
  const uploadHeaders = preflight.uploadHeaders || {}

  if (!operationId || !uploadToken || !uploadUrl) {
    throw new Error('Transcription preflight failed')
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      ...uploadHeaders,
      'Content-Type': 'application/octet-stream',
    },
    body: encryptedBlob,
  })

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text()
    throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`)
  }

  const result = (await callSecureApi('/transcription/start', {
    operationId,
    uploadToken,
    keyBase64,
    language_code: languageCode,
    mime_type: mimeType,
  })) as {
    transcript?: string
    text?: string
    summary?: string
  }

  const transcript = String(result.text || result.transcript || '')
  const summary = String(result.summary || '')

  if (!transcript.trim()) {
    throw new Error('No transcript returned')
  }

  return { transcript, summary }
}
