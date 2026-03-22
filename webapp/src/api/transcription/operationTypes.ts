export type TranscriptionOperationStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export type BatchTranscriptionProvider = 'azure-speech' | 'speechmatics' | 'whisper-fast'

export type TranscriptionOperationResponse = {
  operationId: string
  status: TranscriptionOperationStatus
  provider: BatchTranscriptionProvider | null
  mode: 'batch' | 'realtime' | null
  transcript: string
  text: string
  errorMessage: string
  statusLabel: string
  canRetry: boolean
  secondsCharged: number | null
  remainingSeconds: number | null
}
