import type { Express } from "express"
import { updatePracticeSettings } from "../../appData"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import { readOptionalText, readUnixMs } from "../requestParsers"

// Registers practice settings update endpoint.
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
        tintColor: readOptionalText(payload.tintColor, true),
        logoDataUrl: readOptionalText(payload.logoDataUrl, true),
        updatedAtUnixMs,
      })
      res.status(200).json({ ok: true })
    }),
  )
}

