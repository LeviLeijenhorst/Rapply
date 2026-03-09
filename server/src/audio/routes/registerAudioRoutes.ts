import type { Express } from "express"
import express from "express"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler, sendError } from "../../http"
import { createAudioBlob, readAudioBlob } from "../audioBlobs"
import { createAudioStream, createAudioStreamChunk, readAudioStreamChunk, readAudioStreamManifest, updateAudioStreamDetails } from "../audioStreams"
import { readId, readRequiredNumber, readText } from "../../routes/parsers/scalars"

// Registers audio blob and stream routes, including raw upload endpoints.
export function registerAudioRoutes(app: Express): void {
  app.post(
    "/audio-blobs",
    express.raw({ type: "*/*", limit: "1024mb" }),
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const mimeType = String(req.headers["content-type"] || "").trim() || "application/octet-stream"
      const body = req.body
      if (!Buffer.isBuffer(body) || body.length === 0) {
        sendError(res, 400, "Missing audio bytes")
        return
      }

      const created = await createAudioBlob({
        userId: user.userId,
        mimeType,
        bytes: body,
        createdAtUnixMs: Date.now(),
      })

      res.status(200).json({ audioBlobId: created.id })
    }),
  )

  app.get(
    "/audio-blobs/:id",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = String(req.params?.id || "").trim()
      if (!id) {
        sendError(res, 400, "Missing id")
        return
      }

      const result = await readAudioBlob({ userId: user.userId, id })
      if (!result) {
        sendError(res, 404, "Audio not found")
        return
      }

      res.setHeader("Content-Type", result.mimeType)
      res.status(200).send(result.bytes)
    }),
  )

  app.post(
    "/audio-streams",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const mimeType = readText(payload.mimeType, "mimeType")
      const created = await createAudioStream({ userId: user.userId, mimeType, createdAtUnixMilliseconds: Date.now() })
      res.status(200).json({ audioStreamId: created.id })
    }),
  )

  app.patch(
    "/audio-streams/:id",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = readId(req.params?.id, "id")
      const payload = req.body || {}
      const totalDurationMilliseconds = readRequiredNumber(payload.totalDurationMilliseconds, "totalDurationMilliseconds")
      const chunkCount = readRequiredNumber(payload.chunkCount, "chunkCount")
      await updateAudioStreamDetails({ userId: user.userId, id, totalDurationMilliseconds, chunkCount })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/audio-streams/:id/chunks",
    express.raw({ type: "*/*", limit: "50mb" }),
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = readId(req.params?.id, "id")
      const chunkIndex = readRequiredNumber(req.headers["x-chunk-index"], "chunkIndex")
      const startMilliseconds = readRequiredNumber(req.headers["x-start-milliseconds"], "startMilliseconds")
      const durationMilliseconds = readRequiredNumber(req.headers["x-duration-milliseconds"], "durationMilliseconds")
      const body = req.body
      if (!Buffer.isBuffer(body) || body.length === 0) {
        sendError(res, 400, "Missing chunk bytes")
        return
      }
      await createAudioStreamChunk({
        userId: user.userId,
        audioStreamId: id,
        chunkIndex,
        startMilliseconds,
        durationMilliseconds,
        bytes: body,
        createdAtUnixMilliseconds: Date.now(),
      })
      res.status(200).json({ ok: true })
    }),
  )

  app.get(
    "/audio-streams/:id/manifest",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = readId(req.params?.id, "id")
      const result = await readAudioStreamManifest({ userId: user.userId, id })
      if (!result) {
        sendError(res, 404, "Audio not found")
        return
      }
      res.status(200).json({
        audioStreamId: result.id,
        mimeType: result.mimeType,
        totalDurationMilliseconds: result.totalDurationMilliseconds,
        chunkCount: result.chunkCount,
        chunks: result.chunks,
      })
    }),
  )

  app.get(
    "/audio-streams/:id/chunks/:chunkIndex",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = readId(req.params?.id, "id")
      const chunkIndex = readRequiredNumber(req.params?.chunkIndex, "chunkIndex")
      const result = await readAudioStreamChunk({ userId: user.userId, id, chunkIndex })
      if (!result) {
        sendError(res, 404, "Audio not found")
        return
      }
      res.setHeader("Content-Type", "application/octet-stream")
      res.status(200).send(result.bytes)
    }),
  )
}
