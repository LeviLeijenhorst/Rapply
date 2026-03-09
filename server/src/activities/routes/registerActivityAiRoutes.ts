import type { Express, RequestHandler } from "express"
import { completeAzureOpenAiChat } from "../../ai/azureOpenAi"
import { normalizeNumber, normalizeText } from "../../ai/shared/normalize"
import { requireAuthenticatedUser } from "../../auth"
import { queryMany } from "../../db"
import { env } from "../../env"
import { ValidationError } from "../../errors/ValidationError"
import { asyncHandler, sendError } from "../../http"

type RegisterActivityAiRoutesParams = {
  rateLimitAi: RequestHandler
}

type DetectActivitySuggestion = {
  templateId?: string
  name: string
  category: string
  suggestedHours: number
  confidence: number
  rationale: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100
}

function parseDetectSuggestions(params: { rawText: string; allowedTemplateIds: Set<string> }): DetectActivitySuggestion[] {
  const stripped = params.rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim()
  if (!stripped) return []

  let parsed: any
  try {
    parsed = JSON.parse(stripped)
  } catch {
    throw new ValidationError("Activity detect model response is not valid JSON")
  }

  const rawSuggestions = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.suggestions) ? parsed.suggestions : []
  const uniqueByNameCategory = new Set<string>()
  const suggestions: DetectActivitySuggestion[] = []

  for (const rawSuggestion of rawSuggestions) {
    const name = normalizeText(rawSuggestion?.name).slice(0, 140)
    const category = normalizeText(rawSuggestion?.category).slice(0, 80) || "overig"
    if (!name) continue

    const dedupeKey = `${name.toLowerCase()}::${category.toLowerCase()}`
    if (uniqueByNameCategory.has(dedupeKey)) continue
    uniqueByNameCategory.add(dedupeKey)

    const suggestedHoursRaw = normalizeNumber(rawSuggestion?.suggestedHours)
    const confidenceRaw = normalizeNumber(rawSuggestion?.confidence)
    const templateIdRaw = normalizeText(rawSuggestion?.templateId)
    const templateId = params.allowedTemplateIds.has(templateIdRaw) ? templateIdRaw : undefined
    const rationale = normalizeText(rawSuggestion?.rationale).slice(0, 300)

    suggestions.push({
      ...(templateId ? { templateId } : {}),
      name,
      category,
      suggestedHours: roundToTwo(clamp(suggestedHoursRaw ?? 1, 0.25, 41)),
      confidence: roundToTwo(clamp(confidenceRaw ?? 0.5, 0, 1)),
      rationale,
    })
  }

  return suggestions.slice(0, 15)
}

export function registerActivityAiRoutes(app: Express, params: RegisterActivityAiRoutesParams): void {
  app.post(
    "/activities/detect",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)

      const sourceSessionId = normalizeText(req.body?.sourceSessionId || req.body?.itemId)
      const trajectoryId = normalizeText(req.body?.trajectoryId)
      const transcript = normalizeText(req.body?.transcript)
      if (!sourceSessionId) {
        sendError(res, 400, "Missing sourceSessionId")
        return
      }
      if (!trajectoryId) {
        sendError(res, 400, "Missing trajectoryId")
        return
      }
      if (!transcript) {
        sendError(res, 400, "Missing transcript")
        return
      }

      const templates = await queryMany<{
        id: string
        name: string
        category: string
        default_hours: number
        is_admin: boolean
      }>(
        `
        select id, name, category, default_hours, is_admin
        from public.activity_templates
        where (owner_user_id = $1 or owner_user_id is null)
          and is_active = true
        order by created_at_unix_ms asc
        `,
        [user.userId],
      )

      const existingActivities = await queryMany<{
        name: string
        category: string
        status: "planned" | "executed"
      }>(
        `
        select name, category, status
        from public.activities
        where owner_user_id = $1
          and trajectory_id = $2
        order by updated_at_unix_ms desc
        limit 200
        `,
        [user.userId, trajectoryId],
      )

      const templateLines = templates
        .map((template) => {
          const defaultHours = Number.isFinite(Number(template.default_hours)) ? Number(template.default_hours) : 0
          return [
            `id=${template.id}`,
            `name=${normalizeText(template.name)}`,
            `category=${normalizeText(template.category) || "overig"}`,
            `defaultHours=${defaultHours}`,
            `isAdmin=${template.is_admin ? "yes" : "no"}`,
          ].join(" | ")
        })
        .join("\n")

      const existingLines = existingActivities
        .map((activity) => `name=${normalizeText(activity.name)} | category=${normalizeText(activity.category)} | status=${activity.status}`)
        .join("\n")

      const deployment = normalizeText(env.azureOpenAiSummaryDeployment) || normalizeText(env.azureOpenAiChatDeployment)
      if (!deployment) {
        throw new Error("Azure OpenAI detect deployment is not configured")
      }

      const prompt = [
        "Detecteer concrete Werkfit-activiteiten uit dit item transcript.",
        "Gebruik alleen activiteiten die expliciet of duidelijk impliciet in het transcript voorkomen.",
        "Voorkom dubbelen met bestaande activiteiten uit dit trajectory-context.",
        "Kies waar mogelijk een templateId uit de template-bibliotheek.",
        "Geef per activiteit realistische uren (suggestedHours).",
        "",
        "Template-bibliotheek:",
        templateLines || "(geen templates beschikbaar)",
        "",
        "Bestaande trajectory-activiteiten:",
        existingLines || "(geen bestaande activiteiten)",
        "",
        `SourceSessionId: ${sourceSessionId}`,
        `TrajectoryId: ${trajectoryId}`,
        "",
        "Geef uitsluitend strikte JSON terug met exact dit shape:",
        '{"suggestions":[{"templateId":"optional-string","name":"string","category":"string","suggestedHours":1.5,"confidence":0.82,"rationale":"string"}]}',
        "",
        "Transcript:",
        transcript,
      ].join("\n")

      const rawModelText = await completeAzureOpenAiChat({
        deployment,
        temperature: 0,
        messages: [
          { role: "system", content: "You output strict JSON only. No markdown. No prose. Return an object with key suggestions containing an array." },
          { role: "user", content: prompt },
        ],
      })

      const suggestions = parseDetectSuggestions({
        rawText: rawModelText,
        allowedTemplateIds: new Set(templates.map((template) => template.id)),
      })

      res.status(200).json({ suggestions })
    }),
  )
}
