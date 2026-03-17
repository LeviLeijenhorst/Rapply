import { completeAzureOpenAiChat } from "../ai/azureOpenAi"
import { normalizeText } from "../ai/shared/normalize"
import { estimateTokenCount } from "../ai/shared/textChunking"
import { stripJsonCodeFences } from "../ai/shared/textSanitization"
import { env } from "../env"
import { SnippetExtractionError } from "../errors/SnippetExtractionError"
import { sanitizeSnippetText } from "./sanitizeSnippetText"

export type SnippetInputType = "transcript" | "spoken_recap" | "written_recap"

export type SnippetFieldQuestion = {
  field: string
  question: string
}

export type SnippetExtractionResult = {
  fields: string[]
  text: string
}

export type SnippetExtractionDebugChunk = {
  chunkIndex: number
  promptUsed: string
  rawModelResponse: string
  parsedSnippets: SnippetExtractionResult[]
}

export const snippetExtractionSystemPrompt = "Geef uitsluitend geldige JSON terug. Geen markdown. Geen extra toelichting."

function ensureSentenceEnding(value: string): string {
  const trimmed = normalizeText(value)
  if (!trimmed) return ""
  if (/[.!?]$/.test(trimmed)) return trimmed
  return `${trimmed}.`
}

function toLowercaseFirst(value: string): string {
  const input = String(value || "").trim()
  if (!input) return ""
  return `${input.slice(0, 1).toLowerCase()}${input.slice(1)}`
}

export function buildFallbackGeneralSnippet(transcript: string): SnippetExtractionResult | null {
  const normalizedTranscript = normalizeText(transcript)
  if (!normalizedTranscript) return null
  const firstSentence = normalizedTranscript.split(/(?<=[.!?])\s+/).find((line) => normalizeText(line).length > 0) || normalizedTranscript
  const clipped = normalizeText(firstSentence).slice(0, 280)
  const sanitized = sanitizeSnippetText(ensureSentenceEnding(clipped))
  if (!sanitized) return null
  const fallbackBody = sanitized.replace(/[.!?]+$/g, "").trim()
  const paraphrased = ensureSentenceEnding(`Coach geeft aan dat ${toLowercaseFirst(fallbackBody)}`)
  return {
    fields: ["general"],
    text: paraphrased,
  }
}

// Cleans up a snippet field name from input.
function normalizeSnippetField(value: unknown): string {
  const normalized = normalizeText(value)
  if (!normalized) return ""
  return normalized
}

export const snippetFieldQuestions: SnippetFieldQuestion[] = [
  { field: "rp_werkfit_5_1", question: "Welke hoofdactiviteiten zijn in het werkplan of Plan van aanpak benoemd?" },
  { field: "rp_werkfit_5_2", question: "Beschrijving van de activiteiten en het gewenste resultaat" },
  { field: "rp_werkfit_5_3", question: "Hoe verdeelt U de begeleidingsuren over de re-integratieactiviteiten?" },
  { field: "rp_werkfit_5_4", question: "Wanneer begint de eerste re-integratieactiviteit?" },
  { field: "rp_werkfit_5_5", question: "Afspraken en inspanningen van beide partijen" },
  {
    field: "rp_werkfit_5_6",
    question:
      "Als U met de invulling van de re-integratieactiviteiten afwijkt van het werkplan of Plan van aanpak, geef aan op welke onderdelen U ervan afwijkt en waarom.",
  },
  { field: "rp_werkfit_6_1", question: "Wat is de maximale individuele doorlooptijd van de re-integratiedienst?" },
  { field: "rp_werkfit_7_1", question: "Wat verwacht de client van de inzet en het resultaat van de re-integratiedienst? En van de begeleiding door uw organisatie?" },
  { field: "rp_werkfit_7_2", question: "Wat is uw visie op de re-integratiemogelijkheden van de client?" },
  { field: "rp_werkfit_7_3", question: "Wat verwacht u van de inzet en het resultaat van de re-integratiedienst?" },
  { field: "rp_werkfit_8_1", question: "Is er sprake van specialistisch uurtarief?" },
  { field: "rp_werkfit_8_2", question: "Motiveer welke specialistische expertise voor de client nodig is en hoeveel uren u adviseert." },
  {
    field: "rp_werkfit_8_3",
    question:
      "Wat is het in rekening te brengen (hogere) uurtarief voor de specialistische expertise? Motiveer waarom dit tarief noodzakelijk is.",
  },
  { field: "rp_werkfit_9", question: "Rechten en plichten" },
  { field: "er_werkfit_4_2", question: "Van welke eindsituatie is sprake?" },
  { field: "er_werkfit_5_1", question: "Reden beeindiging naar aanleiding van evaluatiemoment" },
  { field: "er_werkfit_5_2", question: "Wat is uw advies voor het vervolg van de dienstverlening?" },
  { field: "er_werkfit_6_1", question: "Reden van de voortijdige terugmelding" },
  { field: "er_werkfit_6_2", question: "Geef een toelichting op de reden van de voortijdige terugmelding." },
  {
    field: "er_werkfit_6_3",
    question: "Een voortijdige terugmelding moet altijd vooraf worden besproken met de klant en met UWV. Met wie bij UWV heeft u dit besproken?",
  },
  {
    field: "er_werkfit_7_1",
    question: "Welke re-integratieactiviteiten heeft u voor de klant uitgevoerd? En hoeveel begeleidingsuren heeft u ingezet per activiteit?",
  },
  { field: "er_werkfit_7_2", question: "Welke vorderingen heeft de klant gemaakt?" },
  { field: "er_werkfit_7_3", question: "Wat is het bereikte resultaat?" },
  { field: "er_werkfit_7_4", question: "Geef aan waaruit blijkt dat de klant werkfit is, of wat de reden is dat de klant niet werkfit is." },
  { field: "er_werkfit_7_5", question: "Is de klant naar eigen mening werkfit? Waaruit blijkt dat?" },
  { field: "er_werkfit_7_6", question: "Wat is uw vervolgadvies en welke bemiddeling en/of begeleiding heeft de klant nog nodig?" },
  { field: "er_werkfit_7_7", question: "Geef een toelichting op uw advies." },
  { field: "er_werkfit_7_8", question: "Wat vindt de klant van dit advies?" },
  { field: "er_werkfit_8_1", question: "Hoe heeft de klant de door u ingezette re-integratieactiviteiten ervaren?" },
  { field: "er_werkfit_8_2", question: "Is de klant akkoord met het aantal door u ingezette en verantwoorde begeleidingsuren?" },
  {
    field: "general",
    question: "Relevante trajectinformatie die nuttig is voor vragen aan AI-assistenten in Coachscribe, maar niet direct onder een specifieke rapportagevraag valt.",
  },
]

