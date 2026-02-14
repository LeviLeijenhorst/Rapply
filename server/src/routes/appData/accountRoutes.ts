import type { Express } from "express"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import { updateUserDisplayName } from "../../users"

// Registers account profile endpoints scoped to app data settings.
export function registerAppDataAccountRoutes(app: Express): void {
  app.post(
    "/account/displayName",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const displayName = typeof req.body?.displayName === "string" ? req.body.displayName : null
      await updateUserDisplayName({ userId: user.userId, displayName })
      res.status(200).json({ ok: true })
    }),
  )
}

