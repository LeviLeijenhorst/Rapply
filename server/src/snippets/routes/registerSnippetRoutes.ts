import type { Express, RequestHandler } from "express"
import { completeAzureOpenAiChat } from "../../ai/azureOpenAi"
import { normalizeNumber, normalizeText } from "../../ai/shared/normalize"
import { stripJsonCodeFences } from "../../ai/shared/textSanitization"
import { requireAuthenticatedUser } from "../../identity/auth"
import { queryOne } from "../../db"
import { env } from "../../env"
import { asyncHandler, sendError } from "../../http"
import { readId, readOptionalText, readUnixMs } from "../../routes/parsers/scalars"
import { extractSnippets, getSnippetQuestionForField, isSupportedSnippetField, normalizeSnippetFieldName } from "../extractSnippets"
import { readOptionalSnippetStatus, readSnippet } from "../readSnippets"
import { createSnippet, deleteSnippet, updateSnippet } from "../store"

type RegisterSnippetRoutesParams = {
  rateLimitAi: RequestHandler
}

// Validates field input and loads its question text.
function resolveSnippetFieldContext(rawField: unknown): { field: string; question: string } | null {
  const normalizedField = normalizeSnippetFieldName(rawField)
  if (normalizedField && isSupportedSnippetField(normalizedField)) {
    return { field: normalizedField, question: getSnippetQuestionForField(normalizedField) }
  }
  return null
}

// Reads snippet text from strict JSON model output.
function readSnippetTextFromModelResponse(rawText: string): string {
  const stripped = stripJsonCodeFences(rawText)
  if (!stripped) return ""
  try {
    const parsed = JSON.parse(stripped) as { text?: unknown; snippet?: { text?: unknown } }
    if (typeof parsed?.text === "string") return normalizeText(parsed.text)
    if (typeof parsed?.snippet?.text === "string") return normalizeText(parsed.snippet.text)
  } catch {
    return ""
  }
  return ""
}

