import type { Express } from "express"
import { createCoachee, deleteCoachee, updateCoachee } from "../../appData"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import { readCoachee, readId, readOptionalText, readUnixMs } from "../requestParsers"

// Registers coachee create, update, and delete endpoints.
export function registerCoacheeRoutes(app: Express): void {
  app.post(
    "/coachees/create",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const coachee = readCoachee(req.body?.coachee)
      await createCoachee(user.userId, coachee)
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/coachees/update",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const id = readId(payload.id, "id")
      const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "updatedAtUnixMs")
      const name = readOptionalText(payload.name)
      const isArchived = typeof payload.isArchived === "boolean" ? payload.isArchived : undefined
      await updateCoachee(user.userId, { id, name, isArchived, updatedAtUnixMs })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/coachees/delete",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = readId(req.body?.id, "id")
      await deleteCoachee(user.userId, id)
      res.status(200).json({ ok: true })
    }),
  )
}

