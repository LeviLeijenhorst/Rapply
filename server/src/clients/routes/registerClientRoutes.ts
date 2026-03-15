import type { Express } from "express"
import { requireAuthenticatedUser } from "../../identity/auth"
import { asyncHandler } from "../../http"
import { readId, readOptionalText, readUnixMs } from "../../routes/parsers/scalars"
import { readClientInput } from "../readClientInput"
import {
  assignCoachToClient,
  createClient,
  deleteClient,
  listAssignedCoachesForClient,
  listOrganizationCoachesForClient,
  unassignCoachFromClient,
  updateClient,
  updateClientPrimaryCoach,
} from "../store"

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
    const trajectoryStartDate = readOptionalText(payload.trajectoryStartDate, true)
    const trajectoryEndDate = readOptionalText(payload.trajectoryEndDate, true)
    const isArchived = typeof payload.isArchived === "boolean" ? payload.isArchived : undefined
    await updateClient(user.userId, { id, name, clientDetails, employerDetails, trajectoryStartDate, trajectoryEndDate, isArchived, updatedAtUnixMs })
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

  app.post(
    "/clients/assigned-coaches",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const clientId = readId(req.body?.clientId, "clientId")
      const coaches = await listAssignedCoachesForClient(user.userId, clientId)
      res.status(200).json({ coaches })
    }),
  )

  app.post(
    "/clients/organization-coaches",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const clientId = readId(req.body?.clientId, "clientId")
      const coaches = await listOrganizationCoachesForClient(user.userId, clientId)
      res.status(200).json({ coaches })
    }),
  )

  app.post(
    "/clients/assign-coach",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const clientId = readId(payload.clientId, "clientId")
      const coachUserId = readId(payload.coachUserId, "coachUserId")
      const role = readOptionalText(payload.role, true) ?? "coach"
      const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs ?? Date.now(), "createdAtUnixMs")
      await assignCoachToClient(user.userId, { clientId, coachUserId, role, createdAtUnixMs })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/clients/unassign-coach",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const clientId = readId(payload.clientId, "clientId")
      const coachUserId = readId(payload.coachUserId, "coachUserId")
      await unassignCoachFromClient(user.userId, { clientId, coachUserId })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/clients/update-primary-coach",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const clientId = readId(payload.clientId, "clientId")
      const coachUserId = readId(payload.coachUserId, "coachUserId")
      await updateClientPrimaryCoach(user.userId, { clientId, coachUserId })
      res.status(200).json({ ok: true })
    }),
  )
}

