import type { Express } from "express"
import { createTemplate, deleteTemplate, updateTemplate } from "../../appData"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import { createDefaultTemplates } from "../../templates/defaultTemplates"
import { readId, readTemplate } from "../requestParsers"

// Registers template create, update, delete, and default-list endpoints.
export function registerTemplateRoutes(app: Express): void {
  app.post(
    "/templates/create",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const template = readTemplate(req.body?.template)
      await createTemplate(user.userId, template)
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/templates/update",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const template = readTemplate(req.body?.template)
      await updateTemplate(user.userId, template)
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/templates/delete",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = readId(req.body?.id, "id")
      await deleteTemplate(user.userId, id)
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/templates/defaults",
    asyncHandler(async (_req, res) => {
      const templates = createDefaultTemplates()
      res.status(200).json({ templates })
    }),
  )
}

