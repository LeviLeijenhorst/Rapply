import type { Express } from "express"
import { requireAuthenticatedUser } from "../../identity/auth"
import { asyncHandler } from "../../http"
import { readWorkspaceData } from "../readWorkspaceData"

export function registerWorkspaceRoutes(app: Express): void {
  app.post(
    "/app-data",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const data = await readWorkspaceData(user.userId)
      res.status(200).json(data)
    }),
  )
}
