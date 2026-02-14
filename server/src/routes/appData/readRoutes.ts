import type { Express } from "express"
import { readAppData } from "../../appData"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"

// Registers the endpoint that reads full app data for the authenticated user.
export function registerAppDataReadRoutes(app: Express): void {
  app.post(
    "/app-data",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const data = await readAppData(user.userId)
      res.status(200).json(data)
    }),
  )
}

