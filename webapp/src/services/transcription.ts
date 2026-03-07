import { callSecureApi } from './secureApi'

const TRANSCRIPTION_PREFLIGHT_TIMEOUT_MS = 30_000
const TRANSCRIPTION_UPLOAD_BLOCK_TIMEOUT_MS = 10 * 60_000
const TRANSCRIPTION_UPLOAD_COMMIT_TIMEOUT_MS = 10 * 60_000
const TRANSCRIPTION_START_TIMEOUT_MS = 6 * 60 * 60_000
const TRANSCRIPTION_OPERATION_TIMEOUT_MS = 8 * 60 * 60_000
const TRANSCRIPTION_PREFLIGHT_MAX_RETRIES = 2
const TRANSCRIPTION_UPLOAD_MAX_RETRIES = 4
const TRANSCRIPTION_UPLOAD_WHOLE_RETRIES = 1
const TRANSCRIPTION_UPLOAD_CHUNK_BYTES = 4 * 1024 * 1024
const AZURE_WAV_TARGET_SAMPLE_RATE = 16_000
const ABORTED_REQUEST_ERROR = 'Request aborted'

type TranscriptionProgressHandlers = {
  onOperationPrepared?: (operationId: string) => void
}

function isRequestAbortedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '')
  return message === ABORTED_REQUEST_ERROR
}

function mapTranscriptionErrorMessage(rawMessage: string): string {
  const normalized = String(rawMessage || '').toLowerCase()
  const indicatesNoSpeech =
    normalized.includes('no transcript returned') ||
    normalized.includes('end-of-stream') ||
    (normalized.includes('combinedphrases') && normalized.includes('phrases'))

  if (indicatesNoSpeech) {
    return 'Er is geen spraak gedetecteerd in deze opname.'
  }
  if (normalized.includes('notreadableerror')) {
    return 'Het audiobestand kon niet worden gelezen. Sluit het bronbestand en probeer opnieuw.'
  }
  if (normalized.includes('did not return diarized segments')) {
    return 'Transcriptie mislukt: er kwam geen bruikbare transcriptie terug van de provider.'
  }
  return rawMessage
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  }) as Promise<T>
}

function shouldRetryTranscriptionRequest(error: unknown): boolean {
  const message = String(error instanceof Error ? error.message : error || '').toLowerCase()
  if (!message) return false
  return (
    message.includes('de server reageert niet op tijd') ||
    message.includes('kon geen verbinding maken met de server') ||
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('upload failed: 5') ||
    message.includes('upload block failed: 5') ||
    message.includes('upload commit failed: 5') ||
    message.includes('api error: 5') ||
    message.includes('api error: 429') ||
    message.includes(' api error: 408') ||
    message.includes(' api error: 409') ||
    message.includes('temporarily unavailable') ||
    message.includes('timeout')
  )
}

function buildAzureBlobUrlWithParams(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  return url.toString()
}

function toAzureBlockId(blockIndex: number): string {
  const plain = `block-${String(blockIndex).padStart(8, '0')}`
  return btoa(plain)
}

function buildAzureBlockListXml(blockIds: string[]): string {
  const escapedBlockIds = blockIds.map((id) => id.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
  const lines = escapedBlockIds.map((id) => `<Latest>${id}</Latest>`).join('')
  return `<?xml version="1.0" encoding="utf-8"?><BlockList>${lines}</BlockList>`
}

async function sleepWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return
  await new Promise<void>((resolve, reject) => {
    let isSettled = false
    const settleResolve = () => {
      if (isSettled) return
      isSettled = true
      if (signal) signal.removeEventListener('abort', onAbort)
      resolve()
    }
    const settleReject = (error: Error) => {
      if (isSettled) return
      isSettled = true
      if (signal) signal.removeEventListener('abort', onAbort)
      reject(error)
    }
    const timeoutId = setTimeout(settleResolve, ms)
    let isDone = false
    const onAbort = () => {
      if (isDone) return
      isDone = true
      clearTimeout(timeoutId)
      settleReject(new Error(ABORTED_REQUEST_ERROR))
    }
    if (signal) {
      if (signal.aborted) {
        onAbort()
        return
      }
      signal.addEventListener('abort', onAbort, { once: true })
    }
  })
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  const onExternalAbort = () => controller.abort()

  if (init.signal) {
    if (init.signal.aborted) {
      controller.abort()
    } else {
      init.signal.addEventListener('abort', onExternalAbort, { once: true })
    }
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (init.signal?.aborted) {
        throw new Error(ABORTED_REQUEST_ERROR)
      }
      throw new Error('Transcriptie duurde te lang. Probeer het opnieuw.')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
    if (init.signal) {
      init.signal.removeEventListener('abort', onExternalAbort)
    }
  }
}

