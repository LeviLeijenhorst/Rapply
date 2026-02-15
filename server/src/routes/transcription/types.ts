import type { RequestHandler } from "express"

export type RegisterTranscriptionRoutesParams = {
  rateLimitTranscription: RequestHandler
}

export type TranscriptionProvider = "mistral" | "azure-speech" | "none"

export type StartRequest = {
  operationId: string
  uploadToken: string
  keyBase64: string
  languageCode: string
  mimeType: string
  preferProvider: string
  includeSummary: boolean
}

