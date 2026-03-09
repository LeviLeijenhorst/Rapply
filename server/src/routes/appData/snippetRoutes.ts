import type { Express } from "express"
import { createSnippet, deleteSnippet, updateSnippet } from "../../appData"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import { readId, readOptionalText, readUnixMs } from "../parsers/scalars"
import { readOptionalSnippetStatus, readSnippet } from "../parsers/appData"

export function registerSnippetRoutes(app: Express): void {
  app.post(
    "/snippets/create",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const snippet = readSnippet(req.body?.snippet)
      await createSnippet(user.userId, snippet)
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/snippets/update",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const id = readId(payload.id, "id")
      const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "updatedAtUnixMs")
      await updateSnippet(user.userId, {
        id,
        updatedAtUnixMs,
        field: readOptionalText(payload.field),
        text: readOptionalText(payload.text),
        status: readOptionalSnippetStatus(payload.status),
      })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/snippets/delete",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = readId(req.body?.id, "id")
      await deleteSnippet(user.userId, id)
      res.status(200).json({ ok: true })
    }),
  )
}