async function uploadEncryptedBlobInBlocks(params: {
  uploadUrl: string
  encryptedBlob: Blob
  signal?: AbortSignal
}): Promise<void> {
  const { uploadUrl, encryptedBlob, signal } = params
  const totalBytes = encryptedBlob.size
  if (totalBytes <= 0) {
    throw new Error('Upload failed: encrypted audio is empty')
  }

  const chunkBytes = Math.max(256 * 1024, TRANSCRIPTION_UPLOAD_CHUNK_BYTES)
  const blockCount = Math.max(1, Math.ceil(totalBytes / chunkBytes))
  const blockIds: string[] = []

  for (let blockIndex = 0; blockIndex < blockCount; blockIndex += 1) {
    const blockId = toAzureBlockId(blockIndex)
    blockIds.push(blockId)
    const start = blockIndex * chunkBytes
    const end = Math.min(totalBytes, start + chunkBytes)
    const chunk = encryptedBlob.slice(start, end)
    const blockUrl = buildAzureBlobUrlWithParams(uploadUrl, { comp: 'block', blockid: blockId })

    let uploaded = false
    for (let attempt = 0; attempt <= TRANSCRIPTION_UPLOAD_MAX_RETRIES; attempt += 1) {
      try {
        const response = await fetchWithTimeout(
          blockUrl,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/octet-stream',
            },
            body: chunk,
            signal,
          },
          TRANSCRIPTION_UPLOAD_BLOCK_TIMEOUT_MS,
        )
        if (!response.ok) {
          const errorText = await response.text().catch(() => '')
          throw new Error(`Upload block failed: ${response.status} ${errorText}`)
        }
        uploaded = true
        break
      } catch (error) {
        if (isRequestAbortedError(error) || signal?.aborted) throw error
        if (attempt >= TRANSCRIPTION_UPLOAD_MAX_RETRIES || !shouldRetryTranscriptionRequest(error)) throw error
        await sleepWithAbort(400 * (attempt + 1), signal)
      }
    }

    if (!uploaded) {
      throw new Error(`Upload block failed at index ${blockIndex}`)
    }
  }

  const blockListUrl = buildAzureBlobUrlWithParams(uploadUrl, { comp: 'blocklist' })
  const blockListXml = buildAzureBlockListXml(blockIds)
  const commitResponse = await fetchWithTimeout(
    blockListUrl,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
      body: blockListXml,
      signal,
    },
    TRANSCRIPTION_UPLOAD_COMMIT_TIMEOUT_MS,
  )

  if (!commitResponse.ok) {
    const errorText = await commitResponse.text().catch(() => '')
    throw new Error(`Upload commit failed: ${commitResponse.status} ${errorText}`)
  }
}

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

function mixToMono(audioBuffer: AudioBuffer): Float32Array {
  const channelCount = audioBuffer.numberOfChannels
  const frameCount = audioBuffer.length
  const mixed = new Float32Array(frameCount)
  if (channelCount === 1) {
    mixed.set(audioBuffer.getChannelData(0))
    return mixed
  }
  const channels: Float32Array[] = []
  for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
    channels.push(audioBuffer.getChannelData(channelIndex))
  }
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    let sum = 0
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      sum += channels[channelIndex][frameIndex]
    }
    mixed[frameIndex] = sum / channelCount
  }
  return mixed
}

function encodeWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const sampleRate = audioBuffer.sampleRate
  const mono = mixToMono(audioBuffer)
  return encodeMonoPcm16Wav(mono, sampleRate)
}

