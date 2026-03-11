export type TranscriptionMode = "azure-fast-batch" | "azure-realtime-live"
export type TranscriptionProviderRuntime = "azure" | "speechmatics"

// Parses the configured transcription mode.
function normalizeTranscriptionMode(value: unknown): TranscriptionMode | null {
  const normalized = String(value || "").trim().toLowerCase()
  if (normalized === "azure-fast-batch") return "azure-fast-batch"
  if (normalized === "azure-realtime-live") return "azure-realtime-live"
  return null
}

// Parses the configured transcription provider.
function normalizeTranscriptionProvider(value: unknown): TranscriptionProviderRuntime | null {
  const normalized = String(value || "").trim().toLowerCase()
  if (normalized === "azure") return "azure"
  if (normalized === "speechmatics") return "speechmatics"
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
    mode: normalizeTranscriptionMode(modeFromEnv) || "azure-fast-batch",
    provider: normalizeTranscriptionProvider(providerFromEnv) || "speechmatics",
  }
}
