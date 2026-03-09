import type { Express, RequestHandler } from "express"
import { completeAzureOpenAiChat } from "../ai/azureOpenAi"
import { normalizeNumber, normalizeText } from "../ai/shared/normalize"
import { estimateTokenCount } from "../ai/shared/textChunking"
import { stripJsonCodeFences } from "../ai/shared/textSanitization"
import { createSnippet } from "../appData"
import { requireAuthenticatedUser } from "../auth"
import { readManualPricingContextForUser } from "../billing/manualPricing"
import { isMollieConfigured, syncMollieSubscriptionForUser, syncRecentMolliePaymentsForUser } from "../billing/mollie"
import { ensureBillingUser, readBillingStatus } from "../billing/store"
import { completeChatWithAzureOpenAi } from "../chat/azureOpenAiChat"
import { queryMany, queryOne } from "../db"
import { env } from "../env"
import { SnippetExtractionError } from "../errors/SnippetExtractionError"
import { ValidationError } from "../errors/ValidationError"
import { asyncHandler, sendError } from "../http"
import { generateSummary } from "../summary/summary"
import { readSummaryTemplate } from "./parsers/summary"

type RegisterAiRoutesParams = {
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

type SnippetFieldQuestion = {
  field: string
  question: string
}

type SnippetExtractionResult = {
  field: string
  text: string
}

const snippetFieldQuestions: SnippetFieldQuestion[] = [
  { field: "startsituatie_client", question: "Wat is de startsituatie van de klant bij aanvang van het traject?" },
  { field: "uitgevoerde_activiteiten", question: "Welke activiteiten zijn uitgevoerd tijdens het traject?" },
  { field: "voortgang_klant", question: "Welke voortgang heeft de klant gemaakt tijdens het traject?" },
  { field: "belemmeringen_beperkingen", question: "Welke belemmeringen of beperkingen spelen een rol?" },
  {
    field: "ontwikkeling_werknemersvaardigheden",
    question: "Welke ontwikkeling heeft de klant laten zien in werknemersvaardigheden?",
  },
  {
    field: "arbeidsmarktorientatie",
    question: "Hoe heeft de klant zich georiënteerd op de arbeidsmarkt?",
  },
  {
    field: "onderbouwing_werkfitheid",
    question: "Waaruit blijkt dat de klant werkfit is of juist nog niet werkfit?",
  },
  {
    field: "mening_klant_werkfitheid",
    question: "Wat is de mening van de klant over zijn of haar werkfitheid?",
  },
  { field: "advies_vervolg", question: "Wat is het advies voor het vervolg?" },
  { field: "reden_beeindiging", question: "Wat is de reden voor beëindiging van het traject?" },
]

const snippetFieldSet = new Set(snippetFieldQuestions.map((item) => item.field))
const maxChunkPromptTokens = 4_800

function findSplitIndex(value: string): number {
  const midpoint = Math.floor(value.length / 2)
  const before = value.lastIndexOf("\n", midpoint)
  if (before > 0) return before
  const after = value.indexOf("\n", midpoint)
  if (after > 0) return after
  return midpoint
}

function splitTranscriptRecursively(transcript: string, maxAllowedTokens: number): string[] {
  const trimmed = normalizeText(transcript)
  if (!trimmed) return []
  if (estimateTokenCount(trimmed) <= maxAllowedTokens) return [trimmed]
  if (trimmed.length < 200) return [trimmed]

  const splitIndex = findSplitIndex(trimmed)
  const left = normalizeText(trimmed.slice(0, splitIndex))
  const right = normalizeText(trimmed.slice(splitIndex))
  if (!left || !right) return [trimmed]

  return [
    ...splitTranscriptRecursively(left, maxAllowedTokens),
    ...splitTranscriptRecursively(right, maxAllowedTokens),
  ]
}

function parseSnippetExtraction(rawText: string): SnippetExtractionResult[] {
  const stripped = stripJsonCodeFences(rawText)
  if (!stripped) return []

  let parsed: any
  try {
    parsed = JSON.parse(stripped)
  } catch {
    return []
  }

  const rawSnippets = Array.isArray(parsed?.snippets) ? parsed.snippets : []
  const snippets: SnippetExtractionResult[] = []
  const seen = new Set<string>()

  for (const rawSnippet of rawSnippets) {
    const field = normalizeText(rawSnippet?.field)
    const text = normalizeText(rawSnippet?.text)
    if (!snippetFieldSet.has(field) || !text) continue
    const dedupeKey = text
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    snippets.push({ field, text })
  }
  return snippets
}

async function extractSnippetsForTranscriptChunk(transcriptChunk: string): Promise<SnippetExtractionResult[]> {
  const deployment = normalizeText(env.azureOpenAiSummaryDeployment) || normalizeText(env.azureOpenAiChatDeployment)
  if (!deployment) {
    throw new SnippetExtractionError("Azure OpenAI snippet extraction deployment is not configured")
  }

  const fieldLines = snippetFieldQuestions.map((item) => `- ${item.field}: ${item.question}`).join("\n")

  const prompt = [
    "You are assisting a professional reintegration coach in the Netherlands.",
    "The coach uses this software to document evidence during reintegration trajectories.",
    "These trajectories may later require formal reports for organizations such as the UWV.",
    "During coaching sessions, information is discussed that may later help answer questions in official reintegration reports.",
    "Your task is to extract short factual evidence snippets from the session transcript.",
    "Each snippet should contain one clear factual statement that could help answer one of the report questions.",
    "",
    "Extract only information that is clearly relevant to a reintegration report.",
    "Before extracting a snippet, consider: Would a professional reintegration coach realistically include this information in an official reintegration report?",
    "If uncertain, do not extract it.",
    "Prefer fewer high-quality snippets over many weak snippets.",
    "Avoid small talk, vague remarks, repeated information, and conversational filler.",
    "Each snippet must contain one factual statement, be concise, avoid interpretation, and be useful as evidence in a formal report.",
    "Multiple snippets per category are allowed.",
    "",
    "Use these categories and full question texts:",
    fieldLines,
    "",
    'Return strict JSON only with exactly this shape: {"snippets":[{"field":"string","text":"string"}]}',
    "",
    "Transcript:",
    transcriptChunk,
  ].join("\n")

  const rawModelText = await completeAzureOpenAiChat({
    deployment,
    temperature: 0,
    messages: [
      {
        role: "system",
        content: "You output strict JSON only. No markdown. No prose.",
      },
      { role: "user", content: prompt },
    ],
  })

  return parseSnippetExtraction(rawModelText)
}

function parseSingleSnippetText(rawText: string): string {
  const stripped = stripJsonCodeFences(rawText)
  if (!stripped) return ""
  try {
    const parsed: any = JSON.parse(stripped)
    if (typeof parsed?.text === "string") return normalizeText(parsed.text)
    if (typeof parsed?.snippet?.text === "string") return normalizeText(parsed.snippet.text)
  } catch {
    return ""
  }
  return ""
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100
}

function parseDetectSuggestions(params: {
  rawText: string
  allowedTemplateIds: Set<string>
}): DetectActivitySuggestion[] {
  const stripped = stripJsonCodeFences(params.rawText)
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

    const suggestedHours = roundToTwo(clamp(suggestedHoursRaw ?? 1, 0.25, 41))
    const confidence = roundToTwo(clamp(confidenceRaw ?? 0.5, 0, 1))

    suggestions.push({
      ...(templateId ? { templateId } : {}),
      name,
      category,
      suggestedHours,
      confidence,
      rationale,
    })
  }

  return suggestions.slice(0, 15)
}

