import type { Express } from "express"
import { createClient, deleteClient, updateClient } from "../../appData"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import { readId, readOptionalText, readUnixMs } from "../parsers/scalars"
import { readClient } from "../parsers/appData"

// Registers client create, update, and delete endpoints.
export function registerClientRoutes(app: Express): void {
  app.post(
    "/clients/create",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const client = readClient(req.body?.client)
      await createClient(user.userId, client)
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/clients/update",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const id = readId(payload.id, "id")
      const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "updatedAtUnixMs")
      const name = readOptionalText(payload.name)
      const clientDetails = readOptionalText(payload.clientDetails, true)
      const employerDetails = readOptionalText(payload.employerDetails, true)
      const firstSickDay = readOptionalText(payload.firstSickDay, true)
      const isArchived = typeof payload.isArchived === "boolean" ? payload.isArchived : undefined
      await updateClient(user.userId, { id, name, clientDetails, employerDetails, firstSickDay, isArchived, updatedAtUnixMs })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/clients/delete",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = readId(req.body?.id, "id")
      await deleteClient(user.userId, id)
      res.status(200).json({ ok: true })
    }),
  )
}

