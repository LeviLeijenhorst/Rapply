import type { Express } from "express"
import { requireAuthenticatedUser } from "../../identity/auth"
import { asyncHandler, sendError } from "../../http"
import { refreshTranscriptionOperation } from "../actions/refreshTranscriptionOperation"
import { buildOperationResponse, readOperationById } from "../operationStore"
import type { RegisterTranscriptionRoutesParams } from "./types"

// Registers the polling route for one async batch transcription operation.
export function registerTranscriptionOperationRoutes(app: Express, params: RegisterTranscriptionRoutesParams): void {
  app.get(
    "/transcription/operations/:operationId",
    params.rateLimitTranscription,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const operationId = typeof req.params?.operationId === "string" ? req.params.operationId.trim() : ""
      if (!operationId) {
        sendError(res, 400, "Missing operationId")
        return
      }

      const operation = await readOperationById({ operationId, userId: user.userId })
      if (!operation) {
        sendError(res, 404, "Transcription operation not found")
        return
      }

      if (operation.status === "completed" || operation.status === "failed" || operation.status === "cancelled") {
        res.status(200).json(buildOperationResponse(operation))
        return
      }

      const refreshed = await refreshTranscriptionOperation({ operationId, userId: user.userId })
      res.status(200).json(refreshed)
    }),
  )
}
