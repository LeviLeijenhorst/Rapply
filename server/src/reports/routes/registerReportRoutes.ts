import type { Express } from "express"
import { requireAuthenticatedUser } from "../../identity/auth"
import { asyncHandler } from "../../http"
import { readReport } from "../readReport"
import { deleteReport, saveReport, updateReportCoaches } from "../store"
import { readId, readUnixMs } from "../../routes/parsers/scalars"

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

  app.post(
    "/reports/update-coaches",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const reportId = readId(payload.reportId, "reportId")
      const coachUserIds = Array.isArray(payload.coachUserIds)
        ? payload.coachUserIds.map((id: unknown) => String(id || "").trim()).filter(Boolean)
        : []
      const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? Date.now(), "updatedAtUnixMs")
      await updateReportCoaches(user.userId, { reportId, coachUserIds, updatedAtUnixMs })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/reports/delete",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const reportId = readId(payload.reportId, "reportId")
      await deleteReport(user.userId, reportId)
      res.status(200).json({ ok: true })
    }),
  )
}
