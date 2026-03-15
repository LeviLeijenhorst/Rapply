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

      if (!String(transcript || "").trim()) {
        sendError(res, 400, "Missing transcript")
        return
      }

      if (responseMode === "structured_item_summary") {
        const structuredSummary = await generateStructuredItemSummary({ transcript })
        res.status(200).json({ summary: JSON.stringify(structuredSummary) })
        return
      }

      const summary = await generateSummary({ transcript })
      res.status(200).json({ summary })
    }),
  )
}
