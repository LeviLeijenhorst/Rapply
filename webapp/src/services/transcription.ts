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

async function decodeAudioBuffer(audioContext: AudioContext, arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const result = audioContext.decodeAudioData(
      arrayBuffer,
      (decoded) => resolve(decoded),
      (error) => reject(error),
    )
    if (result && typeof (result as Promise<AudioBuffer>).then === 'function') {
      ;(result as Promise<AudioBuffer>).then(resolve).catch(reject)
    }
  })
}

function writeWavHeader(view: DataView, dataLength: number, channelCount: number, sampleRate: number) {
  const bytesPerSample = 2
  const blockAlign = channelCount * bytesPerSample
  const byteRate = sampleRate * blockAlign

  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channelCount, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bytesPerSample * 8, true)
  writeString(36, 'data')
  view.setUint32(40, dataLength, true)
}

function encodeWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const channelCount = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const frameCount = audioBuffer.length
  const bytesPerSample = 2
  const dataLength = frameCount * channelCount * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)

  writeWavHeader(view, dataLength, channelCount, sampleRate)

  const channels: Float32Array[] = []
  for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
    channels.push(audioBuffer.getChannelData(channelIndex))
  }

  let offset = 44
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const sample = Math.max(-1, Math.min(1, channels[channelIndex][frameIndex]))
      const intSample = sample < 0 ? sample * 32768 : sample * 32767
      view.setInt16(offset, intSample, true)
      offset += 2
    }
  }

  return buffer
}

async function convertWebmToWav(blob: Blob): Promise<Blob> {
  const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext
  if (!AudioContextConstructor) {
    throw new Error('Audio conversion is not supported in this browser.')
  }
  const arrayBuffer = await blob.arrayBuffer()
  const audioContext = new AudioContextConstructor()
  try {
    const audioBuffer = await decodeAudioBuffer(audioContext, arrayBuffer)
    const wavBuffer = encodeWav(audioBuffer)
    return new Blob([wavBuffer], { type: 'audio/wav' })
  } finally {
    await audioContext.close()
  }
}

async function normalizeAudioForTranscription(params: { audioBlob: Blob; mimeType: string }) {
  const { audioBlob, mimeType } = params
  if (!mimeType.startsWith('audio/webm')) {
    return { audioBlob, mimeType }
  }
  const converted = await convertWebmToWav(audioBlob)
  return { audioBlob: converted, mimeType: 'audio/wav' }
}

export async function transcribeAudio(params: {
  audioBlob: Blob
  mimeType: string
  languageCode?: string
}): Promise<{ transcript: string; summary: string }> {
  const { audioBlob, mimeType, languageCode = 'nl' } = params

  try {
    const normalized = await normalizeAudioForTranscription({ audioBlob, mimeType })
    console.log('[transcription] starting', {
      mimeType: normalized.mimeType,
      audioSize: normalized.audioBlob.size,
      languageCode,
    })
    const keyBase64 = await createRandomKeyBase64()
    const encryptedBlob = await encryptAudioBlob(normalized.audioBlob, keyBase64)

    const preflight = (await callSecureApi('/transcription/preflight', {})) as {
      allowed?: boolean
      operationId?: string
      uploadToken?: string
      uploadUrl?: string
      uploadHeaders?: Record<string, string>
    }

    console.log('[transcription] preflight response', {
      allowed: preflight.allowed,
      hasOperationId: !!preflight.operationId,
      hasUploadToken: !!preflight.uploadToken,
      hasUploadUrl: !!preflight.uploadUrl,
    })

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

    console.log('[transcription] upload response', { status: uploadResponse.status })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`)
    }

    const preferProvider = normalized.audioBlob.size >= 10 * 1024 * 1024 ? 'mistral' : undefined
    const result = (await callSecureApi('/transcription/start', {
      operationId,
      uploadToken,
      keyBase64,
      language_code: languageCode,
      mime_type: normalized.mimeType,
      prefer_provider: preferProvider,
    })) as {
      transcript?: string
      text?: string
      summary?: string
    }

    console.log('[transcription] transcription response', {
      hasTranscript: !!result.transcript || !!result.text,
      hasSummary: !!result.summary,
    })

    const transcript = String(result.text || result.transcript || '')
    const summary = String(result.summary || '')

    if (!transcript.trim()) {
      throw new Error('No transcript returned')
    }

    return { transcript, summary }
  } catch (error) {
    console.error('[transcription] failed', error)
    throw error
  }
}