const snippetFieldSet = new Set(snippetFieldQuestions.map((item) => item.field))
const maxChunkPromptTokens = 4_800

// Gives routes the same field cleanup logic.
export function normalizeSnippetFieldName(value: unknown): string {
  return normalizeSnippetField(value)
}

// Checks if a field exists in the snippet field list.
export function isSupportedSnippetField(value: string): boolean {
  const normalizedField = normalizeSnippetField(value)
  return snippetFieldSet.has(normalizedField)
}

// Maps raw input type values to known snippet input types.
function normalizeSnippetInputType(value: string): SnippetInputType {
  const normalized = normalizeText(value).toLowerCase()
  if (normalized === "spoken_recap" || normalized === "spoken" || normalized === "recording") return "spoken_recap"
  if (normalized === "written_recap" || normalized === "written" || normalized === "text") return "written_recap"
  return "transcript"
}

// Returns the instruction line for each input type.
function inputTypeInstruction(inputType: SnippetInputType): string {
  if (inputType === "spoken_recap") {
    return "Inputtype: spoken_recap (mondeling gespreksverslag). Splits brede recap-zinnen op in losse feiten."
  }
  if (inputType === "written_recap") {
    return "Inputtype: written_recap (geschreven gespreksverslag). Extraheer kernfeiten op detailniveau."
  }
  return "Inputtype: transcript (ruwe gespreksweergave). Filter ruis en herhaling; behoud alleen concrete feiten."
}

