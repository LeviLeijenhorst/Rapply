export type TranscriptionMode = "batch" | "realtime"
export type TranscriptionProviderRuntime = "azure-speech" | "speechmatics" | "whisper-fast"

// Parses the configured transcription mode.
function normalizeTranscriptionMode(value: unknown): TranscriptionMode | null {
  const normalized = String(value || "").trim().toLowerCase()
  if (!normalized) return null
  if (normalized === "batch" || normalized === "azure-fast-batch") return "batch"
  if (normalized === "realtime" || normalized === "azure-realtime-live") return "realtime"
  return null
}

// Parses the configured transcription provider.
function normalizeTranscriptionProvider(value: unknown): TranscriptionProviderRuntime | null {
  const normalized = String(value || "").trim().toLowerCase()
  if (!normalized) return null
  if (normalized === "azure" || normalized === "azure-speech") return "azure-speech"
  if (normalized === "speechmatics") return "speechmatics"
  if (normalized === "whisper" || normalized === "verda-whisper" || normalized === "self-hosted-whisper" || normalized === "whisper-fast") {
    return "whisper-fast"
  }
  return null
}

// Keeps the old startup hook alive after removing runtime DB settings.
export async function ensureTranscriptionRuntimeSettingsTable(): Promise<void> {
  return
}

// Reads the active transcription mode and provider from env configuration.
export async function readTranscriptionRuntimeSettings(): Promise<{
  mode: TranscriptionMode
  provider: TranscriptionProviderRuntime
}> {
  const modeFromEnv = process.env.DEFAULT_TRANSCRIPTION_MODE
  const providerFromEnv = process.env.DEFAULT_TRANSCRIPTION_PROVIDER

  return {
    mode: normalizeTranscriptionMode(modeFromEnv) || "batch",
    provider: normalizeTranscriptionProvider(providerFromEnv) || "whisper-fast",
  }
}
