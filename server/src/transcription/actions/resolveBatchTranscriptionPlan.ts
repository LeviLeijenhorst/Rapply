import { env } from "../../env"
import type { BatchTranscriptionProvider } from "../operationTypes"

export type BatchTranscriptionPlan = {
  provider: BatchTranscriptionProvider | "none"
}

// Resolves the batch transcription provider from environment configuration.
export function resolveBatchTranscriptionPlan(): BatchTranscriptionPlan {
  if (env.selfHostedWhisperEndpoint) return { provider: "whisper-fast" }
  if (env.speechmaticsApiKey) return { provider: "speechmatics" }
  if (env.azureSpeechKey && env.azureSpeechRegion) return { provider: "azure-speech" }
  return { provider: "none" }
}

// Returns the maximum audio duration accepted by the selected batch provider.
export function getProviderMaxAudioDurationSeconds(provider: BatchTranscriptionProvider | "none"): number | null {
  if (provider === "none") return null
  if (provider === "whisper-fast") return 90 * 60
  return 115 * 60
}