// Builds the extraction prompt for one transcript chunk.
function buildSnippetPrompt(params: { inputType: SnippetInputType; transcript: string }): string {
  const fieldLines = snippetFieldQuestions.map((item) => `${item.field} -> "${item.question}"`).join("\n")
  return [
    "Je bent een snippet-extractie-machine in een softwareproduct voor re-integratiecoaches.",
    "",
    "Doel:",
    "Zet coachingsinput om in herbruikbare snippets voor:",
    "1. rapportage-opbouw",
    "2. chatbot-systeemcontext",
    "",
    "Regels:",
    "- Gebruik alleen informatie uit de input (zie onderaan deze prompt).",
    "- Schrijf feitelijk, neutraal en concreet.",
    "- Herschrijf informatie in eigen woorden; citeer geen letterlijke transcriptzinnen.",
    "- Gebruik geen timestamps, speakerlabels of ruwe transcriptnotatie in snippets.",
    "- Als er geen relevante informatie is: geef een lege lijst terug.",
    "- Er mag geen medische informatie in de snippets staan.",
    "- Gebruik uitsluitend fields uit de mapping hieronder.",
    "- Kies altijd het meest specifieke field dat past.",
    "- Als een feit aantoonbaar relevant is voor zowel een RP-veld (`rp_*`) als een ER-veld (`er_*`), label het feit met beide fields.",
    "- Voorkeur: gebruik bij dual-labeling één snippet-object met `fields` als array (bijv. `{\"fields\":[\"rp_werkfit_5_1\",\"er_werkfit_7_1\"],\"text\":\"...\"}`); als dat niet lukt, geef meerdere snippet-objecten met identieke tekst.",
    "- Gebruik `general` alleen voor context die nuttig is voor AI-assistentvragen/chatbot in Coachscribe.",
    "- Gebruik `general` niet voor feiten die onder een specifiek rapportagefield passen.",
    "- Bij twijfel tussen een specifiek field en `general`: kies het specifieke field.",
    "- Een feit mag aan meerdere fields gekoppeld worden als het aantoonbaar en duidelijk relevant is voor meerdere rapportagevragen; maak in dat geval meerdere snippets met dezelfde feitelijke kern, elk met een ander `field`.",
    "- 1 feit = 1 snippet (standaard), behalve wanneer hetzelfde feit meerdere fields direct ondersteunt.",
    "- Zet alleen informatie in `general` die bruikbaar is als context voor AI-assistentvragen en niet direct als rapportagebewijs in een specifiek field past.",
    "- Negeer alleen pure smalltalk zonder contextwaarde.",
    "",
    "BELANGRIJK:",
    "Elk `field` hoort exact bij 1 rapportagevraag.",
    "",
    "Field -> rapportagevraag (1-op-1):",
    fieldLines,
    "",
    "Output:",
    "- Geef uitsluitend geldige JSON.",
    '- Formaat: {"snippets":[{"field":"string","text":"string"}]} of {"snippets":[{"fields":["string","string"],"text":"string"}]}',
    "",
    inputTypeInstruction(params.inputType),
    "",
    "Input:",
    normalizeText(params.transcript),
  ].join("\n")
}

// Finds a safe place to split long text.
function findSplitIndex(value: string): number {
  const midpoint = Math.floor(value.length / 2)
  const before = value.lastIndexOf("\n", midpoint)
  if (before > 0) return before
  const after = value.indexOf("\n", midpoint)
  if (after > 0) return after
  return midpoint
}

// Splits long transcript text into smaller chunks.
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

// Gets the first full JSON object or array from model output.
function extractFirstJsonObjectOrArray(value: string): string | null {
  const text = String(value || "")
  let startIndex = -1
  let opening = ""

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (char === "{" || char === "[") {
      startIndex = i
      opening = char
      break
    }
  }
  if (startIndex < 0) return null

  const closing = opening === "{" ? "}" : "]"
  let depth = 0
  let inString = false
  let isEscaped = false

  for (let i = startIndex; i < text.length; i += 1) {
    const char = text[i]
    if (isEscaped) {
      isEscaped = false
      continue
    }
    if (char === "\\") {
      isEscaped = true
      continue
    }
    if (char === "\"") {
      inString = !inString
      continue
    }
    if (inString) continue

    if (char === opening) depth += 1
    if (char === closing) depth -= 1
    if (depth === 0) {
      return text.slice(startIndex, i + 1).trim()
    }
  }
  return null
}

function readSnippetFields(rawSnippet: any): string[] {
  const fields = new Set<string>()
  const singleField = normalizeSnippetField(rawSnippet?.field)
  if (singleField) fields.add(singleField)
  if (Array.isArray(rawSnippet?.fields)) {
    for (const candidate of rawSnippet.fields) {
      const normalized = normalizeSnippetField(candidate)
      if (normalized) fields.add(normalized)
    }
  }
  return Array.from(fields)
}

