import type { Express } from "express"
import { requireAuthenticatedUser } from "../../identity/auth"
import * as e2ee from "../../encryption/e2ee"
import { asyncHandler, sendError } from "../../http"
import type { RegisterE2eeRoutesParams } from "./types"

// Registers E2EE bootstrap and user key-material read endpoints.
export function registerE2eeMaterialRoutes(app: Express, params: RegisterE2eeRoutesParams): void {
  app.post(
    "/e2ee/bootstrap",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      await e2ee.ensureServerManagedUserKey({ userId: user.userId, nowUnixMs: Date.now() })
      const result = await e2ee.bootstrap({ userId: user.userId })
      res.status(200).json(result)
    }),
  )

  app.post(
    "/e2ee/user-key-material",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const material = await e2ee.readUserKeyMaterial({ userId: user.userId })
      if (!material) {
        sendError(res, 404, "E2EE not configured")
        return
      }
      res.status(200).json(material)
    }),
  )

  app.post(
    "/e2ee/server-managed/unlock",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const unlocked = await e2ee.readServerManagedArkBytes({ userId: user.userId })
      if (!unlocked) {
        sendError(res, 409, "Server-managed key is not available for this account")
        return
      }
      res.status(200).json({
        arkBase64: Buffer.from(unlocked.arkBytes).toString("base64"),
        keyVersion: unlocked.keyVersion,
      })
    }),
  )
}
