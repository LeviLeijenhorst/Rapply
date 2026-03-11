import type { Express } from "express"
import { requireAuthenticatedUser } from "../../identity/auth"
import { asyncHandler } from "../../http"
import { readOptionalText, readUnixMs } from "../../routes/parsers/scalars"
import { updateOrganizationSettings } from "../store"

export function registerOrganizationSettingsRoutes(app: Express): void {
  app.post(
    "/organization-settings/update",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "updatedAtUnixMs")
      await updateOrganizationSettings(user.userId, {
        practiceName: readOptionalText(payload.practiceName, true),
        website: readOptionalText(payload.website, true),
        visitAddress: readOptionalText(payload.visitAddress, true),
        postalAddress: readOptionalText(payload.postalAddress, true),
        postalCodeCity: readOptionalText(payload.postalCodeCity, true),
        tintColor: readOptionalText(payload.tintColor, true),
        logoDataUrl: readOptionalText(payload.logoDataUrl, true),
        updatedAtUnixMs,
      })
      res.status(200).json({ ok: true })
    }),
  )
}
