import type { RequestHandler } from "express"
import type { BatchTranscriptionProvider } from "../operationTypes"

export type RegisterTranscriptionRoutesParams = {
  rateLimitTranscription: RequestHandler
}

export type TranscriptionProvider = BatchTranscriptionProvider | "none"

export type StartRequest = {
  operationId: string
  uploadToken: string
  keyBase64: string
  inputId: string | null
  languageCode: string
  mimeType: string
}
