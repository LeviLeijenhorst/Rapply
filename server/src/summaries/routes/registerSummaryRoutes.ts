import type { Express, RequestHandler } from "express"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler, sendError } from "../../http"
import { generateSessionSummary } from "../generateSessionSummary"
import { readSummaryTemplate } from "../readSummaryTemplate"

type RegisterSummaryRoutesParams = {
  rateLimitAi: RequestHandler
}

export function registerSummaryRoutes(app: Express, params: RegisterSummaryRoutesParams): void {
  app.post(
    "/summary/generate",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)

      const transcript = typeof req.body?.transcript === "string" ? req.body.transcript : ""
      const template = readSummaryTemplate(req.body?.template)
      const responseMode = req.body?.responseMode === "structured_item_summary" ? "structured_item_summary" : "markdown"

      if (!String(transcript || "").trim()) {
        sendError(res, 400, "Missing transcript")
        return
      }

      const summary = await generateSessionSummary({ transcript, template, responseMode })
      res.status(200).json({ summary })
    }),
  )
}
