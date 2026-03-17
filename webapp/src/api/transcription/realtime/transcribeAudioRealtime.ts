import { callSecureApi } from '../../secureApi'

export type TranscriptionMode = 'azure-fast-batch' | 'azure-realtime-live'
export type TranscriptionProvider = 'azure' | 'speechmatics'

type RuntimeConfigResponse = {
  mode?: string
  provider?: string
  providerConfigured?: boolean
  azureSpeechConfigured?: boolean
  speechmaticsConfigured?: boolean
}

type RealtimeTokenResponse = {
  mode?: string
  provider?: string
  token?: string
  region?: string
  expiresInSeconds?: number
  jwt?: string
  realtimeUrl?: string
}

type ChargeRealtimeResponse = {
  ok?: boolean
  secondsCharged?: number
  remainingSecondsAfter?: number
  remainingSeconds?: number
}

type RealtimeSegment = {
  speaker: string
  text: string
}

type StartRealtimeTranscriberParams = {
  languageCode?: string
  mediaStream?: MediaStream | null
  onFinalSegment: (segment: RealtimeSegment) => void
  onError?: (message: string) => void
}

type StartParams = {
  languageCode?: string
  mediaStream?: MediaStream | null
  onFinalSegment: (segment: { speaker: string; text: string }) => void
  onError?: (message: string) => void
}

export type RealtimeTranscriberInput = {
  stop: () => Promise<void>
}

function normalizeMode(value: unknown): TranscriptionMode {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'azure-realtime-live') return 'azure-realtime-live'
  return 'azure-fast-batch'
}

function normalizeProvider(value: unknown): TranscriptionProvider {
  return String(value || '').trim().toLowerCase() === 'speechmatics' ? 'speechmatics' : 'azure'
}

function normalizeLanguageForAzure(value: string | undefined): string {
  const trimmed = String(value || '').trim().toLowerCase()
  if (!trimmed || trimmed === 'nl') return 'nl-NL'
  if (trimmed === 'en') return 'en-US'
  if (trimmed === 'fr') return 'fr-FR'
  return trimmed
}

function normalizeLanguageForSpeechmatics(value: string | undefined): string {
  const trimmed = String(value || '').trim().toLowerCase()
  if (!trimmed || trimmed === 'nl-nl') return 'nl'
  if (trimmed === 'en-us') return 'en'
  if (trimmed === 'fr-fr') return 'fr'
  return trimmed || 'nl'
}

function toFriendlyRealtimeError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error.trim()) return error
  return 'Realtime transcriptie is mislukt.'
}

function normalizeSpeakerLabel(raw: string, nextSpeakerIndex: number): string {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return `speaker_${nextSpeakerIndex}`
  const normalized = trimmed.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase()
  return normalized ? normalized : `speaker_${nextSpeakerIndex}`
}

