import type { Express } from "express"
import { createTemplate, deleteTemplate, updateTemplate } from "../../appData"
import { requireAuthenticatedUser } from "../../auth"
import { queryOne } from "../../db"
import { env } from "../../env"
import { asyncHandler } from "../../http"
import { createDefaultTemplates } from "../../templates/defaultTemplates"
import { readId } from "../parsers/scalars"
import { readTemplate } from "../parsers/appData"

const fallbackTemplateCutoverDateIso = "2026-02-22T00:00:00.000Z"
const templateCutoverDateUnixMs = Date.parse(env.templateDefaultsCutoverIso || fallbackTemplateCutoverDateIso)

function shouldUseReintegrationDefaults(userCreatedAt: Date | null): boolean {
  if (!Number.isFinite(templateCutoverDateUnixMs)) return true
  if (!userCreatedAt) return false
  return userCreatedAt.getTime() >= templateCutoverDateUnixMs
}

function readDateOrNull(value: unknown): Date | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null
  const timestamp = Date.parse(String(value || ""))
  if (!Number.isFinite(timestamp)) return null
  return new Date(timestamp)
}

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
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const userRow = await queryOne<{ created_at: Date }>(
        `
        select created_at
        from public.users
        where id = $1
        limit 1
        `,
        [user.userId],
      )
      const templateSet = shouldUseReintegrationDefaults(readDateOrNull(userRow?.created_at)) ? "reintegration" : "legacy"
      const templates = createDefaultTemplates({ set: templateSet })
      res.status(200).json({ templates })
    }),
  )
}

