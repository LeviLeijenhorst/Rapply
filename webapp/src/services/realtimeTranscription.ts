import { callSecureApi } from './secureApi'

export type TranscriptionMode = 'azure-fast-batch' | 'azure-realtime-live'

type RuntimeConfigResponse = {
  mode?: string
  azureSpeechConfigured?: boolean
}

type AzureRealtimeTokenResponse = {
  mode?: string
  token?: string
  region?: string
  expiresInSeconds?: number
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
  onFinalSegment: (segment: RealtimeSegment) => void
  onError?: (message: string) => void
}

export type RealtimeTranscriberSession = {
  stop: () => Promise<void>
}

function normalizeMode(value: unknown): TranscriptionMode {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'azure-realtime-live') return 'azure-realtime-live'
  return 'azure-fast-batch'
}

function normalizeLanguage(value: string | undefined): string {
  const trimmed = String(value || '').trim().toLowerCase()
  if (!trimmed || trimmed === 'nl') return 'nl-NL'
  if (trimmed === 'en') return 'en-US'
  if (trimmed === 'fr') return 'fr-FR'
  return trimmed
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

export async function fetchTranscriptionRuntimeConfig(): Promise<{ mode: TranscriptionMode; azureSpeechConfigured: boolean }> {
  const response = await callSecureApi<RuntimeConfigResponse>('/transcription/runtime-config', {})
  return {
    mode: normalizeMode(response?.mode),
    azureSpeechConfigured: response?.azureSpeechConfigured === true,
  }
}

export async function chargeRealtimeTranscription(params: { operationId: string; durationSeconds: number }): Promise<ChargeRealtimeResponse> {
  return callSecureApi<ChargeRealtimeResponse>('/transcription/realtime/charge', {
    operationId: String(params.operationId || '').trim(),
    durationSeconds: Math.max(1, Math.floor(Number(params.durationSeconds) || 0)),
  })
}

export async function startRealtimeTranscriber(params: StartRealtimeTranscriberParams): Promise<RealtimeTranscriberSession> {
  const tokenResponse = await callSecureApi<AzureRealtimeTokenResponse>('/transcription/realtime/token', {})
  const token = String(tokenResponse?.token || '').trim()
  const region = String(tokenResponse?.region || '').trim()
  if (!token || !region) {
    throw new Error('Kon geen Azure Speech token ophalen.')
  }

  const sdk: any = await import('microsoft-cognitiveservices-speech-sdk')
  const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, region)
  speechConfig.speechRecognitionLanguage = normalizeLanguage(params.languageCode)
  if (sdk.PropertyId?.SpeechServiceResponse_DiarizeIntermediateResults) {
    speechConfig.setProperty(sdk.PropertyId.SpeechServiceResponse_DiarizeIntermediateResults, 'true')
  }

  const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput()
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
    try {
      transcriber.close()
    } catch {}
  }

  return { stop }
}