// Registers AI endpoints for chat completions and summary generation.
export function registerAiRoutes(app: Express, params: RegisterAiRoutesParams): void {
  app.post(
    "/chat",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      await ensureBillingUser(user.userId)

      const useMollie = isMollieConfigured()
      if (useMollie) {
        try {
          await syncRecentMolliePaymentsForUser(user.userId)
          await syncMollieSubscriptionForUser(user.userId)
        } catch (error: any) {
          const message = String(error?.message || error || "")
          console.warn("[ai:chat] mollie sync failed; continuing with existing billing state", {
            userId: user.userId,
            message,
          })
        }
      }

      const manualPricing = await readManualPricingContextForUser(user.userId)
      const useManualCycle = useMollie || manualPricing.includedSecondsPerCycle > 0 || manualPricing.planId != null || manualPricing.customMonthlyPrice != null
      const hasDashboardMinutesConfigured = manualPricing.planId != null || manualPricing.includedSecondsPerCycle > 0
      const freeSecondsOverride = hasDashboardMinutesConfigured ? 0 : null
      const billingStatusRaw = await readBillingStatus({
        userId: user.userId,
        planKey: null,
        cycleStartMs: useManualCycle ? manualPricing.cycleStartMs : null,
        cycleEndMs: useManualCycle ? manualPricing.cycleEndMs : null,
        includedSecondsOverride: useManualCycle ? manualPricing.includedSecondsPerCycle : null,
        freeSecondsOverride,
      })
      const billingStatus = billingStatusRaw
      if (billingStatus.remainingSeconds <= 0) {
        sendError(res, 402, "U heeft geen minuten meer. Ga naar Mijn abonnement om extra minuten toe te voegen.")
        return
      }

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
      const responseMode = req.body?.responseMode === "structured_item_summary" ? "structured_item_summary" : "markdown"

      if (!String(transcript || "").trim()) {
        sendError(res, 400, "Missing transcript")
        return
      }

      const summary = await generateSummary({ transcript, template, responseMode })
      res.status(200).json({ summary })
    }),
  )

  const snippetExtractHandler = asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const sourceSessionId = normalizeText(req.body?.sourceSessionId || req.body?.itemId)
      const trajectoryId = normalizeText(req.body?.trajectoryId)
      const payloadClientId = normalizeText(req.body?.clientId)
      const transcript = normalizeText(req.body?.transcript)
      const itemDate = normalizeNumber(req.body?.itemDate)

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
      if (itemDate === null) {
        sendError(res, 400, "Missing itemDate")
        return
      }

      let clientId = payloadClientId
      if (!clientId) {
        const sessionRow = await queryOne<{ client_id: string | null }>(
          `
          select client_id
          from public.sessions
          where id = $1 and owner_user_id = $2
          `,
          [sourceSessionId, user.userId],
        )
        clientId = normalizeText(sessionRow?.client_id)
      }
      if (!clientId) {
        sendError(res, 400, "Missing clientId")
        return
      }

      const chunks = splitTranscriptRecursively(transcript, maxChunkPromptTokens)
      const merged: SnippetExtractionResult[] = []
      const seenSnippetText = new Set<string>()
      for (const chunk of chunks) {
        const chunkSnippets = await extractSnippetsForTranscriptChunk(chunk)
        for (const snippet of chunkSnippets) {
          const dedupeKey = normalizeText(snippet.text)
          if (!dedupeKey || seenSnippetText.has(dedupeKey)) continue
          seenSnippetText.add(dedupeKey)
          merged.push(snippet)
        }
      }

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

      for (const snippet of merged) {
        const id = `snippet-${crypto.randomUUID()}`
        const snippetRow = {
          id,
          clientId,
          trajectoryId,
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
    })

  app.post("/ai/snippet-extract", params.rateLimitAi, snippetExtractHandler)

  app.post(
    "/snippet-edit",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      const field = normalizeText(req.body?.field)
      const snippetText = normalizeText(req.body?.snippetText)
      const transcript = normalizeText(req.body?.transcript)
      if (!field || !snippetFieldSet.has(field)) {
        sendError(res, 400, "Invalid field")
        return
      }
      if (!snippetText) {
        sendError(res, 400, "Missing snippetText")
        return
      }
      if (!transcript) {
        sendError(res, 400, "Missing transcript")
        return
      }

      const question = snippetFieldQuestions.find((item) => item.field === field)?.question || ""
      const deployment = normalizeText(env.azureOpenAiSummaryDeployment) || normalizeText(env.azureOpenAiChatDeployment)
      if (!deployment) {
        throw new Error("Azure OpenAI snippet extraction deployment is not configured")
      }

      const prompt = [
        "Herschrijf het snippet zodat het één korte feitelijke zin is voor re-integratie rapportage.",
        "Behoud alleen informatie die uit het transcript volgt.",
        "Voeg geen nieuwe informatie toe.",
        `Categorie-vraag: ${question}`,
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

      const text = parseSingleSnippetText(rawModelText)
      if (!text) {
        sendError(res, 502, "No snippet text returned")
        return
      }
      res.status(200).json({ text })
    }),
  )

  app.post(
    "/snippet-overwrite",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      const field = normalizeText(req.body?.field)
      const transcript = normalizeText(req.body?.transcript)
      if (!field || !snippetFieldSet.has(field)) {
        sendError(res, 400, "Invalid field")
        return
      }
      if (!transcript) {
        sendError(res, 400, "Missing transcript")
        return
      }

      const question = snippetFieldQuestions.find((item) => item.field === field)?.question || ""
      const deployment = normalizeText(env.azureOpenAiSummaryDeployment) || normalizeText(env.azureOpenAiChatDeployment)
      if (!deployment) {
        throw new Error("Azure OpenAI snippet extraction deployment is not configured")
      }

      const prompt = [
        "Genereer precies één sterk evidence-snippet voor de categorie-vraag hieronder.",
        "Als er geen sterk feitelijk bewijs is in het transcript, geef lege text terug.",
        "Gebruik één korte feitelijke zin.",
        `Categorie-vraag: ${question}`,
        "",
        "Transcript:",
        transcript,
        "",
        `Return strict JSON only: {"snippet":{"field":"${field}","text":"string"}}`,
      ].join("\n")

      const rawModelText = await completeAzureOpenAiChat({
        deployment,
        temperature: 0,
        messages: [
          { role: "system", content: "You output strict JSON only. No markdown. No prose." },
          { role: "user", content: prompt },
        ],
      })

      const text = parseSingleSnippetText(rawModelText)
      if (!text) {
        sendError(res, 502, "No snippet text returned")
        return
      }
      res.status(200).json({ text })
    }),
  )

  app.post(
    "/activities/detect",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)

      const itemId = normalizeText(req.body?.itemId)
      const trajectoryId = normalizeText(req.body?.trajectoryId)
      const transcript = normalizeText(req.body?.transcript)
      if (!itemId) {
        sendError(res, 400, "Missing itemId")
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
        .map((activity) => {
          return `name=${normalizeText(activity.name)} | category=${normalizeText(activity.category)} | status=${activity.status}`
        })
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
        `ItemId: ${itemId}`,
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
          {
            role: "system",
            content:
              "You output strict JSON only. No markdown. No prose. Return an object with key suggestions containing an array.",
          },
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
