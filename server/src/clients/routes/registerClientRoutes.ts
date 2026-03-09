import type { Express } from "express"
import { readClientInput } from "../readClientInput"
import { createClient, deleteClient, updateClient } from "../store"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import { readId, readOptionalText, readUnixMs } from "../../routes/parsers/scalars"

export function registerClientRoutes(app: Express): void {
  const createRoute = asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const client = readClientInput(req.body?.client ?? req.body?.coachee)
    await createClient(user.userId, client)
    res.status(200).json({ ok: true })
  })

  const updateRoute = asyncHandler(async (req, res) => {
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
  })

  const deleteRoute = asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const id = readId(req.body?.id, "id")
    await deleteClient(user.userId, id)
    res.status(200).json({ ok: true })
  })

  app.post("/clients/create", createRoute)
  app.post("/clients/update", updateRoute)
  app.post("/clients/delete", deleteRoute)
  app.post("/coachees/create", createRoute)
  app.post("/coachees/update", updateRoute)
  app.post("/coachees/delete", deleteRoute)
}
