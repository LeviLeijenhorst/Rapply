import type { Express } from "express"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import { readOptionalText, readUnixMs } from "../../routes/parsers/scalars"
import { updatePracticeSettings } from "../store"

export function registerPracticeSettingsRoutes(app: Express): void {
  app.post(
    "/practice-settings/update",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "updatedAtUnixMs")
      await updatePracticeSettings(user.userId, {
        practiceName: readOptionalText(payload.practiceName, true),
        website: readOptionalText(payload.website, true),
        visitAddress: readOptionalText(payload.visitAddress, true),
        postalAddress: readOptionalText(payload.postalAddress, true),
        postalCodeCity: readOptionalText(payload.postalCodeCity, true),
        contactName: readOptionalText(payload.contactName, true),
        contactRole: readOptionalText(payload.contactRole, true),
        contactPhone: readOptionalText(payload.contactPhone, true),
        contactEmail: readOptionalText(payload.contactEmail, true),
        tintColor: readOptionalText(payload.tintColor, true),
        logoDataUrl: readOptionalText(payload.logoDataUrl, true),
        updatedAtUnixMs,
      })
      res.status(200).json({ ok: true })
    }),
  )
}
