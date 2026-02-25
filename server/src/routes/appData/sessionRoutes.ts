import type { Express } from "express"
import { createSession, deleteSession, updateSession } from "../../appData"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import { readId, readOptionalId, readOptionalNumber, readOptionalText, readOptionalTranscriptionStatus, readSession, readUnixMs } from "../requestParsers"

// Registers session create, update, and delete endpoints.
export function registerSessionRoutes(app: Express): void {
  app.post(
    "/sessions/create",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const session = readSession(req.body?.session)
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
        coacheeId: payload.coacheeId === null ? null : readOptionalId(payload.coacheeId),
        title: readOptionalText(payload.title),
        createdAtUnixMs: readOptionalNumber(payload.createdAtUnixMs) ?? undefined,
        audioBlobId: readOptionalText(payload.audioBlobId, true),
        audioDurationSeconds: readOptionalNumber(payload.audioDurationSeconds),
        uploadFileName: readOptionalText(payload.uploadFileName, true),
        transcript: readOptionalText(payload.transcript, true),
        summary: readOptionalText(payload.summary, true),
        reportDate: readOptionalText(payload.reportDate, true),
        wvpWeekNumber: readOptionalText(payload.wvpWeekNumber, true),
        reportFirstSickDay: readOptionalText(payload.reportFirstSickDay, true),
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

