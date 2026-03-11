import { env } from "../../env"
import { readTranscriptionRuntimeSettings } from "../mode"
import type { TranscriptionProvider } from "../routes/types"

// Resolves the batch provider directly from env availability.
export function resolveTranscriptionProvider(): TranscriptionProvider {
  if (env.speechmaticsApiKey) return "speechmatics-batch"
  if (env.azureSpeechKey && env.azureSpeechRegion) return "azure-speech-fast"
  return "none"
}

// Resolves the active provider and mode from configuration plus env availability.
export async function resolveTranscriptionProviderWithRuntimeMode(): Promise<TranscriptionProvider> {
  const settings = await readTranscriptionRuntimeSettings()

  if (settings.provider === "azure") {
    if (!(env.azureSpeechKey && env.azureSpeechRegion)) return "none"
    if (settings.mode === "azure-realtime-live") return "azure-speech-realtime"
    if (settings.mode === "azure-fast-batch") return "azure-speech-fast"
    return "none"
  }

  if (settings.provider === "speechmatics") {
    if (!env.speechmaticsApiKey) return "none"
    if (settings.mode === "azure-realtime-live") return "speechmatics-realtime"
    if (settings.mode === "azure-fast-batch") return "speechmatics-batch"
    return "none"
  }

  return "none"
}
