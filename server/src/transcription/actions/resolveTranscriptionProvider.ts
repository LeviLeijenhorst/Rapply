import { env } from "../../env"
import { readTranscriptionRuntimeSettings } from "../mode"
import type { TranscriptionProvider } from "../routes/types"

// Resolves the batch provider directly from env availability.
export function resolveTranscriptionProvider(): TranscriptionProvider {
  if (env.selfHostedWhisperEndpoint) return "self-hosted-whisper-batch"
  if (env.speechmaticsApiKey) return "speechmatics-batch"
  if (env.azureSpeechKey && env.azureSpeechRegion) return "azure-speech-batch"
  return "none"
}

// Resolves the active provider and mode from configuration plus env availability.
export async function resolveTranscriptionProviderWithRuntimeMode(): Promise<TranscriptionProvider> {
  const settings = await readTranscriptionRuntimeSettings()

  if (settings.provider === "azure-speech") {
    if (!(env.azureSpeechKey && env.azureSpeechRegion)) return "none"
    if (settings.mode === "realtime") return "azure-speech-realtime"
    if (settings.mode === "batch") return "azure-speech-batch"
    return "none"
  }

  if (settings.provider === "speechmatics") {
    if (!env.speechmaticsApiKey) return "none"
    if (settings.mode === "realtime") return "speechmatics-realtime"
    if (settings.mode === "batch") return "speechmatics-batch"
    return "none"
  }

  if (settings.provider === "self-hosted-whisper") {
    if (!env.selfHostedWhisperEndpoint) return "none"
    if (settings.mode === "batch") return "self-hosted-whisper-batch"
    return "none"
  }

  return "none"
}
