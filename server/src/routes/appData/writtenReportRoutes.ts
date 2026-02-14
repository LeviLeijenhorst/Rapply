import type { Express } from "express"
import { setWrittenReport } from "../../appData"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import { readWrittenReport } from "../requestParsers"

// Registers written report upsert endpoint.
export function registerWrittenReportRoutes(app: Express): void {
  app.post(
    "/written-reports/set",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const report = readWrittenReport(req.body?.report)
      await setWrittenReport(user.userId, report)
      res.status(200).json({ ok: true })
    }),
  )
}

