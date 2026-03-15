import { completeAzureOpenAiChat, type ChatMessage } from "../ai/azureOpenAi"
import { normalizeText } from "../ai/shared/normalize"
import { estimateTokenCount } from "../ai/shared/textChunking"
import { removeSpeakerLabelsFromOutput } from "../ai/shared/textSanitization"
import { env } from "../env"
import { SummaryGenerationError } from "../errors/SummaryGenerationError"

const chunkTokenBudget = 6_500
const mergeTokenBudget = 8_000

// Makes sure transcript text is present.
function readRequiredTranscript(transcript: string): string {
  const normalizedTranscript = normalizeText(transcript)
  if (!normalizedTranscript) throw new SummaryGenerationError("Missing transcript")
  return normalizedTranscript
}

// Builds the system prompt used for summary generation.
function buildSummarySystemPrompt(): string {
  return [
    "Je bent een assistent voor Coachscribe.",
    "Schrijf een heldere sessiesamenvatting in het Nederlands.",
    "Geef exact 2 alinea's (geen markdown, geen kopjes, geen bullets).",
    "Alinea 1: een korte, snelle samenvatting van de sessie.",
    "Alinea 2: de actiepunten uit de sessie.",
    "Als er geen actiepunten zijn, vermeld dat expliciet in alinea 2.",
    "Gebruik alleen informatie uit het transcript.",
    "Noem geen details die niet in het transcript staan.",
    "Gebruik geen sprekerlabels.",
    "Houd de toon feitelijk en professioneel.",
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
  chunkText: string
  chunkIndex: number
  totalChunks: number
}): Promise<string> {
  const userPrompt = [
    `Dit is deel ${params.chunkIndex} van ${params.totalChunks}.`,
    "Gebruik alleen feiten uit dit deel.",
    "",
    "Transcriptdeel:",
    params.chunkText,
  ].join("\n")

  const messages: ChatMessage[] = [
    { role: "system", content: params.systemPrompt },
    { role: "user", content: userPrompt },
  ]
  return await completeAzureOpenAiChat({
    deployment: params.deployment,
    messages,
    temperature: 0.2,
  })
}

// Merges chunk summaries into one summary.
async function mergeChunkSummaries(params: {
  deployment: string
  systemPrompt: string
  partialSummaries: string[]
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
      const messages: ChatMessage[] = [
        { role: "system", content: params.systemPrompt },
        {
          role: "user",
          content: ["Voeg deze deelsamenvattingen samen tot 1 tekst met exact 2 alinea's, zonder nieuwe feiten.", input].join("\n\n"),
        },
      ]
      const mergedGroup = await completeAzureOpenAiChat({
        deployment: params.deployment,
        messages,
        temperature: 0.2,
      })
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

// Resolves the summary deployment from environment settings.
export function readSummaryDeployment(): string {
  return normalizeText(env.azureOpenAiSummaryDeployment || env.azureOpenAiChatDeployment)
}

// Generates a plain-text summary from transcript text.
export async function generateSummary(params: { transcript: string }): Promise<string> {
  const deployment = readSummaryDeployment()
  if (!deployment) throw new SummaryGenerationError("Azure OpenAI summary deployment is not configured")

  const transcript = readRequiredTranscript(params.transcript)
  const systemPrompt = buildSummarySystemPrompt()
  const chunks = splitTextRecursively(transcript, chunkTokenBudget)

  if (chunks.length <= 1) {
    const summary = await summarizeChunk({
      deployment,
      systemPrompt,
      chunkText: chunks[0] || transcript,
      chunkIndex: 1,
      totalChunks: 1,
    })
    const cleanedSummary = normalizeGeneratedSummaryText(summary)
    if (!cleanedSummary) throw new SummaryGenerationError("Summary generation failed")
    return cleanedSummary
  }

  const partialSummaries: string[] = []
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
    const partialSummary = await summarizeChunk({
      deployment,
      systemPrompt,
      chunkText: chunks[chunkIndex],
      chunkIndex: chunkIndex + 1,
      totalChunks: chunks.length,
    })
    const normalizedPartialSummary = normalizeText(partialSummary)
    if (!normalizedPartialSummary) throw new SummaryGenerationError("Summary generation failed")
    partialSummaries.push(normalizedPartialSummary)
  }

  const mergedSummary = await mergeChunkSummaries({
    deployment,
    systemPrompt,
    partialSummaries,
  })
  const cleanedSummary = normalizeGeneratedSummaryText(mergedSummary)
  if (!cleanedSummary) throw new SummaryGenerationError("Summary generation failed")
  return cleanedSummary
}
