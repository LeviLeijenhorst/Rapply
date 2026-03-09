import type { Express, RequestHandler } from "express"
import { completeAzureOpenAiChat } from "../../ai/azureOpenAi"
import { normalizeNumber, normalizeText } from "../../ai/shared/normalize"
import { estimateTokenCount } from "../../ai/shared/textChunking"
import { stripJsonCodeFences } from "../../ai/shared/textSanitization"
import { requireAuthenticatedUser } from "../../auth"
import { queryOne } from "../../db"
import { env } from "../../env"
import { SnippetExtractionError } from "../../errors/SnippetExtractionError"
import { asyncHandler, sendError } from "../../http"
import { createSnippet } from "../store"

type RegisterSnippetAiRoutesParams = {
  rateLimitAi: RequestHandler
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
  { field: "ontwikkeling_werknemersvaardigheden", question: "Welke ontwikkeling heeft de klant laten zien in werknemersvaardigheden?" },
  { field: "arbeidsmarktorientatie", question: "Hoe heeft de klant zich georienteerd op de arbeidsmarkt?" },
  { field: "onderbouwing_werkfitheid", question: "Waaruit blijkt dat de klant werkfit is of juist nog niet werkfit?" },
  { field: "mening_klant_werkfitheid", question: "Wat is de mening van de klant over zijn of haar werkfitheid?" },
  { field: "advies_vervolg", question: "Wat is het advies voor het vervolg?" },
  { field: "reden_beeindiging", question: "Wat is de reden voor beeindiging van het traject?" },
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

  return [...splitTranscriptRecursively(left, maxAllowedTokens), ...splitTranscriptRecursively(right, maxAllowedTokens)]
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
    if (seen.has(text)) continue
    seen.add(text)
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
      { role: "system", content: "You output strict JSON only. No markdown. No prose." },
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

export function registerSnippetAiRoutes(app: Express, params: RegisterSnippetAiRoutesParams): void {
  app.post(
    "/ai/snippet-extract",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const sourceSessionId = normalizeText(req.body?.sourceSessionId || req.body?.itemId)
      const trajectoryId = normalizeText(req.body?.trajectoryId)
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

      let clientId = normalizeText(req.body?.clientId)
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
        const snippetRow = {
          id: `snippet-${crypto.randomUUID()}`,
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
    }),
  )

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
        "Herschrijf het snippet zodat het een korte feitelijke zin is voor re-integratie rapportage.",
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
        "Genereer precies een sterk evidence-snippet voor de categorie-vraag hieronder.",
        "Als er geen sterk feitelijk bewijs is in het transcript, geef lege text terug.",
        "Gebruik een korte feitelijke zin.",
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
}
