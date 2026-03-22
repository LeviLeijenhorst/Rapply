import { completeAzureOpenAiChat, type ChatMessage } from "../ai/azureOpenAi"
import { normalizeText } from "../ai/shared/normalize"
import { estimateTokenCount } from "../ai/shared/textChunking"
import { removeSpeakerLabelsFromOutput } from "../ai/shared/textSanitization"
import { env } from "../env"
import { SummaryGenerationError } from "../errors/SummaryGenerationError"

const chunkTokenBudget = 6_500
const mergeTokenBudget = 8_000

type SummaryDebugContext = {
  sourceSessionId?: string
  sourceInputType?: string
}

type SummaryInputType = "transcript" | "spoken_recap" | "written_recap"

function normalizeSummaryInputType(value: unknown): SummaryInputType {
  const normalized = normalizeText(value).toLowerCase()
  if (normalized === "spoken_recap" || normalized === "spoken" || normalized === "recording") return "spoken_recap"
  if (normalized === "written_recap" || normalized === "written" || normalized === "text") return "written_recap"
  return "transcript"
}

function logSummaryDebug(label: string, payload: unknown): void {
  try {
    console.log(`[summary-debug:recorded-summary] ${label}`, JSON.stringify(payload))
  } catch {
    // Never let diagnostics break summary generation.
  }
}

// Makes sure transcript text is present.
function readRequiredTranscript(transcript: string): string {
  const normalizedTranscript = normalizeText(transcript)
  if (!normalizedTranscript) throw new SummaryGenerationError("Missing transcript")
  return normalizedTranscript
}

// Builds the system prompt used for summary generation.
function buildSummarySystemPrompt(inputType: SummaryInputType): string {
  const sourceTypeLine =
    inputType === "spoken_recap"
      ? "Bronvorm: mondelinge dictatie of nabespreking na het gesprek."
      : inputType === "written_recap"
        ? "Bronvorm: geschreven nabespreking van het gesprek."
        : "Bronvorm: transcriptie van een gesprek."
  return [
    "Je bent een assistent voor professionele sessiesamenvattingen in het Nederlands.",
    "Schrijf een heldere sessiesamenvatting in het Nederlands als doorlopende tekst.",
    "Gebruik geen markdown, geen bullet points, geen sterretjes, geen vet, geen cursief en geen speciale opmaak.",
    "Gebruik exact dit format:",
    "1) Eén korte alinea met de samenvatting van de sessie.",
    "2) Daarna letterlijk: 'Vervolgstappen:' op een nieuwe regel.",
    "3) Na 'Vervolgstappen:' de acties als doorlopende tekst, gescheiden door puntkomma's.",
    "Gebruik alleen informatie uit het transcript.",
    "Noem geen details die niet in het transcript staan.",
    "Gebruik geen sprekerlabels.",
    "Houd de toon feitelijk en professioneel.",
    "Schrijf vloeiende, natuurlijke zinnen die direct de inhoud samenvatten.",
    "Bundel overlappende informatie tot één heldere formulering.",
    "Gebruik concrete handelingen en observaties als kern van de tekst.",
    "Noem specifieke activiteiten en uitkomsten expliciet wanneer die in de input staan (bijv. cv bijgewerkt, LinkedIn-verzoeken verstuurd).",
    "Kies voor concrete formuleringen boven algemene labels zoals 'positieve voortgang' zonder onderbouwing.",
    "Varieer in zinsaanzetten en herhaal 'De cliënt' niet onnodig in opeenvolgende zinnen.",
    "Voorkom semantische duplicatie: noem hetzelfde punt niet meerdere keren in andere woorden.",
    sourceTypeLine,
    "Verwerk zowel directe gesprekstranscripties als nabesprekingen op dezelfde neutrale, feitelijke manier.",
    "Schrijf na 'Vervolgstappen:' altijd minimaal één actie.",
    "Als er geen expliciete vervolgstap in de input staat, schrijf dan: 'Geen concrete vervolgstappen genoemd.'",
    "",
    "Stijlvoorbeeld alinea 1:",
    "Cliënt heeft gewerkt aan het actualiseren van het cv en het uitbreiden van het LinkedIn-netwerk. Verder is er besproken welke stappen al zijn gezet en waar nog ondersteuning nodig is.",
    "Stijlvoorbeeld vervolgstappen:",
    "Vervolgstappen: Versturen van gerichte connectieverzoeken op LinkedIn; verwerken van ontvangen feedback op het cv; inplannen van een kort voortgangsmoment.",
  ].join("\n")
}