function resampleMonoLinear(params: { source: Float32Array; sourceSampleRate: number; targetSampleRate: number }): Float32Array {
  const { source, sourceSampleRate, targetSampleRate } = params
  if (targetSampleRate === sourceSampleRate) return source

  const ratio = sourceSampleRate / targetSampleRate
  const targetLength = Math.max(1, Math.floor(source.length / ratio))
  const output = new Float32Array(targetLength)

  for (let index = 0; index < targetLength; index += 1) {
    const position = index * ratio
    const leftIndex = Math.floor(position)
    const rightIndex = Math.min(source.length - 1, leftIndex + 1)
    const blend = position - leftIndex
    output[index] = source[leftIndex] * (1 - blend) + source[rightIndex] * blend
  }

  return output
}

function encodeMonoPcm16Wav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const frameCount = samples.length
  const bytesPerSample = 2
  const channelCount = 1
  const dataLength = frameCount * channelCount * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)

  writeWavHeader(view, dataLength, channelCount, sampleRate)

  let offset = 44
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    const sample = Math.max(-1, Math.min(1, samples[frameIndex]))
    const intSample = sample < 0 ? sample * 32768 : sample * 32767
    view.setInt16(offset, intSample, true)
    offset += 2
  }

  return buffer
}

async function convertToOptimizedWav(blob: Blob, targetSampleRate = AZURE_WAV_TARGET_SAMPLE_RATE): Promise<Blob> {
  const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext
  if (!AudioContextConstructor) {
    throw new Error('Audio conversion is not supported in this browser.')
  }
  const arrayBuffer = await blob.arrayBuffer()
  const audioContext = new AudioContextConstructor()
  try {
    const audioBuffer = await decodeAudioBuffer(audioContext, arrayBuffer)
    const mono = mixToMono(audioBuffer)
    const resampled = resampleMonoLinear({
      source: mono,
      sourceSampleRate: audioBuffer.sampleRate,
      targetSampleRate: targetSampleRate > 0 ? targetSampleRate : audioBuffer.sampleRate,
    })
    const wavBuffer = encodeMonoPcm16Wav(resampled, targetSampleRate > 0 ? targetSampleRate : audioBuffer.sampleRate)
    return new Blob([wavBuffer], { type: 'audio/wav' })
  } finally {
    await audioContext.close()
  }
}

function normalizeMimeType(mimeType: string): string {
  return String(mimeType || '')
    .toLowerCase()
    .split(';')[0]
    .trim()
}

function canTranscribeCompressedMimeType(mimeType: string): boolean {
  const normalized = normalizeMimeType(mimeType)
  return (
    normalized === 'audio/webm' ||
    normalized === 'video/webm' ||
    normalized === 'audio/mpeg' ||
    normalized === 'audio/mp3' ||
    normalized === 'audio/mp4' ||
    normalized === 'audio/m4a' ||
    normalized === 'audio/aac' ||
    normalized === 'audio/opus' ||
    normalized === 'audio/ogg' ||
    normalized === 'audio/wav' ||
    normalized === 'audio/x-wav'
  )
}

function shouldPreferWavForTranscription(mimeType: string): boolean {
  const normalized = normalizeMimeType(mimeType)
  return (
    normalized === 'audio/webm' ||
    normalized === 'video/webm' ||
    normalized === 'audio/ogg' ||
    normalized === 'audio/opus' ||
    normalized === 'audio/mp4' ||
    normalized === 'audio/m4a' ||
    normalized === 'audio/aac'
  )
}

