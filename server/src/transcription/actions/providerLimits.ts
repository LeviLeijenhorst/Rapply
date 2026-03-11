import type { TranscriptionProvider } from "../routes/types"

const AZURE_SPEECH_MAX_AUDIO_BYTES = 250 * 1024 * 1024
const AZURE_SPEECH_MAX_AUDIO_DURATION_SECONDS = 115 * 60

// Returns the maximum upload size accepted by the selected provider.
export function getProviderMaxAudioBytes(provider: TranscriptionProvider): number | null {
  return provider === "none" ? null : AZURE_SPEECH_MAX_AUDIO_BYTES
}

// Returns the maximum audio duration accepted by the selected provider.
export function getProviderMaxAudioDurationSeconds(provider: TranscriptionProvider): number | null {
  return provider === "none" ? null : AZURE_SPEECH_MAX_AUDIO_DURATION_SECONDS
}
