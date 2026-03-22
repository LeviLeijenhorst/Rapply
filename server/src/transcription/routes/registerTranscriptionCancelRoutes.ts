import type { Express } from "express"
import { requireAuthenticatedUser } from "../../identity/auth"
import { asyncHandler, sendError } from "../../http"
import { refundChargedSeconds } from "../billingStore"
import { markInputCancelled, markOperationCancelled, readOperationById } from "../operationStore"
import { deleteEncryptedUpload } from "../storage"
import type { RegisterTranscriptionRoutesParams } from "./types"

// Registers the route that cancels a non-terminal transcription operation.
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

      const operation = await readOperationById({ operationId, userId: user.userId })
      if (!operation) {
        sendError(res, 404, "Transcription operation not found")
        return
      }

      if (operation.status === "completed" || operation.status === "failed" || operation.status === "cancelled") {
        res.status(200).json({ cancelled: operation.status === "cancelled", status: operation.status })
        return
      }

      await markOperationCancelled({ operationId, userId: user.userId })
      await refundChargedSeconds({ userId: user.userId, operationId }).catch(() => undefined)
      if (operation.inputId) {
        await markInputCancelled({ inputId: operation.inputId }).catch(() => undefined)
      }
      if (operation.uploadPath) {
        await deleteEncryptedUpload({ blobName: operation.uploadPath }).catch(() => undefined)
      }

      res.status(200).json({ cancelled: true, status: "cancelled" })
    }),
  )
}
