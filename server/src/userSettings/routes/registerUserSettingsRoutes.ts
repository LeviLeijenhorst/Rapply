import type { Express } from "express"
import { requireAuthenticatedUser } from "../../identity/auth"
import { asyncHandler } from "../../http"
import { readOptionalText, readUnixMs } from "../../routes/parsers/scalars"
import { updateUserSettings } from "../store"

export function registerUserSettingsRoutes(app: Express): void {
  app.post(
    "/user-settings/update",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "updatedAtUnixMs")
      await updateUserSettings(user.userId, {
        contactName: readOptionalText(payload.contactName, true),
        contactRole: readOptionalText(payload.contactRole, true),
        contactPhone: readOptionalText(payload.contactPhone, true),
        contactEmail: readOptionalText(payload.contactEmail, true),
        updatedAtUnixMs,
      })
      res.status(200).json({ ok: true })
    }),
  )
}