function buildWsUrl(baseUrl: string, jwt: string): string {
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}jwt=${encodeURIComponent(jwt)}`
}

function appendToken(parts: string[], token: string, isPunctuation: boolean): void {
  const cleaned = String(token || '').trim()
  if (!cleaned) return
  if (parts.length === 0) {
    parts.push(cleaned)
    return
  }
  if (isPunctuation) {
    parts[parts.length - 1] = `${parts[parts.length - 1]}${cleaned}`
    return
  }
  parts.push(cleaned)
}

function extractSpeechmaticsFinalSegment(payload: any): RealtimeSegment | null {
  const messageType = String(payload?.message || '').trim()
  if (messageType !== 'AddTranscript') return null
  const results = Array.isArray(payload?.results) ? payload.results : []
  const parts: string[] = []
  let speakerRaw = ''

  for (const item of results) {
    const alternatives = Array.isArray(item?.alternatives) ? item.alternatives : []
    const alternative = alternatives[0] || {}
    const content = String(alternative?.content || item?.content || '').trim()
    if (!content) continue
    if (!speakerRaw) {
      const nextSpeaker = String(alternative?.speaker || item?.speaker || '').trim()
      if (nextSpeaker) speakerRaw = nextSpeaker
    }
    const type = String(item?.type || '').trim().toLowerCase()
    const punctuation = type === 'punctuation' || /^[,.;:!?]+$/.test(content)
    appendToken(parts, content, punctuation)
  }

  const text = parts.join(' ').replace(/\s+([,.;:!?])/g, '$1').trim()
  if (!text) return null
  const numericSpeaker = Number(speakerRaw)
  const speaker = Number.isFinite(numericSpeaker) ? `speaker_${numericSpeaker + 1}` : speakerRaw || 'speaker_1'
  return {
    speaker,
    text,
  }
}

function convertFloat32ToPcm16(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length)
  for (let index = 0; index < input.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, input[index]))
    output[index] = sample < 0 ? sample * 32768 : sample * 32767
  }
  return output
}

export async function fetchTranscriptionRuntimeConfig(): Promise<{
  mode: TranscriptionMode
  provider: TranscriptionProvider
  providerConfigured: boolean
  azureSpeechConfigured: boolean
  speechmaticsConfigured: boolean
}> {
  const response = await callSecureApi<RuntimeConfigResponse>('/transcription/runtime-config', {})
  const provider = normalizeProvider(response?.provider)
  const azureSpeechConfigured = response?.azureSpeechConfigured === true
  const speechmaticsConfigured = response?.speechmaticsConfigured === true
  return {
    mode: normalizeMode(response?.mode),
    provider,
    providerConfigured:
      response?.providerConfigured === true ||
      (provider === 'azure' ? azureSpeechConfigured : speechmaticsConfigured),
    azureSpeechConfigured,
    speechmaticsConfigured,
  }
}

export async function chargeRealtimeTranscription(params: { operationId: string; durationSeconds: number }): Promise<ChargeRealtimeResponse> {
  return callSecureApi<ChargeRealtimeResponse>('/transcription/realtime/charge', {
    operationId: String(params.operationId || '').trim(),
    durationSeconds: Math.max(1, Math.floor(Number(params.durationSeconds) || 0)),
  })
}

async function startAzureRealtimeTranscriber(params: StartRealtimeTranscriberParams, tokenResponse: RealtimeTokenResponse): Promise<RealtimeTranscriberInput> {
  const token = String(tokenResponse?.token || '').trim()
  const region = String(tokenResponse?.region || '').trim()
  if (!token || !region) {
    throw new Error('Kon geen Azure Speech token ophalen.')
  }

  const sdk: any = await import('microsoft-cognitiveservices-speech-sdk')
  const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, region)
  speechConfig.speechRecognitionLanguage = normalizeLanguageForAzure(params.languageCode)
  if (sdk.PropertyId?.SpeechServiceResponse_DiarizeIntermediateResults) {
    speechConfig.setProperty(sdk.PropertyId.SpeechServiceResponse_DiarizeIntermediateResults, 'true')
  }

  let stopPcmStreamer: (() => Promise<void>) | null = null
  let audioConfig: any = null
  if (params.mediaStream) {
    const format = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1)
    const pushStream = sdk.AudioInputStream.createPushStream(format)
    const streamer = await startPcmStreamingFromMediaStream({
      mediaStream: params.mediaStream,
      onPcmChunk: (chunk) => {
        try {
          pushStream.write(chunk)
        } catch {}
      },
    })
    stopPcmStreamer = async () => {
      await streamer.stop().catch(() => undefined)
      try {
        pushStream.close()
      } catch {}
    }
    audioConfig = sdk.AudioConfig.fromStreamInput(pushStream)
  } else {
    audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput()
  }
  const transcriber = new sdk.ConversationTranscriber(speechConfig, audioConfig)

  const speakerMap = new Map<string, string>()
  let speakerCounter = 1

  transcriber.transcribed = (_: unknown, event: any) => {
    try {
      const text = String(event?.result?.text || '').trim()
      if (!text) return

      const speakerIdRaw = String(event?.result?.speakerId || '').trim()
      const speakerKey = speakerIdRaw || `__speaker_${speakerCounter}`
      const existing = speakerMap.get(speakerKey)
      const speaker = existing || normalizeSpeakerLabel(speakerIdRaw, speakerCounter)
      if (!existing) {
        speakerMap.set(speakerKey, speaker)
        speakerCounter += 1
      }

      params.onFinalSegment({ speaker, text })
    } catch (error) {
      params.onError?.(toFriendlyRealtimeError(error))
    }
  }

  transcriber.canceled = (_: unknown, event: any) => {
    const details = String(event?.errorDetails || event?.reason || '').trim()
    if (!details) return
    params.onError?.(`Realtime transcriptie is gestopt: ${details}`)
  }

  await new Promise<void>((resolve, reject) => {
    transcriber.startTranscribingAsync(
      () => resolve(),
      (error: unknown) => reject(new Error(toFriendlyRealtimeError(error))),
    )
  })

  const stop = async () => {
    await new Promise<void>((resolve, reject) => {
      transcriber.stopTranscribingAsync(
        () => resolve(),
        (error: unknown) => reject(new Error(toFriendlyRealtimeError(error))),
      )
    }).catch(() => undefined)
    if (stopPcmStreamer) {
      await stopPcmStreamer().catch(() => undefined)
    }
    try {
      transcriber.close()
    } catch {}
  }

  return { stop }
}

async function startSpeechmaticsRealtimeTranscriber(params: StartRealtimeTranscriberParams, tokenResponse: RealtimeTokenResponse): Promise<RealtimeTranscriberInput> {
  const jwt = String(tokenResponse?.jwt || '').trim()
  const realtimeUrl = String(tokenResponse?.realtimeUrl || '').trim()
  if (!jwt || !realtimeUrl) {
    throw new Error('Kon geen Speechmatics realtime token ophalen.')
  }

  const wsUrl = buildWsUrl(realtimeUrl, jwt)
  const socket = new WebSocket(wsUrl)

  const ownsStream = !params.mediaStream
  const stream = params.mediaStream || (await navigator.mediaDevices.getUserMedia({ audio: true }))
  const pcmStreamer = await startPcmStreamingFromMediaStream({
    mediaStream: stream,
    onPcmChunk: (chunk) => {
      if (socket.readyState !== WebSocket.OPEN) return
      socket.send(chunk)
    },
  })

  let openResolved = false
  const openPromise = new Promise<void>((resolve, reject) => {
    socket.onopen = () => {
      openResolved = true
      resolve()
    }
    socket.onerror = () => {
      if (!openResolved) {
        reject(new Error('Realtime verbinding kon niet worden opgezet.'))
      }
    }
  })

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(String(event.data || '{}'))
      if (String(payload?.message || '').trim() === 'Error') {
        const reason = String(payload?.reason || payload?.error || '').trim()
        params.onError?.(reason ? `Realtime transcriptie is gestopt: ${reason}` : 'Realtime transcriptie is gestopt.')
        return
      }
      const segment = extractSpeechmaticsFinalSegment(payload)
      if (!segment) return
      params.onFinalSegment(segment)
    } catch (error) {
      params.onError?.(toFriendlyRealtimeError(error))
    }
  }

  await openPromise

  const sampleRate = Number.isFinite(pcmStreamer.sampleRate) ? Math.floor(pcmStreamer.sampleRate) : 16000
  socket.send(
    JSON.stringify({
      message: 'StartRecognition',
      audio_format: {
        type: 'raw',
        encoding: 'pcm_s16le',
        sample_rate: sampleRate,
      },
      transcription_config: {
        language: normalizeLanguageForSpeechmatics(params.languageCode),
        diarization: 'speaker',
      },
    }),
  )

  const stop = async () => {
    await pcmStreamer.stop().catch(() => undefined)
    try {
      socket.send(JSON.stringify({ message: 'EndOfStream' }))
    } catch {}
    if (ownsStream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch {}
      })
    }
    try {
      socket.close()
    } catch {}
  }

  return { stop }
}

export async function startRealtimeTranscriber(params: StartRealtimeTranscriberParams): Promise<RealtimeTranscriberInput> {
  const tokenResponse = await callSecureApi<RealtimeTokenResponse>('/transcription/realtime/token', {})
  const provider = normalizeProvider(tokenResponse?.provider)
  if (provider === 'speechmatics') {
    return startSpeechmaticsRealtimeTranscriber(params, tokenResponse)
  }
  return startAzureRealtimeTranscriber(params, tokenResponse)
}

async function startPcmStreamingFromMediaStream(params: {
  mediaStream: MediaStream
  onPcmChunk: (chunk: ArrayBuffer) => void
}): Promise<{ sampleRate: number; stop: () => Promise<void> }> {
  const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext
  if (!AudioContextConstructor) {
    throw new Error('Realtime audio wordt niet ondersteund in deze browser.')
  }
  if (params.mediaStream.getAudioTracks().length === 0) {
    throw new Error('De gedeelde stream bevat geen audio. Zet "Share tab audio" aan en probeer opnieuw.')
  }

  const audioContext = new AudioContextConstructor()
  const source = audioContext.createMediaStreamSource(params.mediaStream)
  const processor = audioContext.createScriptProcessor(4096, 1, 1)
  const sinkGain = audioContext.createGain()
  sinkGain.gain.value = 0

  source.connect(processor)
  processor.connect(sinkGain)
  sinkGain.connect(audioContext.destination)
  await audioContext.resume().catch(() => undefined)

  processor.onaudioprocess = (event) => {
    if (event.inputBuffer.numberOfChannels <= 0) return
    const channel = event.inputBuffer.getChannelData(0)
    const pcm16 = convertFloat32ToPcm16(channel)
    const pcmBuffer = new ArrayBuffer(pcm16.byteLength)
    new Int16Array(pcmBuffer).set(pcm16)
    params.onPcmChunk(pcmBuffer)
  }

  const stop = async () => {
    processor.onaudioprocess = null
    try {
      source.disconnect()
    } catch {}
    try {
      processor.disconnect()
    } catch {}
    try {
      sinkGain.disconnect()
    } catch {}
    await audioContext.close().catch(() => undefined)
  }

  return {
    sampleRate: Number.isFinite(audioContext.sampleRate) ? Math.floor(audioContext.sampleRate) : 16000,
    stop,
  }
}

export async function fetchRealtimeTranscriptionRuntime() {
  return fetchTranscriptionRuntimeConfig()
}

export async function startRealtimeTranscription(params: StartParams): Promise<RealtimeTranscriberInput> {
  return startRealtimeTranscriber(params)
}