// Finds a safe split point near the middle of text.
function findSplitIndex(value: string): number {
  const midpoint = Math.floor(value.length / 2)
  const before = value.lastIndexOf("\n", midpoint)
  if (before > 0) return before
  const after = value.indexOf("\n", midpoint)
  if (after > 0) return after
  return midpoint
}

// Splits long text into smaller chunks.
function splitTextRecursively(value: string, maxAllowedTokens: number): string[] {
  const trimmed = normalizeText(value)
  if (!trimmed) return []
  if (estimateTokenCount(trimmed) <= maxAllowedTokens) return [trimmed]
  if (trimmed.length < 200) return [trimmed]

  const splitIndex = findSplitIndex(trimmed)
  const left = normalizeText(trimmed.slice(0, splitIndex))
  const right = normalizeText(trimmed.slice(splitIndex))
  if (!left || !right) return [trimmed]
  return [...splitTextRecursively(left, maxAllowedTokens), ...splitTextRecursively(right, maxAllowedTokens)]
}

// Generates a summary for one chunk.
async function summarizeChunk(params: {
  deployment: string
  systemPrompt: string
  inputType: SummaryInputType
  chunkText: string
  chunkIndex: number
  totalChunks: number
  includeDebug?: boolean
  debugContext?: SummaryDebugContext
}): Promise<string> {
  const userPrompt = [
    `Inputtype: ${params.inputType}.`,
    `Dit is deel ${params.chunkIndex} van ${params.totalChunks}.`,
    "",
    "Transcriptdeel:",
    params.chunkText,
  ].join("\n")

  const messages: ChatMessage[] = [
    { role: "system", content: params.systemPrompt },
    { role: "user", content: userPrompt },
  ]
  if (params.includeDebug) {
    logSummaryDebug("prompt", {
      sourceSessionId: normalizeText(params.debugContext?.sourceSessionId),
      sourceInputType: normalizeText(params.debugContext?.sourceInputType),
      chunkIndex: params.chunkIndex - 1,
      systemPrompt: params.systemPrompt,
      userPrompt,
    })
  }
  const rawSummary = await completeAzureOpenAiChat({
    deployment: params.deployment,
    messages,
    temperature: 0.2,
  })
  if (params.includeDebug) {
    logSummaryDebug("result", {
      sourceSessionId: normalizeText(params.debugContext?.sourceSessionId),
      sourceInputType: normalizeText(params.debugContext?.sourceInputType),
      chunkIndex: params.chunkIndex - 1,
      rawModelResponse: rawSummary,
      parsedSummary: normalizeGeneratedSummaryText(rawSummary),
    })
  }
  return rawSummary
}

// Merges chunk summaries into one summary.
async function mergeChunkSummaries(params: {
  deployment: string
  systemPrompt: string
  partialSummaries: string[]
  includeDebug?: boolean
  debugContext?: SummaryDebugContext
}): Promise<string> {
  let current = params.partialSummaries.slice()
  while (current.length > 1) {
    const groups: string[] = []
    let buffer = ""
    for (let index = 0; index < current.length; index += 1) {
      const candidate = `${buffer}${buffer ? "\n\n" : ""}Deelsamenvatting ${index + 1}:\n${current[index]}`
      if (buffer && estimateTokenCount(candidate) > mergeTokenBudget) {
        groups.push(buffer)
        buffer = `Deelsamenvatting ${index + 1}:\n${current[index]}`
      } else {
        buffer = candidate
      }
    }
    if (buffer) groups.push(buffer)

    const next: string[] = []
    for (const input of groups) {
      const userPrompt = [
        "Voeg deze deelsamenvattingen samen zonder nieuwe feiten.",
        "Gebruik geen markdown, geen bullet points en geen speciale opmaak.",
        "Gebruik exact dit format: eerst 1 korte samenvattingsalinea, daarna 'Vervolgstappen:' gevolgd door de acties als doorlopende tekst gescheiden door puntkomma's.",
        "",
        input,
      ].join("\n")
      const messages: ChatMessage[] = [
        { role: "system", content: params.systemPrompt },
        {
          role: "user",
          content: userPrompt,
        },
      ]
      if (params.includeDebug) {
        logSummaryDebug("prompt", {
          sourceSessionId: normalizeText(params.debugContext?.sourceSessionId),
          sourceInputType: normalizeText(params.debugContext?.sourceInputType),
          chunkIndex: -1,
          systemPrompt: params.systemPrompt,
          userPrompt,
        })
      }
      const mergedGroup = await completeAzureOpenAiChat({
        deployment: params.deployment,
        messages,
        temperature: 0.2,
      })
      if (params.includeDebug) {
        logSummaryDebug("result", {
          sourceSessionId: normalizeText(params.debugContext?.sourceSessionId),
          sourceInputType: normalizeText(params.debugContext?.sourceInputType),
          chunkIndex: -1,
          rawModelResponse: mergedGroup,
          parsedSummary: normalizeGeneratedSummaryText(mergedGroup),
        })
      }
      const normalizedMergedGroup = normalizeText(mergedGroup)
      if (!normalizedMergedGroup) throw new SummaryGenerationError("Summary generation failed")
      next.push(normalizedMergedGroup)
    }
    current = next
  }

  return normalizeText(current[0] || "")
}

