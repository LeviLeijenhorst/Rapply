import type { Express, RequestHandler } from "express"
import { requireAuthenticatedUser } from "../../identity/auth"
import { asyncHandler, sendError } from "../../http"
import { generateSummary } from "../generateSummary"
import { generateStructuredItemSummary } from "../generateStructuredItemSummary"

type RegisterSummaryRoutesParams = {
  rateLimitAi: RequestHandler
}

// Registers summary routes.
export function registerSummaryRoutes(app: Express, params: RegisterSummaryRoutesParams): void {
  app.post(
    "/summary/generate",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)

      const transcript = typeof req.body?.transcript === "string" ? req.body.transcript : ""
      const responseMode = String(req.body?.responseMode || "markdown").trim().toLowerCase()
      const sourceInputType = String(req.body?.sourceInputType || "").trim().toLowerCase()
      const sourceSessionId = String(req.body?.sourceSessionId || req.body?.inputId || "").trim()
      const explicitDebug = req.body?.debugSummary === true
      const includeDebug = explicitDebug || sourceInputType === "recording" || sourceInputType === "spoken_recap" || sourceInputType === "spoken"

      if (!String(transcript || "").trim()) {
        sendError(res, 400, "Missing transcript")
        return
      }

      if (responseMode === "structured_item_summary") {
        const keys = Array.isArray(req.body?.keys)
          ? (req.body.keys as unknown[]).map((k) => String(k || "").trim()).filter(Boolean)
          : []
        const structuredSummary = await generateStructuredItemSummary({
          transcript,
          keys,
          includeDebug,
          debugContext: { sourceInputType, sourceSessionId },
        })
        res.status(200).json({ summary: JSON.stringify(structuredSummary) })
        return
      }

      const summary = await generateSummary({
        transcript,
        includeDebug,
        debugContext: { sourceInputType, sourceSessionId },
      })
      res.status(200).json({ summary })
    }),
  )
}
