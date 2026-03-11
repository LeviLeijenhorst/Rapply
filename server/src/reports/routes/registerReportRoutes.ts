import type { Express } from "express"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import { readReport } from "../readReport"
import { saveReport } from "../store"

const reportSaveRoutePath = "/reports/save"
// Older clients still post written reports to this route.
const legacyWrittenReportSaveRoutePath = "/written-reports/set"

// Registers report save routes for current and older clients.
export function registerReportRoutes(app: Express): void {
  const saveRoute = asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const report = readReport(req.body?.report)
    await saveReport(user.userId, report)
    res.status(200).json({ ok: true })
  })

  app.post(reportSaveRoutePath, saveRoute)
  app.post(legacyWrittenReportSaveRoutePath, saveRoute)
}
