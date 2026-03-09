import {
  fetchTranscriptionRuntimeConfig,
  startRealtimeTranscriber,
  type RealtimeTranscriberSession,
  type TranscriptionMode,
} from '../realtimeTranscriptionApi'

type StartParams = {
  languageCode?: string
  onFinalSegment: (segment: { speaker: string; text: string }) => void
  onError?: (message: string) => void
}

export type { RealtimeTranscriberSession, TranscriptionMode }

export async function fetchRealtimeTranscriptionRuntime() {
  return fetchTranscriptionRuntimeConfig()
}

export async function startRealtimeTranscription(params: StartParams): Promise<RealtimeTranscriberSession> {
  return startRealtimeTranscriber(params)
}
