import type { Express } from "express"
import { createNote, deleteNote, updateNote } from "../../appData"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import { readId, readNote, readText, readUnixMs } from "../requestParsers"

// Registers note create, update, and delete endpoints.
export function registerNoteRoutes(app: Express): void {
  app.post(
    "/notes/create",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const note = readNote(req.body?.note)
      await createNote(user.userId, note)
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/notes/update",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const id = readId(payload.id, "id")
      const text = readText(payload.text, "text")
      const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "updatedAtUnixMs")
      await updateNote(user.userId, { id, text, updatedAtUnixMs })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/notes/delete",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = readId(req.body?.id, "id")
      await deleteNote(user.userId, id)
      res.status(200).json({ ok: true })
    }),
  )
}

