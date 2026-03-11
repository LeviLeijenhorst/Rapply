import type { Express } from "express"
import { requireAuthenticatedUser } from "../../identity/auth"
import { asyncHandler } from "../../http"
import { readReport } from "../readReport"
import { saveReport } from "../store"

const reportSaveRoutePath = "/reports/save"

// Registers report save route.
export function registerReportRoutes(app: Express): void {
  const saveRoute = asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const report = readReport(req.body?.report)
    await saveReport(user.userId, report)
    res.status(200).json({ ok: true })
  })

  app.post(reportSaveRoutePath, saveRoute)
}
