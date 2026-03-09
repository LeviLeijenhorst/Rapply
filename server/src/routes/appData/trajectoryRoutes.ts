import type { Express } from "express"
import { createTrajectory, deleteTrajectory, updateTrajectory } from "../../appData"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import { readId, readOptionalId, readOptionalNumber, readOptionalText, readUnixMs } from "../parsers/scalars"
import { readTrajectory } from "../parsers/appData"

export function registerTrajectoryRoutes(app: Express): void {
  app.post(
    "/trajectories/create",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const trajectory = readTrajectory(req.body?.trajectory)
      await createTrajectory(user.userId, trajectory)
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/trajectories/update",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const id = readId(payload.id, "id")
      const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "updatedAtUnixMs")
      await updateTrajectory(user.userId, {
        id,
        updatedAtUnixMs,
        clientId: readOptionalId(payload.clientId),
        name: readOptionalText(payload.name),
        serviceType: readOptionalText(payload.serviceType ?? payload.dienstType, true),
        uwvContactName: readOptionalText(payload.uwvContactName, true),
        uwvContactPhone: readOptionalText(payload.uwvContactPhone, true),
        uwvContactEmail: readOptionalText(payload.uwvContactEmail, true),
        orderNumber: readOptionalText(payload.orderNumber, true),
        startDate: readOptionalText(payload.startDate, true),
        planOfAction:
          (payload.planOfAction ?? payload.planVanAanpak) === null
            ? null
            : (payload.planOfAction ?? payload.planVanAanpak) &&
                typeof (payload.planOfAction ?? payload.planVanAanpak) === "object" &&
                typeof (payload.planOfAction ?? payload.planVanAanpak).documentId === "string"
              ? { documentId: (payload.planOfAction ?? payload.planVanAanpak).documentId.trim() }
              : undefined,
        maxHours: readOptionalNumber(payload.maxHours),
        maxAdminHours: readOptionalNumber(payload.maxAdminHours),
      })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/trajectories/delete",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = readId(req.body?.id, "id")
      await deleteTrajectory(user.userId, id)
      res.status(200).json({ ok: true })
    }),
  )
}

