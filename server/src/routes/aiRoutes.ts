import type { Express, RequestHandler } from "express"
import { requireAuthenticatedUser } from "../auth"
import { completeChatWithAzureOpenAi } from "../chat/azureOpenAiChat"
import { asyncHandler, sendError } from "../http"
import { generateSummary } from "../summary/summary"
import { readSummaryTemplate } from "./requestParsers"

type RegisterAiRoutesParams = {
  rateLimitAi: RequestHandler
}

// Registers AI endpoints for chat completions and summary generation.
export function registerAiRoutes(app: Express, params: RegisterAiRoutesParams): void {
  app.post(
    "/chat",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)

      const messages = req.body?.messages
      const temperature = req.body?.temperature
      const scope = req.body?.scope
      const sessionId = req.body?.sessionId

      const text = await completeChatWithAzureOpenAi({ messages, temperature, scope, sessionId })
      res.status(200).json({ text })
    }),
  )

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
