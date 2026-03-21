import type { TranscriptionProvider } from "../routes/types"

const DEFAULT_MAX_AUDIO_BYTES = 250 * 1024 * 1024
const AZURE_SPEECH_MAX_AUDIO_DURATION_SECONDS = 115 * 60
const SPEECHMATICS_MAX_AUDIO_DURATION_SECONDS = 115 * 60
const SELF_HOSTED_WHISPER_MAX_AUDIO_DURATION_SECONDS = 90 * 60

// Returns the maximum upload size accepted by the selected provider.
export function getProviderMaxAudioBytes(provider: TranscriptionProvider): number | null {
  return provider === "none" ? null : DEFAULT_MAX_AUDIO_BYTES
}

// Returns the maximum audio duration accepted by the selected provider.
export function getProviderMaxAudioDurationSeconds(provider: TranscriptionProvider): number | null {
  if (provider === "none") return null
  if (provider === "self-hosted-whisper-batch") return SELF_HOSTED_WHISPER_MAX_AUDIO_DURATION_SECONDS
  if (provider === "speechmatics-batch" || provider === "speechmatics-realtime") {
    return SPEECHMATICS_MAX_AUDIO_DURATION_SECONDS
  }
  return AZURE_SPEECH_MAX_AUDIO_DURATION_SECONDS
}