// Parses model output into valid snippets.
export function parseSnippetExtraction(rawText: string): SnippetExtractionResult[] {
  const rawInput = String(rawText || "").trim()
  if (!rawInput) return []
  const stripped = stripJsonCodeFences(rawInput)
  const jsonCandidate = extractFirstJsonObjectOrArray(stripped) ?? extractFirstJsonObjectOrArray(rawInput)
  if (!jsonCandidate) return []

  let parsed: any
  try {
    parsed = JSON.parse(jsonCandidate)
  } catch {
    return []
  }

  const rawSnippets = Array.isArray(parsed?.snippets) ? parsed.snippets : []
  const snippets: SnippetExtractionResult[] = []
  const seen = new Set<string>()

  for (const rawSnippet of rawSnippets) {
    const text = sanitizeSnippetText(String(rawSnippet?.text || ""))
    if (!text) continue
    const fields = readSnippetFields(rawSnippet).filter((field) => snippetFieldSet.has(field))
    if (fields.length === 0) continue
    const normalizedFields = Array.from(new Set(fields)).sort()
    const dedupeKey = `${normalizedFields.join("|").toLowerCase()}::${text.toLowerCase()}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    snippets.push({ fields: normalizedFields, text })
  }

  return snippets
}

function readSnippetExtractionDeployments(): string[] {
  const candidates = [
    normalizeText(env.azureOpenAiSummaryDeployment),
    normalizeText(env.azureOpenAiReportDeployment),
    normalizeText(env.azureOpenAiReasoningDeployment),
    normalizeText(env.azureOpenAiChatDeployment),
  ].filter(Boolean)
  return Array.from(new Set(candidates))
}

function isMissingAzureDeploymentError(error: unknown): boolean {
  const message = String(error instanceof Error ? error.message : error || "").toLowerCase()
  return message.includes("resource not found") || message.includes("deploymentnotfound")
}

// Runs extraction for one chunk.
async function extractSnippetsForChunk(params: { prompt: string }): Promise<{ rawModelResponse: string; snippets: SnippetExtractionResult[] }> {
  const deployments = readSnippetExtractionDeployments()
  if (deployments.length === 0) {
    throw new SnippetExtractionError("Azure OpenAI snippet extraction deployment is not configured")
  }

  let lastError: unknown = null
  for (const deployment of deployments) {
    try {
      const rawModelResponse = await completeAzureOpenAiChat({
        deployment,
        temperature: 0,
        messages: [
          { role: "system", content: snippetExtractionSystemPrompt },
          { role: "user", content: params.prompt },
        ],
      })
      return {
        rawModelResponse,
        snippets: parseSnippetExtraction(rawModelResponse),
      }
    } catch (error) {
      lastError = error
      if (!isMissingAzureDeploymentError(error)) throw error
    }
  }

  throw (lastError as Error) || new SnippetExtractionError("Azure OpenAI snippet extraction failed")
}

// Uses multiple deployment fallbacks to tolerate stale environment values.
export function readSnippetExtractionDeploymentCandidates(): string[] {
  return readSnippetExtractionDeployments()
}

// Extracts snippets from a full transcript.
export async function extractSnippets(params: {
  transcript: string
  sourceInputType?: string
  promptOverride?: string
  includeDebug?: boolean
}): Promise<{ snippets: SnippetExtractionResult[]; debugChunks?: SnippetExtractionDebugChunk[] }> {
  const transcript = normalizeText(params.transcript)
  if (!transcript) {
    return { snippets: [], debugChunks: params.includeDebug ? [] : undefined }
  }

  const inputType = normalizeSnippetInputType(params.sourceInputType || "")
  const chunks = splitTranscriptRecursively(transcript, maxChunkPromptTokens)
  const mergedByText = new Map<string, SnippetExtractionResult>()
  const debugChunks: SnippetExtractionDebugChunk[] = []

  for (let index = 0; index < chunks.length; index += 1) {
    const chunkText = chunks[index]
    const promptUsed = normalizeText(params.promptOverride) || buildSnippetPrompt({ inputType, transcript: chunkText })
    const extracted = await extractSnippetsForChunk({ prompt: promptUsed })

    for (const snippet of extracted.snippets) {
      const textKey = snippet.text.toLowerCase()
      const existing = mergedByText.get(textKey)
      if (!existing) {
        mergedByText.set(textKey, {
          text: snippet.text,
          fields: Array.from(new Set(snippet.fields)).sort(),
        })
        continue
      }
      const mergedFields = Array.from(new Set([...existing.fields, ...snippet.fields])).sort()
      mergedByText.set(textKey, {
        text: existing.text,
        fields: mergedFields,
      })
    }

    if (params.includeDebug) {
      debugChunks.push({
        chunkIndex: index,
        promptUsed,
        rawModelResponse: extracted.rawModelResponse,
        parsedSnippets: extracted.snippets,
      })
    }
  }

  const merged = Array.from(mergedByText.values())

  if (merged.length === 0) {
    const fallbackSnippet = buildFallbackGeneralSnippet(transcript)
    if (fallbackSnippet) {
      merged.push(fallbackSnippet)
    }
  }

  return {
    snippets: merged,
    debugChunks: params.includeDebug ? debugChunks : undefined,
  }
}

// Returns the question text for a snippet field.
export function getSnippetQuestionForField(field: string): string {
  const normalizedField = normalizeSnippetField(field)
  const question = snippetFieldQuestions.find((item) => item.field === normalizedField)?.question
  if (question) return question
  return `Algemeen veld: ${normalizedField || "onbekend"}`
}
