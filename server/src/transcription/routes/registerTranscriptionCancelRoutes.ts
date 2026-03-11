import type { Express } from "express"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler, sendError } from "../../http"
import { refundChargedSeconds } from "../store"
import type { RegisterTranscriptionRoutesParams } from "./types"

// Registers the route that refunds a cancelled transcription operation.
export function registerTranscriptionCancelRoutes(app: Express, params: RegisterTranscriptionRoutesParams): void {
  app.post(
    "/transcription/cancel",
    params.rateLimitTranscription,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const operationId = typeof req.body?.operationId === "string" ? req.body.operationId.trim() : ""
      if (!operationId) {
        sendError(res, 400, "Missing operationId")
        return
      }

      await refundChargedSeconds({ userId: user.userId, operationId })
      res.status(200).json({ cancelled: true })
    }),
  )
}
