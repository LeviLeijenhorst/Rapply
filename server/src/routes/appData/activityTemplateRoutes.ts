import type { Express } from "express"
import { createActivityTemplate, deleteActivityTemplate, updateActivityTemplate } from "../../appData"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import { readActivityTemplate, readId, readOptionalNumber, readOptionalText, readUnixMs } from "../requestParsers"

export function registerActivityTemplateRoutes(app: Express): void {
  app.post(
    "/activity-templates/create",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const template = readActivityTemplate(req.body?.template)
      await createActivityTemplate(user.userId, template)
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/activity-templates/update",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const id = readId(payload.id, "id")
      const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "updatedAtUnixMs")
      await updateActivityTemplate(user.userId, {
        id,
        updatedAtUnixMs,
        name: readOptionalText(payload.name),
        description: readOptionalText(payload.description, true),
        category: readOptionalText(payload.category),
        defaultHours: readOptionalNumber(payload.defaultHours),
        isAdmin: typeof payload.isAdmin === "boolean" ? payload.isAdmin : undefined,
        organizationId: readOptionalText(payload.organizationId, true),
        isActive: typeof payload.isActive === "boolean" ? payload.isActive : undefined,
      })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/activity-templates/delete",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = readId(req.body?.id, "id")
      await deleteActivityTemplate(user.userId, id)
      res.status(200).json({ ok: true })
    }),
  )
}