// Normalizes generated summary text for display/storage.
function normalizeGeneratedSummaryText(summary: string): string {
  return removeSpeakerLabelsFromOutput(normalizeText(summary))
    .replace(/\[\d{1,2}:\d{2}(?:\.\d+)?\]\s*/g, "")
    .replace(/(?:^|\n)\s*\d{1,2}:\d{2}(?:\.\d+)?\s*[-:]\s*/g, "\n")
    .replace(/(?:^|\n)\s*(?:coach|client|cliënt|spreker\s*\d+)\s*:\s*/gi, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function ensureSummaryActionPoints(summary: string): string {
  const normalized = normalizeText(summary)
  if (!normalized) return normalized

  const hasSection = /(?:^|\n)\s*vervolgstappen\s*:/i.test(normalized)
  if (!hasSection) {
    return `${normalized}\n\nVervolgstappen: Geen concrete vervolgstappen genoemd.`
  }

  const afterSection = normalized.replace(/^[\s\S]*vervolgstappen\s*:/i, "").trim()
  if (!afterSection) {
    return `${normalized.trimEnd()} Geen concrete vervolgstappen genoemd.`
  }

  return normalized
}

// Resolves the summary deployment from environment settings.
export function readSummaryDeployment(): string {
  return normalizeText(env.azureOpenAiSummaryDeployment || env.azureOpenAiChatDeployment)
}

// Generates a plain-text summary from transcript text.
export async function generateSummary(params: { transcript: string; includeDebug?: boolean; debugContext?: SummaryDebugContext }): Promise<string> {
  const deployment = readSummaryDeployment()
  if (!deployment) throw new SummaryGenerationError("Azure OpenAI summary deployment is not configured")

  const transcript = readRequiredTranscript(params.transcript)
  const inputType = normalizeSummaryInputType(params.debugContext?.sourceInputType)
  if (params.includeDebug) {
    logSummaryDebug("transcript", {
      sourceSessionId: normalizeText(params.debugContext?.sourceSessionId),
      sourceInputType: normalizeText(params.debugContext?.sourceInputType),
      transcript,
    })
  }
  const systemPrompt = buildSummarySystemPrompt(inputType)
  const chunks = splitTextRecursively(transcript, chunkTokenBudget)

  if (chunks.length <= 1) {
    const summary = await summarizeChunk({
      deployment,
      systemPrompt,
      inputType,
      chunkText: chunks[0] || transcript,
      chunkIndex: 1,
      totalChunks: 1,
      includeDebug: params.includeDebug,
      debugContext: params.debugContext,
    })
    const cleanedSummary = normalizeGeneratedSummaryText(summary)
    if (!cleanedSummary) throw new SummaryGenerationError("Summary generation failed")
    return ensureSummaryActionPoints(cleanedSummary)
  }

  const partialSummaries: string[] = []
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
    const partialSummary = await summarizeChunk({
      deployment,
      systemPrompt,
      inputType,
      chunkText: chunks[chunkIndex],
      chunkIndex: chunkIndex + 1,
      totalChunks: chunks.length,
      includeDebug: params.includeDebug,
      debugContext: params.debugContext,
    })
    const normalizedPartialSummary = normalizeText(partialSummary)
    if (!normalizedPartialSummary) throw new SummaryGenerationError("Summary generation failed")
    partialSummaries.push(normalizedPartialSummary)
  }

  const mergedSummary = await mergeChunkSummaries({
    deployment,
    systemPrompt,
    partialSummaries,
    includeDebug: params.includeDebug,
    debugContext: params.debugContext,
  })
  const cleanedSummary = normalizeGeneratedSummaryText(mergedSummary)
  if (!cleanedSummary) throw new SummaryGenerationError("Summary generation failed")
  return ensureSummaryActionPoints(cleanedSummary)
}