async function normalizeAudioForTranscription(params: { audioBlob: Blob; mimeType: string; requiresWav: boolean }) {
  const { audioBlob, requiresWav } = params
  const mimeType = normalizeMimeType(params.mimeType || audioBlob.type || '')
  const isWav = mimeType.startsWith('audio/wav') || mimeType.startsWith('audio/x-wav')
  if (isWav) {
    return { audioBlob, mimeType: 'audio/wav' }
  }

  const shouldPreferWav = requiresWav || !mimeType || shouldPreferWavForTranscription(mimeType)

  if (shouldPreferWav) {
    try {
      const converted = await convertToOptimizedWav(audioBlob, AZURE_WAV_TARGET_SAMPLE_RATE)
      return { audioBlob: converted, mimeType: 'audio/wav' }
    } catch (error) {
      if (requiresWav) {
        throw new Error('Audio kon niet worden omgezet naar WAV voor transcriptie.')
      }
      console.warn('[transcription] Preferred WAV conversion failed, falling back to original audio', error)
    }
  }

  if (!requiresWav && canTranscribeCompressedMimeType(mimeType)) {
    const outputMimeType = mimeType === 'video/webm' ? 'audio/webm' : mimeType
    return { audioBlob, mimeType: outputMimeType }
  }

  try {
    const converted = await convertToOptimizedWav(audioBlob, AZURE_WAV_TARGET_SAMPLE_RATE)
    return { audioBlob: converted, mimeType: 'audio/wav' }
  } catch (error) {
    if (requiresWav) {
      throw new Error('Audio kon niet worden omgezet naar WAV voor transcriptie.')
    }
    // Some browsers cannot decode certain recorder formats (e.g. webm/mp4) via decodeAudioData.
    // Fallback to original compressed audio so server-side processing can continue.
    console.warn('[transcription] WAV conversion failed, falling back to original audio', error)
    const fallbackMimeType = mimeType === 'video/webm' ? 'audio/webm' : mimeType || normalizeMimeType(audioBlob.type) || 'application/octet-stream'
    return { audioBlob, mimeType: fallbackMimeType }
  }
}

