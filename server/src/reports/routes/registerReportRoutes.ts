import type { Express } from "express"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler } from "../../http"
import { readReportInput } from "../readReportInput"
import { saveReport } from "../store"

export function registerReportRoutes(app: Express): void {
  const saveRoute = asyncHandler(async (req, res) => {
    const user = await requireAuthenticatedUser(req)
    const report = readReportInput(req.body?.report)
    await saveReport(user.userId, report)
    res.status(200).json({ ok: true })
  })

  app.post("/reports/save", saveRoute)
  app.post("/written-reports/set", saveRoute)
}
