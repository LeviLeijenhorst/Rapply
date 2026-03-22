import { env } from "../../env"
import type { BatchTranscriptionProvider } from "../operationTypes"

type BatchTranscriptionPlan = {
  provider: BatchTranscriptionProvider | "none"
  fallbackProvider: BatchTranscriptionProvider | null
}

const DEFAULT_MAX_AUDIO_BYTES = 250 * 1024 * 1024
const AZURE_SPEECH_MAX_AUDIO_DURATION_SECONDS = 115 * 60
const SPEECHMATICS_MAX_AUDIO_DURATION_SECONDS = 115 * 60
const WHISPER_FAST_MAX_AUDIO_DURATION_SECONDS = 90 * 60

function normalizeProvider(value: string): BatchTranscriptionProvider | null {
  const normalized = String(value || "").trim().toLowerCase()
  if (normalized === "azure" || normalized === "azure-speech") return "azure-speech"
  if (normalized === "speechmatics") return "speechmatics"
  if (normalized === "whisper" || normalized === "verda-whisper" || normalized === "whisper-fast") {
    return "whisper-fast"
  }
  return null
}

function isProviderConfigured(provider: BatchTranscriptionProvider): boolean {
  if (provider === "whisper-fast") return !!String(env.whisperFastEndpoint || "").trim()
  if (provider === "speechmatics") return !!String(env.speechmaticsApiKey || "").trim()
  return !!String(env.azureSpeechKey || "").trim() && !!String(env.azureSpeechRegion || "").trim()
}

export function resolveBatchTranscriptionPlan(): BatchTranscriptionPlan {
  const preferredProvider = normalizeProvider(env.defaultTranscriptionProvider) || "whisper-fast"
  const fallbackProvider = normalizeProvider(env.transcriptionBatchFallbackProvider)

  if (isProviderConfigured(preferredProvider)) {
    return {
      provider: preferredProvider,
      fallbackProvider:
        env.transcriptionBatchFallbackEnabled && fallbackProvider && fallbackProvider !== preferredProvider && isProviderConfigured(fallbackProvider)
          ? fallbackProvider
          : null,
    }
  }

  if (env.transcriptionBatchFallbackEnabled && fallbackProvider && isProviderConfigured(fallbackProvider)) {
    return {
      provider: fallbackProvider,
      fallbackProvider: null,
    }
  }

  for (const candidate of ["whisper-fast", "speechmatics", "azure-speech"] as BatchTranscriptionProvider[]) {
    if (isProviderConfigured(candidate)) {
      return {
        provider: candidate,
        fallbackProvider: null,
      }
    }
  }

  return {
    provider: "none",
    fallbackProvider: null,
  }
}

export function getProviderMaxAudioBytes(provider: BatchTranscriptionProvider | "none"): number | null {
  return provider === "none" ? null : DEFAULT_MAX_AUDIO_BYTES
}

export function getProviderMaxAudioDurationSeconds(provider: BatchTranscriptionProvider | "none"): number | null {
  if (provider === "none") return null
  if (provider === "whisper-fast") return WHISPER_FAST_MAX_AUDIO_DURATION_SECONDS
  if (provider === "speechmatics") return SPEECHMATICS_MAX_AUDIO_DURATION_SECONDS
  return AZURE_SPEECH_MAX_AUDIO_DURATION_SECONDS
}
