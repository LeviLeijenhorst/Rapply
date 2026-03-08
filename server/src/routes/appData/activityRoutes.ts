import type { Express } from "express"
import { createActivity, deleteActivity, updateActivity } from "../../appData"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import {
  readActivity,
  readId,
  readOptionalActivitySource,
  readOptionalActivityStatus,
  readOptionalId,
  readOptionalNumber,
  readOptionalText,
  readUnixMs,
} from "../requestParsers"

export function registerActivityRoutes(app: Express): void {
  app.post(
    "/activities/create",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const activity = readActivity(req.body?.activity)
      await createActivity(user.userId, activity)
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/activities/update",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const id = readId(payload.id, "id")
      const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "updatedAtUnixMs")
      await updateActivity(user.userId, {
        id,
        updatedAtUnixMs,
        trajectoryId: readOptionalId(payload.trajectoryId),
        sessionId: payload.sessionId === null ? null : readOptionalId(payload.sessionId),
        templateId: payload.templateId === null ? null : readOptionalId(payload.templateId),
        name: readOptionalText(payload.name),
        category: readOptionalText(payload.category),
        status: readOptionalActivityStatus(payload.status),
        plannedHours: readOptionalNumber(payload.plannedHours),
        actualHours: readOptionalNumber(payload.actualHours),
        source: readOptionalActivitySource(payload.source),
        isAdmin: typeof payload.isAdmin === "boolean" ? payload.isAdmin : undefined,
      })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/activities/delete",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = readId(req.body?.id, "id")
      await deleteActivity(user.userId, id)
      res.status(200).json({ ok: true })
    }),
  )
}
