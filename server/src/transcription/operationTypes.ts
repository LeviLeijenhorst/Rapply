export type BatchTranscriptionProvider = "azure-speech" | "speechmatics" | "whisper-fast"

export type TranscriptionOperationMode = "batch" | "realtime"

export type TranscriptionOperationStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"

export type ProviderOperationStartResult =
  | {
      status: "completed"
      transcript: string
    }
  | {
      status: "queued" | "running"
      externalJobId: string
      externalStatusPath: string
      externalResultPath: string
    }

export type ProviderOperationPollResult =
  | {
      status: "queued" | "running"
    }
  | {
      status: "completed"
      transcript: string
    }
  | {
      status: "failed"
      errorMessage: string
    }

export type TranscriptionOperationRecord = {
  operationId: string
  ownerUserId: string
  inputId: string | null
  status: string
  mode: string | null
  provider: string | null
  uploadPath: string | null
  languageCode: string | null
  mimeType: string | null
  externalJobId: string | null
  externalStatusPath: string | null
  externalResultPath: string | null
  transcriptText: string | null
  providerError: string | null
  errorMessage: string | null
  secondsCharged: number | null
  remainingSeconds: number | null
  refundedAt: string | null
  createdAt: string | null
  chargedAt: string | null
  startedAt: string | null
  completedAt: string | null
  failedAt: string | null
  cancelledAt: string | null
  lastPolledAt: string | null
}

export type TranscriptionOperationResponse = {
  operationId: string
  status: TranscriptionOperationStatus
  provider: BatchTranscriptionProvider | null
  mode: TranscriptionOperationMode | null
  transcript: string
  text: string
  errorMessage: string
  statusLabel: string
  canRetry: boolean
  secondsCharged: number | null
  remainingSeconds: number | null
}

export function isFinishedOperationStatus(status: string): status is Extract<TranscriptionOperationStatus, "completed" | "failed" | "cancelled"> {
  return status === "completed" || status === "failed" || status === "cancelled"
}

export function readOperationStatusLabel(status: TranscriptionOperationStatus): string {
  if (status === "queued") return "Waiting to start"
  if (status === "running") return "Transcribing audio"
  if (status === "completed") return "Transcription finished"
  if (status === "failed") return "Transcription failed"
  return "Transcription cancelled"
}
