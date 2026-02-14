import type { Express } from "express"
import { requireAuthenticatedUser } from "../../auth"
import * as e2eeV2 from "../../e2eeV2"
import { asyncHandler, sendError } from "../../http"
import type { RegisterE2eeRoutesParams } from "./types"

// Registers E2EE bootstrap and user key-material read endpoints.
export function registerE2eeMaterialRoutes(app: Express, params: RegisterE2eeRoutesParams): void {
  app.post(
    "/e2ee/v2/bootstrap",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const result = await e2eeV2.bootstrap({ userId: user.userId })
      res.status(200).json(result)
    }),
  )

  app.post(
    "/e2ee/v2/user-key-material",
    params.rateLimitAccount,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const material = await e2eeV2.readUserKeyMaterial({ userId: user.userId })
      if (!material) {
        sendError(res, 404, "E2EE not configured")
        return
      }
      res.status(200).json(material)
    }),
  )
}

