import type { RequestHandler } from "express"

export type RegisterTranscriptionRoutesParams = {
  rateLimitTranscription: RequestHandler
}

export type TranscriptionProvider =
  | "azure-speech-fast"
  | "azure-speech-realtime"
  | "speechmatics-batch"
  | "speechmatics-realtime"
  | "none"

export type StartRequest = {
  operationId: string
  uploadToken: string
  keyBase64: string
  languageCode: string
  mimeType: string
}
