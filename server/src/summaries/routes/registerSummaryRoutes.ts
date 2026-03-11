import type { Express, RequestHandler } from "express"
import { requireAuthenticatedUser } from "../../auth"
import { asyncHandler, sendError } from "../../http"
import { generateSummary } from "../generateSummary"
import { readSummaryTemplate } from "../readSummaryTemplate"

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
      const template = readSummaryTemplate(req.body?.template)

      if (!String(transcript || "").trim()) {
        sendError(res, 400, "Missing transcript")
        return
      }

      const summary = await generateSummary({ transcript, template })
      res.status(200).json({ summary })
    }),
  )
}
