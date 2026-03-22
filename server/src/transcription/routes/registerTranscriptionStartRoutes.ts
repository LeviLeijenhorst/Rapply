import type { Express } from "express"
import { requireAuthenticatedUser } from "../../identity/auth"
import { asyncHandler, sendError } from "../../http"
import { TranscriptionError } from "../../errors/TranscriptionError"
import { startTranscriptionOperation } from "../actions/startTranscriptionOperation"
import type { RegisterTranscriptionRoutesParams, StartRequest } from "./types"

function readStartRequest(body: any): StartRequest | null {
  const operationId = typeof body?.operationId === "string" ? body.operationId.trim() : ""
  const uploadToken = typeof body?.uploadToken === "string" ? body.uploadToken.trim() : ""
  const keyBase64 = typeof body?.keyBase64 === "string" ? body.keyBase64.trim() : ""
  if (!operationId || !uploadToken || !keyBase64) return null
  return {
    operationId,
    uploadToken,
    keyBase64,
    inputId: typeof body?.inputId === "string" ? body.inputId.trim() || null : null,
    languageCode: typeof body?.language_code === "string" ? body.language_code.trim() || "nl" : "nl",
    mimeType: typeof body?.mime_type === "string" ? body.mime_type.trim() || "audio/m4a" : "audio/m4a",
  }
}

function readStatusCode(error: any): number {
  const explicitStatus = Number(error?.status)
  if (Number.isInteger(explicitStatus) && explicitStatus >= 400 && explicitStatus < 600) {
    return explicitStatus
  }

  const message = String(error?.message || error || "").toLowerCase()
  if (message.includes("not enough seconds remaining")) return 402
  if (message.includes("missing operationid") || message.includes("missing uploadtoken") || message.includes("invalid upload token")) return 400
  if (message.includes("invalid uploadpath")) return 403
  if (message.includes("audio duration exceeds")) return 422
  if (message.includes("no batch transcription provider is configured")) return 503
  return 500
}

// Registers the route that starts one async batch transcription operation.
export function registerTranscriptionStartRoutes(app: Express, params: RegisterTranscriptionRoutesParams): void {
  app.post(
    "/transcription/start",
    params.rateLimitTranscription,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const startRequest = readStartRequest(req.body)
      if (!startRequest) {
        sendError(res, 400, "Missing operationId, uploadToken, or keyBase64")
        return
      }

      try {
        const operation = await startTranscriptionOperation({
          userId: user.userId,
          operationId: startRequest.operationId,
          uploadToken: startRequest.uploadToken,
          keyBase64: startRequest.keyBase64,
          inputId: startRequest.inputId,
          languageCode: startRequest.languageCode,
          mimeType: startRequest.mimeType,
        })
        res.status(200).json(operation)
      } catch (error: any) {
        const message =
          error instanceof TranscriptionError ? error.message : String(error?.message || error || "Transcription start failed")
        sendError(res, readStatusCode(error), message)
      }
    }),
  )
}
