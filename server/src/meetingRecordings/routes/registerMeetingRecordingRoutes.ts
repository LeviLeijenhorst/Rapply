import type { Express, RequestHandler } from "express"
import express from "express"
import { requireAuthenticatedUser } from "../../identity/auth"
import { asyncHandler, sendError } from "../../http"
import { readId, readOptionalId, readOptionalInteger, readOptionalText, readRequiredNumber, readText } from "../../routes/parsers/scalars"
import { appendMeetingRecordingChunk } from "../appendMeetingRecordingChunk"
import { cancelMeetingRecording } from "../cancelMeetingRecording"
import { startMeetingRecording } from "../createMeetingRecording"
import { readMeetingRecording } from "../readMeetingRecording"
import { stopMeetingRecording } from "../stopMeetingRecording"
import { isMeetingRecordingTokenValid } from "../store"

function readOptionalSourceApp(value: unknown): string | null {
  const text = readOptionalText(value, true)
  if (text === undefined || text === null) return null
  const normalized = text.trim().toLowerCase()
  if (!normalized) return null
  return normalized
}

function readOptionalProvider(value: unknown): string | null {
  const text = readOptionalText(value, true)
  if (text === undefined || text === null) return null
  const normalized = text.trim().toLowerCase()
  if (!normalized) return null
  return normalized
}

export function registerMeetingRecordingRoutes(app: Express, params: { rateLimitTranscription: RequestHandler }): void {
  app.post(
    "/meeting-recordings/start",
    params.rateLimitTranscription,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const languageCode = readText(payload.languageCode, "languageCode")
      const mimeType = readText(payload.mimeType, "mimeType")

      const started = await startMeetingRecording({
        userId: user.userId,
        sessionId: payload.sessionId === null ? null : readOptionalId(payload.sessionId) ?? null,
        clientId: payload.clientId === null ? null : readOptionalId(payload.clientId) ?? null,
        trajectoryId: payload.trajectoryId === null ? null : readOptionalId(payload.trajectoryId) ?? null,
        title: payload.title === null ? null : readOptionalText(payload.title, true) ?? null,
        languageCode,
        mimeType,
        sampleRateHz: readOptionalInteger(payload.sampleRateHz),
        channelCount: readOptionalInteger(payload.channelCount),
        sourceApp: readOptionalSourceApp(payload.sourceApp),
        provider: readOptionalProvider(payload.provider),
      })

      res.status(200).json({
        meetingRecordingId: started.meetingRecordingId,
        sessionId: started.sessionId,
        audioStreamId: started.audioStreamId,
        ingestToken: started.ingestToken,
        ingestTokenExpiresAtMs: started.ingestTokenExpiresAtMs,
      })
    }),
  )

  app.get(
    "/meeting-recordings/:id",
    params.rateLimitTranscription,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = readId(req.params?.id, "id")
      const recording = await readMeetingRecording({ userId: user.userId, id })
      if (!recording) {
        sendError(res, 404, "Meeting recording not found")
        return
      }
      res.status(200).json({ meetingRecording: recording })
    }),
  )

  app.post(
    "/meeting-recordings/:id",
    params.rateLimitTranscription,
    express.raw({ type: "*/*", limit: "50mb" }),
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = readId(req.params?.id, "id")
      const ingestToken = readText(req.headers["x-ingest-token"], "x-ingest-token")
      const chunkIndex = readRequiredNumber(req.headers["x-chunk-index"], "chunkIndex")
      const startMilliseconds = readRequiredNumber(req.headers["x-start-milliseconds"], "startMilliseconds")
      const durationMilliseconds = readRequiredNumber(req.headers["x-duration-milliseconds"], "durationMilliseconds")
      const body = req.body
      if (!Buffer.isBuffer(body) || body.length <= 0) {
        sendError(res, 400, "Missing chunk bytes")
        return
      }

      const isValidToken = await isMeetingRecordingTokenValid({
        userId: user.userId,
        token: ingestToken,
        meetingRecordingId: id,
      })
      if (!isValidToken) {
        sendError(res, 401, "Invalid ingest token")
        return
      }

      try {
        const appended = await appendMeetingRecordingChunk({
          userId: user.userId,
          meetingRecordingId: id,
          chunkIndex,
          startMilliseconds,
          durationMilliseconds,
          bytes: body,
        })
        res.status(200).json(appended)
      } catch (error) {
        if (error instanceof Error && error.message === "Meeting recording not found") {
          sendError(res, 404, error.message)
          return
        }
        if (error instanceof Error && error.message === "Meeting recording already stopped") {
          sendError(res, 409, error.message)
          return
        }
        throw error
      }
    }),
  )

  app.post(
    "/meeting-recordings/:id/stop",
    params.rateLimitTranscription,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = readId(req.params?.id, "id")
      const payload = req.body || {}
      const endedAtUnixMs = readRequiredNumber(payload.endedAtUnixMs ?? Date.now(), "endedAtUnixMs")
      const stopReason = readText(payload.reason ?? "user_stop", "reason")
      const stopped = await stopMeetingRecording({ userId: user.userId, id, endedAtUnixMs, stopReason })
      res.status(200).json(stopped)
    }),
  )

  app.post(
    "/meeting-recordings/:id/cancel",
    params.rateLimitTranscription,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = readId(req.params?.id, "id")
      const cancelled = await cancelMeetingRecording({ userId: user.userId, id })
      res.status(200).json(cancelled)
    }),
  )
}
