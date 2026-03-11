import type { Express } from "express"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import { readId, readOptionalId, readOptionalNumber, readOptionalText, readUnixMs } from "../../routes/parsers/scalars"
import {
  readOptionalStructuredSessionSummary,
  readOptionalSessionInputType,
  readOptionalTranscriptionStatus,
  readSessionInput,
} from "../readSessionInput"
import { createSession, deleteSession, updateSession } from "../store"

export function registerSessionRoutes(app: Express): void {
  app.post(
      "/sessions/create",
      asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const session = readSessionInput(req.body?.session)
      await createSession(user.userId, session)
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/sessions/update",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const id = readId(payload.id, "id")
      const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "updatedAtUnixMs")
      await updateSession(user.userId, {
        id,
        updatedAtUnixMs,
        clientId: (payload.clientId ?? payload.coacheeId) === null ? null : readOptionalId(payload.clientId ?? payload.coacheeId),
        trajectoryId: payload.trajectoryId === null ? null : readOptionalId(payload.trajectoryId),
        inputType: readOptionalSessionInputType(payload.inputType ?? payload.kind),
        title: readOptionalText(payload.title),
        createdAtUnixMs: readOptionalNumber(payload.createdAtUnixMs) ?? undefined,
        audioUploadId: readOptionalText(payload.audioUploadId ?? payload.audioBlobId, true),
        audioDurationSeconds: readOptionalNumber(payload.audioDurationSeconds),
        uploadFileName: readOptionalText(payload.uploadFileName, true),
        transcriptText: readOptionalText(payload.transcriptText ?? payload.transcript, true),
        summaryText: readOptionalText(payload.summaryText ?? payload.summary, true),
        summaryStructured: readOptionalStructuredSessionSummary(payload.summaryStructured),
        transcriptionStatus: readOptionalTranscriptionStatus(payload.transcriptionStatus),
        transcriptionError: readOptionalText(payload.transcriptionError, true),
      })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/sessions/delete",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = readId(req.body?.id, "id")
      await deleteSession(user.userId, id)
      res.status(200).json({ ok: true })
    }),
  )
}