// Registers snippet CRUD and AI routes.
export function registerSnippetRoutes(app: Express, params: RegisterSnippetRoutesParams): void {
  app.post(
    "/snippets/create",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const snippet = readSnippet(req.body?.snippet)
      await createSnippet(user.userId, snippet)
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/snippets/update",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const payload = req.body || {}
      const id = readId(payload.id, "id")
      const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs, "updatedAtUnixMs")
      await updateSnippet(user.userId, {
        id,
        updatedAtUnixMs,
        snippetType: readOptionalText(payload.snippetType ?? payload.field),
        text: readOptionalText(payload.text),
        approvalStatus: readOptionalSnippetStatus(payload.approvalStatus ?? payload.status),
      })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/snippets/delete",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const id = readId(req.body?.id, "id")
      await deleteSnippet(user.userId, id)
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/ai/snippet-extract",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const sourceSessionId = normalizeText(req.body?.sourceSessionId || req.body?.itemId)
      const trajectoryId = normalizeText(req.body?.trajectoryId)
      const transcript = normalizeText(req.body?.transcript)
      const sourceInputType = normalizeText(req.body?.sourceInputType).toLowerCase()
      const itemDate = normalizeNumber(req.body?.itemDate)
      if (!sourceSessionId) return sendError(res, 400, "Missing sourceSessionId")
      if (!transcript) return sendError(res, 400, "Missing transcript")
      if (itemDate === null) return sendError(res, 400, "Missing itemDate")

      let clientId = normalizeText(req.body?.clientId)
      if (!clientId) {
        const sessionRow = await queryOne<{ client_id: string | null }>(
          `
          select client_id
          from public.inputs
          where id = $1 and owner_user_id = $2
          `,
          [sourceSessionId, user.userId],
        )
        clientId = normalizeText(sessionRow?.client_id)
      }
      if (!clientId) return sendError(res, 400, "Missing clientId")

      const extracted = await extractSnippets({ transcript, sourceInputType })
      const now = Date.now()
      const created: Array<{
        id: string
        clientId: string
        trajectoryId: string
        sourceSessionId: string
        snippetType: string
        text: string
        snippetDate: number
        approvalStatus: "pending"
        createdAtUnixMs: number
        updatedAtUnixMs: number
      }> = []

      for (const snippet of extracted.snippets) {
        const snippetRow = {
          id: `snippet-${crypto.randomUUID()}`,
          clientId,
          trajectoryId: trajectoryId || "",
          sourceSessionId,
          snippetType: snippet.field,
          text: snippet.text,
          snippetDate: itemDate,
          approvalStatus: "pending" as const,
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
        }
        await createSnippet(user.userId, snippetRow)
        created.push(snippetRow)
      }

      res.status(200).json({ snippets: created })
    }),
  )

  app.post(
    "/snippet-edit",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      const fieldContext = resolveSnippetFieldContext(req.body?.field)
      const snippetText = normalizeText(req.body?.snippetText)
      const transcript = normalizeText(req.body?.transcript)
      if (!fieldContext) return sendError(res, 400, "Invalid field")
      if (!snippetText) return sendError(res, 400, "Missing snippetText")
      if (!transcript) return sendError(res, 400, "Missing transcript")

      const deployment = normalizeText(env.azureOpenAiSummaryDeployment) || normalizeText(env.azureOpenAiChatDeployment)
      if (!deployment) throw new Error("Azure OpenAI snippet extraction deployment is not configured")

      const prompt = [
        "Herschrijf het snippet zodat het een korte feitelijke zin is voor re-integratie rapportage.",
        "Behoud alleen informatie die uit het transcript volgt.",
        "Voeg geen nieuwe informatie toe.",
        `Categorie-vraag: ${fieldContext.question}`,
        "",
        `Huidige snippet: ${snippetText}`,
        "",
        "Transcript:",
        transcript,
        "",
        'Return strict JSON only: {"text":"string"}',
      ].join("\n")

      const rawModelText = await completeAzureOpenAiChat({
        deployment,
        temperature: 0,
        messages: [
          { role: "system", content: "You output strict JSON only. No markdown. No prose." },
          { role: "user", content: prompt },
        ],
      })
      const text = readSnippetTextFromModelResponse(rawModelText)
      if (!text) return sendError(res, 502, "No snippet text returned")
      res.status(200).json({ text })
    }),
  )

  app.post(
    "/snippet-overwrite",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      const fieldContext = resolveSnippetFieldContext(req.body?.field)
      const transcript = normalizeText(req.body?.transcript)
      if (!fieldContext) return sendError(res, 400, "Invalid field")
      if (!transcript) return sendError(res, 400, "Missing transcript")

      const deployment = normalizeText(env.azureOpenAiSummaryDeployment) || normalizeText(env.azureOpenAiChatDeployment)
      if (!deployment) throw new Error("Azure OpenAI snippet extraction deployment is not configured")

      const prompt = [
        "Genereer precies een sterk evidence-snippet voor de categorie-vraag hieronder.",
        "Als er geen sterk feitelijk bewijs is in het transcript, geef lege text terug.",
        "Gebruik een korte feitelijke zin.",
        `Categorie-vraag: ${fieldContext.question}`,
        "",
        "Transcript:",
        transcript,
        "",
        `Return strict JSON only: {"snippet":{"field":"${fieldContext.field}","text":"string"}}`,
      ].join("\n")

      const rawModelText = await completeAzureOpenAiChat({
        deployment,
        temperature: 0,
        messages: [
          { role: "system", content: "You output strict JSON only. No markdown. No prose." },
          { role: "user", content: prompt },
        ],
      })
      const text = readSnippetTextFromModelResponse(rawModelText)
      if (!text) return sendError(res, 502, "No snippet text returned")
      res.status(200).json({ text })
    }),
  )
}
