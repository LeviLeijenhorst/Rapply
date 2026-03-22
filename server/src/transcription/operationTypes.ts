export type BatchTranscriptionProvider = "whisper-fast" | "speechmatics" | "azure-speech"

export type TranscriptionProviderResult =
  | { status: "completed"; transcript: string }
  | { status: "pending"; jobId: string }

export type TranscriptionOperationResponse = {
  operationId: string
  status: "queued" | "submitted" | "completed" | "failed"
  provider: BatchTranscriptionProvider | null
  transcript: string | null
  errorMessage: string | null
}
