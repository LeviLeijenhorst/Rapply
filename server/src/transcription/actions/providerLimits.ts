import type { TranscriptionProvider } from "../routes/types"

const AZURE_SPEECH_MAX_AUDIO_BYTES = 250 * 1024 * 1024
const AZURE_SPEECH_MAX_AUDIO_DURATION_SECONDS = 115 * 60

export function getProviderMaxAudioBytes(provider: TranscriptionProvider): number | null {
  if (provider === "azure-speech-fast") return AZURE_SPEECH_MAX_AUDIO_BYTES
  if (provider === "azure-speech-realtime") return AZURE_SPEECH_MAX_AUDIO_BYTES
  if (provider === "speechmatics-batch") return AZURE_SPEECH_MAX_AUDIO_BYTES
  if (provider === "speechmatics-realtime") return AZURE_SPEECH_MAX_AUDIO_BYTES
  return null
}

export function getProviderMaxAudioDurationSeconds(provider: TranscriptionProvider): number | null {
  if (provider === "azure-speech-fast") return AZURE_SPEECH_MAX_AUDIO_DURATION_SECONDS
  if (provider === "azure-speech-realtime") return AZURE_SPEECH_MAX_AUDIO_DURATION_SECONDS
  if (provider === "speechmatics-batch") return AZURE_SPEECH_MAX_AUDIO_DURATION_SECONDS
  if (provider === "speechmatics-realtime") return AZURE_SPEECH_MAX_AUDIO_DURATION_SECONDS
  return null
}
