import type { Express } from "express"
import { upsertReport } from "../../appData"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import { readReport } from "../parsers/appData"

// Registers written report upsert endpoint.
export function registerWrittenReportRoutes(app: Express): void {
  app.post(
    "/written-reports/set",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const report = readReport(req.body?.report)
      await upsertReport(user.userId, report)
      res.status(200).json({ ok: true })
    }),
  )
}