export async function transcribeAudio(params: {
  audioBlob: Blob
  mimeType: string
  languageCode?: string
  signal?: AbortSignal
  progress?: TranscriptionProgressHandlers
}): Promise<{ transcript: string; summary: string }> {
  return withTimeout(
    (async () => {
      const { audioBlob, mimeType, languageCode = 'nl', signal, progress } = params
      if (!audioBlob || audioBlob.size <= 0) {
        throw new Error('Er is geen audio opgenomen. Neem opnieuw op en probeer het opnieuw.')
      }

      try {
        let preflight: {
          allowed?: boolean
          operationId?: string
          uploadToken?: string
          uploadUrl?: string
          uploadHeaders?: Record<string, string>
          remainingSeconds?: number
          planKey?: string
          transcriptionProvider?: string
          requiresWav?: boolean
          maxAudioBytes?: number
          maxAudioDurationSeconds?: number
        } | null = null
        for (let attempt = 0; attempt <= TRANSCRIPTION_PREFLIGHT_MAX_RETRIES; attempt += 1) {
          try {
            preflight = (await callSecureApi('/transcription/preflight', {}, { timeoutMs: TRANSCRIPTION_PREFLIGHT_TIMEOUT_MS, signal })) as {
              allowed?: boolean
              operationId?: string
              uploadToken?: string
              uploadUrl?: string
              uploadHeaders?: Record<string, string>
              remainingSeconds?: number
              planKey?: string
              transcriptionProvider?: string
              requiresWav?: boolean
              maxAudioBytes?: number
              maxAudioDurationSeconds?: number
            }
            break
          } catch (error) {
            if (isRequestAbortedError(error) || signal?.aborted) throw error
            if (attempt >= TRANSCRIPTION_PREFLIGHT_MAX_RETRIES || !shouldRetryTranscriptionRequest(error)) throw error
            await sleepWithAbort(400 * (attempt + 1), signal)
          }
        }
        if (!preflight) {
          throw new Error('Transcription preflight failed')
        }

        const preflightProvider = String(preflight.transcriptionProvider || '').trim().toLowerCase()
        const requiresWav = preflight.requiresWav === undefined ? false : Boolean(preflight.requiresWav)
        const maxAudioBytes = typeof preflight.maxAudioBytes === 'number' && Number.isFinite(preflight.maxAudioBytes) ? Math.max(1, Math.floor(preflight.maxAudioBytes)) : null
        if (maxAudioBytes !== null && audioBlob.size > maxAudioBytes) {
          const maxMb = (maxAudioBytes / (1024 * 1024)).toFixed(0)
          throw new Error(`Audio bestand is te groot voor transcriptie (max ${maxMb} MB).`)
        }
        const normalized = await normalizeAudioForTranscription({ audioBlob, mimeType, requiresWav })
        if (!normalized.audioBlob || normalized.audioBlob.size <= 0) {
          throw new Error('Er is geen audio opgenomen. Neem opnieuw op en probeer het opnieuw.')
        }
        console.log('[transcription] starting', {
          mimeType: normalized.mimeType,
          audioSize: normalized.audioBlob.size,
          languageCode,
        })
        const keyBase64 = await createRandomKeyBase64()
        const encryptedBlob = await encryptAudioBlob(normalized.audioBlob, keyBase64)

        console.log('[transcription] preflight response', {
          allowed: preflight.allowed,
          hasOperationId: !!preflight.operationId,
          hasUploadToken: !!preflight.uploadToken,
          hasUploadUrl: !!preflight.uploadUrl,
          remainingSeconds: preflight.remainingSeconds,
          planKey: preflight.planKey,
          provider: preflightProvider || 'unknown',
          requiresWav,
          maxAudioBytes,
        })

        if (!preflight.allowed) {
          const remainingSeconds = typeof preflight.remainingSeconds === 'number' ? preflight.remainingSeconds : null
          throw new Error(`Not enough seconds remaining for transcription${remainingSeconds !== null ? ` (remaining ${remainingSeconds}s)` : ''}`)
        }

        const operationId = String(preflight.operationId || '').trim()
        const uploadToken = String(preflight.uploadToken || '').trim()
        const uploadUrl = String(preflight.uploadUrl || '').trim()
        if (!operationId || !uploadToken || !uploadUrl) {
          throw new Error('Transcription preflight failed')
        }
        progress?.onOperationPrepared?.(operationId)

        const uploadStartedAt = Date.now()
        let uploadCompleted = false
        for (let attempt = 0; attempt <= TRANSCRIPTION_UPLOAD_WHOLE_RETRIES; attempt += 1) {
          try {
            await uploadEncryptedBlobInBlocks({
              uploadUrl,
              encryptedBlob,
              signal,
            })
            uploadCompleted = true
            break
          } catch (error) {
            if (isRequestAbortedError(error) || signal?.aborted) throw error
            if (attempt >= TRANSCRIPTION_UPLOAD_MAX_RETRIES || !shouldRetryTranscriptionRequest(error)) throw error
            await sleepWithAbort(500 * (attempt + 1), signal)
          }
        }
        if (!uploadCompleted) {
          throw new Error('Upload failed')
        }
        console.log('[transcription] upload response', { status: 201, elapsedMs: Date.now() - uploadStartedAt, bytes: encryptedBlob.size })

        const result = (await callSecureApi(
          '/transcription/start',
          {
            operationId,
            uploadToken,
            keyBase64,
            language_code: languageCode,
            mime_type: normalized.mimeType,
            include_summary: false,
          },
          { timeoutMs: TRANSCRIPTION_START_TIMEOUT_MS, signal },
        )) as {
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
        if (isRequestAbortedError(error) || signal?.aborted) {
          throw new Error(ABORTED_REQUEST_ERROR)
        }
        console.error('[transcription] failed', error)
        const rawMessage = error instanceof Error ? error.message : String(error || 'Transcriptie mislukt')
        throw new Error(mapTranscriptionErrorMessage(rawMessage))
      }
    })(),
    TRANSCRIPTION_OPERATION_TIMEOUT_MS,
    'Transcriptie duurde te lang. Probeer het opnieuw.',
  )
}

export async function cancelTranscriptionOperation(params: { operationId: string; signal?: AbortSignal }): Promise<void> {
  const operationId = String(params.operationId || '').trim()
  if (!operationId) return
  await callSecureApi('/transcription/cancel', { operationId }, { timeoutMs: 30_000, signal: params.signal })
}

export function isTranscriptionCancelledError(error: unknown): boolean {
  return isRequestAbortedError(error)
}
