import type { Express } from "express"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import { updateUserDisplayName } from "../../users"

export function registerAccountRoutes(app: Express): void {
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
