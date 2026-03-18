import type { Express, RequestHandler } from "express"
import { completeAzureOpenAiChat } from "../../ai/azureOpenAi"
import { normalizeNumber, normalizeText } from "../../ai/shared/normalize"
import { stripJsonCodeFences } from "../../ai/shared/textSanitization"
import { requireAuthenticatedUser } from "../../identity/auth"
import { queryOne } from "../../db"
import { asyncHandler, sendError } from "../../http"
import { readId, readOptionalText, readUnixMs } from "../../routes/parsers/scalars"
import {
  extractSnippets,
  getSnippetQuestionForField,
  isSupportedSnippetField,
  normalizeSnippetFieldName,
  readSnippetExtractionDeploymentCandidates,
  snippetExtractionSystemPrompt,
} from "../extractSnippets"
import { readOptionalSnippetStatus, readSnippet } from "../readSnippets"
import { createSnippet, deleteSnippet, updateSnippet } from "../store"
import { canUserAccessClient } from "../../access/clientAccess"
import { sanitizeSnippetText } from "../sanitizeSnippetText"

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

function readNormalizedLabelList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const labels: string[] = []
  const seen = new Set<string>()
  for (const item of value) {
    const normalized = normalizeText(item)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    labels.push(normalized)
  }
  return labels
}

function isRecordedSummaryInputType(value: string): boolean {
  const normalized = normalizeText(value).toLowerCase()
  return normalized === "recording" || normalized === "spoken_recap" || normalized === "spoken"
}

// Reads snippet text from strict JSON model output.
function readSnippetTextFromModelResponse(rawText: string): string {
  const stripped = stripJsonCodeFences(rawText)
  if (!stripped) return ""
  try {
    const parsed = JSON.parse(stripped) as { text?: unknown; snippet?: { text?: unknown } }
    if (typeof parsed?.text === "string") return sanitizeSnippetText(parsed.text)
    if (typeof parsed?.snippet?.text === "string") return sanitizeSnippetText(parsed.snippet.text)
  } catch {
    return ""
  }
  return ""
}

function isMissingAzureDeploymentError(error: unknown): boolean {
  const message = String(error instanceof Error ? error.message : error || "").toLowerCase()
  return message.includes("resource not found") || message.includes("deploymentnotfound")
}

async function completeSnippetModelWithFallback(messages: Array<{ role: "system" | "user"; content: string }>): Promise<string> {
  const deployments = readSnippetExtractionDeploymentCandidates()
  if (deployments.length === 0) throw new Error("Azure OpenAI snippet extraction deployment is not configured")

  let lastError: unknown = null
  for (const deployment of deployments) {
    try {
      return await completeAzureOpenAiChat({
        deployment,
        temperature: 0,
        messages,
      })
    } catch (error) {
      lastError = error
      if (!isMissingAzureDeploymentError(error)) throw error
    }
  }
  throw (lastError as Error) || new Error("Azure OpenAI snippet extraction failed")
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
        fieldId: readOptionalText(payload.fieldId ?? payload.field),
        fieldIds: readNormalizedLabelList(payload.fieldIds ?? payload.fields),
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
      let resolvedTrajectoryId = trajectoryId
      if (!clientId || !resolvedTrajectoryId) {
        const sessionRow = await queryOne<{ client_id: string | null; trajectory_id: string | null }>(
          `
          select client_id, trajectory_id
          from public.inputs
          where id = $1
          `,
          [sourceSessionId],
        )
        if (sessionRow?.client_id) {
          const allowed = await canUserAccessClient(user.userId, sessionRow.client_id)
          if (!allowed) return sendError(res, 403, "Forbidden")
        }
        if (!clientId) {
          clientId = normalizeText(sessionRow?.client_id)
        }
        if (!resolvedTrajectoryId) {
          resolvedTrajectoryId = normalizeText(sessionRow?.trajectory_id)
        }
      }
      const shouldLogRecordedSummaryDebug = isRecordedSummaryInputType(sourceInputType)
      if (shouldLogRecordedSummaryDebug) {
        console.log(
          "[snippet-debug:recorded-summary] transcript",
          JSON.stringify({
            sourceSessionId,
            clientId,
            trajectoryId: resolvedTrajectoryId || null,
            sourceInputType,
            transcript,
          }),
        )
      }

      const extracted = await extractSnippets({ transcript, sourceInputType, includeDebug: shouldLogRecordedSummaryDebug })
      if (shouldLogRecordedSummaryDebug) {
        const debugChunks = Array.isArray(extracted.debugChunks) ? extracted.debugChunks : []
        for (const chunk of debugChunks) {
          console.log(
            "[snippet-debug:recorded-summary] prompt",
            JSON.stringify({
              sourceSessionId,
              sourceInputType,
              chunkIndex: chunk.chunkIndex,
              systemPrompt: snippetExtractionSystemPrompt,
              userPrompt: chunk.promptUsed,
            }),
          )
          console.log(
            "[snippet-debug:recorded-summary] result",
            JSON.stringify({
              sourceSessionId,
              sourceInputType,
              chunkIndex: chunk.chunkIndex,
              rawModelResponse: chunk.rawModelResponse,
              parsedSnippets: chunk.parsedSnippets,
            }),
          )
        }
      }

      const now = Date.now()
      const created: Array<{
        id: string
        clientId: string | null
        trajectoryId: string | null
        sourceSessionId: string
        sourceInputId: string
        fieldIds: string[]
        snippetType: string
        fieldId: string
        text: string
        snippetDate: number
        approvalStatus: "pending"
        createdAtUnixMs: number
        updatedAtUnixMs: number
      }> = []

      for (const snippet of extracted.snippets) {
        const labels = snippet.fields.length > 0 ? snippet.fields : ["general"]
        const sanitizedText = sanitizeSnippetText(snippet.text)
        if (!sanitizedText) continue
        const snippetRow = {
          id: `snippet-${crypto.randomUUID()}`,
          clientId: clientId || null,
          trajectoryId: resolvedTrajectoryId || null,
          sourceSessionId,
          sourceInputId: sourceSessionId,
          fieldIds: labels,
          snippetType: labels[0],
          fieldId: labels[0],
          text: sanitizedText,
          snippetDate: itemDate,
          approvalStatus: "pending" as const,
          createdAtUnixMs: now,
          updatedAtUnixMs: now,
        }
        if (clientId) {
          await createSnippet(user.userId, {
            ...snippetRow,
            clientId,
          })
        }
        created.push(snippetRow)
      }

      res.status(200).json({ snippets: created })
    }),
  )

  app.post(
    "/ai/snippet-classify-fields",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      const transcript = normalizeText(req.body?.transcript)
      const sourceInputType = normalizeText(req.body?.sourceInputType).toLowerCase()
      if (!transcript) return sendError(res, 400, "Missing transcript")

      const extracted = await extractSnippets({ transcript, sourceInputType })
      const fields = Array.from(
        new Set(
          extracted.snippets
            .flatMap((snippet) => (Array.isArray(snippet.fields) ? snippet.fields : []))
            .map((field) => normalizeText(field))
            .filter(Boolean),
        ),
      ).sort()

      res.status(200).json({ fields: fields.length > 0 ? fields : ["general"] })
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

      const rawModelText = await completeSnippetModelWithFallback([
        { role: "system", content: "You output strict JSON only. No markdown. No prose." },
        { role: "user", content: prompt },
      ])
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

      const rawModelText = await completeSnippetModelWithFallback([
        { role: "system", content: "You output strict JSON only. No markdown. No prose." },
        { role: "user", content: prompt },
      ])
      const text = readSnippetTextFromModelResponse(rawModelText)
      if (!text) return sendError(res, 502, "No snippet text returned")
      res.status(200).json({ text })
    }),
  )
}
