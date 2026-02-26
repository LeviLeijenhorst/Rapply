import { env } from "../env"
import { completeAzureOpenAiChat, type ChatMessage } from "../ai/azureOpenAi"

// Intent: normalizeText
function normalizeText(value: unknown) {
  return String(value || "").trim()
}

// Intent: requireTranscript
function requireTranscript(transcript: string) {
  const trimmed = normalizeText(transcript)
  if (!trimmed) {
    throw new Error("Missing transcript")
  }
  return trimmed
}

type SummaryTemplate = { name: string; sections: { title: string; description: string }[] }
type ExtractedReportContext = {
  clientEmployerLines: string[]
  reportDate: string
  wvpWeekNumber: string
  firstSickDay: string
}

const conservativeChunkTokenBudget = 8_000
const conservativeMergeTokenBudget = 10_000
const estimatedPromptOverheadTokens = 1_200
const minimumChunkCharacterLength = 2_000

// Intent: estimateTokenCount
function estimateTokenCount(value: string): number {
  const normalized = String(value || "")
  if (!normalized) return 0
  return Math.ceil(normalized.length / 4)
}

// Intent: splitOversizedLine
function splitOversizedLine(line: string, maxAllowedTokens: number): string[] {
  const trimmed = String(line || "").trim()
  if (!trimmed) return [""]
  if (estimateTokenCount(trimmed) <= maxAllowedTokens) return [trimmed]
  const roughCharacterBudget = Math.max(minimumChunkCharacterLength, maxAllowedTokens * 3)
  const parts: string[] = []
  let cursor = 0
  while (cursor < trimmed.length) {
    const nextCursor = Math.min(trimmed.length, cursor + roughCharacterBudget)
    parts.push(trimmed.slice(cursor, nextCursor))
    cursor = nextCursor
  }
  return parts
}

// Intent: splitTextByEstimatedTokenBudget
function splitTextByEstimatedTokenBudget(params: { text: string; maxAllowedTokens: number }): string[] {
  const text = normalizeText(params.text)
  const maxAllowedTokens = Math.max(500, Math.floor(params.maxAllowedTokens))
  if (!text) return []
  const lines = text.split("\n")
  const chunks: string[] = []
  let pendingLines: string[] = []
  let pendingTokens = 0

  const flushPending = () => {
    const chunk = normalizeText(pendingLines.join("\n"))
    if (chunk) chunks.push(chunk)
    pendingLines = []
    pendingTokens = 0
  }

  for (const rawLine of lines) {
    const line = String(rawLine || "")
    const lineTokens = estimateTokenCount(line) + 1
    if (lineTokens > maxAllowedTokens) {
      if (pendingLines.length > 0) flushPending()
      const oversizedParts = splitOversizedLine(line, maxAllowedTokens)
      for (const part of oversizedParts) {
        const normalizedPart = normalizeText(part)
        if (!normalizedPart) continue
        chunks.push(normalizedPart)
      }
      continue
    }
    if (pendingTokens + lineTokens > maxAllowedTokens && pendingLines.length > 0) {
      flushPending()
    }
    pendingLines.push(line)
    pendingTokens += lineTokens
  }

  if (pendingLines.length > 0) flushPending()
  return chunks
}

// Intent: removeSpeakerLabelsFromOutput
function removeSpeakerLabelsFromOutput(value: string): string {
  return String(value || "")
    .replace(/\bspeaker[_\s-]*\d+\b\s*:?\s*/gi, "")
    .replace(/\bspreker[_\s-]*\d+\b\s*:?\s*/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function normalizeHeading(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function extractReportContextFromTranscript(transcript: string): ExtractedReportContext | null {
  const match = String(transcript || "").match(/\[COACHSCRIBE_REPORT_CONTEXT\]([\s\S]*?)\[\/COACHSCRIBE_REPORT_CONTEXT\]/i)
  if (!match) return null
  const contextLines = String(match[1] || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const parsed: ExtractedReportContext = {
    clientEmployerLines: [],
    reportDate: "",
    wvpWeekNumber: "",
    firstSickDay: "",
  }

  for (const line of contextLines) {
    if (line.startsWith("CLIENT_EMPLOYER_LINE=")) {
      const value = normalizeText(line.slice("CLIENT_EMPLOYER_LINE=".length))
      if (value) parsed.clientEmployerLines.push(value)
      continue
    }
    if (line.startsWith("REPORT_DATE=")) {
      parsed.reportDate = normalizeText(line.slice("REPORT_DATE=".length))
      continue
    }
    if (line.startsWith("WVP_WEEK_NUMBER=")) {
      parsed.wvpWeekNumber = normalizeText(line.slice("WVP_WEEK_NUMBER=".length))
      continue
    }
    if (line.startsWith("FIRST_SICK_DAY=")) {
      parsed.firstSickDay = normalizeText(line.slice("FIRST_SICK_DAY=".length))
    }
  }
  return parsed
}

function bullets(lines: string[]): string[] {
  const normalized = lines.map((line) => normalizeText(line)).filter(Boolean)
  if (!normalized.length) return ["-"]
  return normalized.map((line) => `- ${line}`)
}

function buildDateWeekBullets(context: ExtractedReportContext | null): string[] {
  if (!context) return ["-"]
  return bullets([
    context.reportDate ? `Datum: ${context.reportDate}` : "",
    context.wvpWeekNumber ? `Weeknummer (WvP): ${context.wvpWeekNumber}` : "",
  ])
}

function buildFirstSickDayBullets(context: ExtractedReportContext | null): string[] {
  if (!context) return ["-"]
  return bullets([context.firstSickDay ? `Eerste ziektedag: ${context.firstSickDay}` : ""])
}

function buildDateWeekFirstSickDayBullets(context: ExtractedReportContext | null): string[] {
  if (!context) return ["-"]
  return bullets([
    context.reportDate ? `Datum: ${context.reportDate}` : "",
    context.wvpWeekNumber ? `Weeknummer (WvP): ${context.wvpWeekNumber}` : "",
    context.firstSickDay ? `Eerste ziektedag: ${context.firstSickDay}` : "",
  ])
}

function buildClientEmployerBullets(context: ExtractedReportContext | null): string[] {
  if (!context) return ["-"]
  return bullets(context.clientEmployerLines)
}

function applyReportSectionPolicies(summary: string, context: ExtractedReportContext | null): string {
  const lines = String(summary || "").split(/\r?\n/)
  const headingIndexes = lines
    .map((line, index) => ({ line, index }))
    .filter((item) => /^###\s+/.test(item.line))
    .map((item) => item.index)
  if (headingIndexes.length === 0) return summary

  const sections = headingIndexes.map((start, idx) => ({
    start,
    end: idx + 1 < headingIndexes.length ? headingIndexes[idx + 1] - 1 : lines.length - 1,
    title: lines[start].replace(/^###\s+/, "").trim(),
  }))

  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i]
    const normalizedTitle = normalizeHeading(section.title)
    const hasDate = normalizedTitle.includes("datum")
    const hasWeek = normalizedTitle.includes("weeknummer") || normalizedTitle.includes("wvp")
    const hasFirstSickDay = normalizedTitle.includes("eerste ziektedag")
    const isClientEmployerSection =
      (normalizedTitle.includes("client") && normalizedTitle.includes("werkgever")) ||
      normalizedTitle.includes("clientgegevens")
    const isAlwaysBlankSection =
      normalizedTitle.includes("aanwezigen") ||
      normalizedTitle.includes("deelnemers") ||
      normalizedTitle.includes("ondertekening")

    let replacementBody: string[] | null = null
    if (isAlwaysBlankSection) {
      replacementBody = ["-"]
    } else if (isClientEmployerSection) {
      replacementBody = buildClientEmployerBullets(context)
    } else if (hasDate && hasWeek && hasFirstSickDay) {
      replacementBody = buildDateWeekFirstSickDayBullets(context)
    } else if (hasDate && hasWeek) {
      replacementBody = buildDateWeekBullets(context)
    } else if (hasFirstSickDay) {
      replacementBody = buildFirstSickDayBullets(context)
    }
    if (!replacementBody) continue

    const bodyStart = section.start + 1
    const bodyEnd = section.end
    lines.splice(bodyStart, Math.max(0, bodyEnd - bodyStart + 1), ...replacementBody)
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

// Intent: generateSummaryWithAzureOpenAi
export async function generateSummaryWithAzureOpenAi(params: { transcript: string; templateKey?: string; template?: SummaryTemplate }): Promise<string> {
  const deployment = String(env.azureOpenAiSummaryDeployment || "").trim()
  if (!deployment) {
    throw new Error("Azure OpenAI summary deployment is not configured")
  }

  const transcript = requireTranscript(params.transcript)
  const reportContext = extractReportContextFromTranscript(transcript)

  const templateKeyRaw = normalizeText(params.templateKey)
  const templateKey =
    templateKeyRaw === "soap" ||
    templateKeyRaw === "intake" ||
    templateKeyRaw === "voorbereiding" ||
    templateKeyRaw === "themas" ||
    templateKeyRaw === "gespreksplan"
      ? templateKeyRaw
      : "standaard"

  const systemPrompt = buildSummarySystemPrompt()
  const structure = buildSummaryStructure({ template: params.template, templateKey })
  const chunkBudgetTokens = Math.max(1_500, conservativeChunkTokenBudget - estimatedPromptOverheadTokens)
  const transcriptChunks = splitTextByEstimatedTokenBudget({
    text: transcript,
    maxAllowedTokens: chunkBudgetTokens,
  })

  if (transcriptChunks.length <= 1) {
    const summary = await summarizeChunk({
      deployment,
      chunkText: transcriptChunks[0] || transcript,
      structure,
      totalChunks: 1,
      chunkIndex: 1,
      systemPrompt,
    })
    const normalizedSummary = normalizeText(summary)
    if (!normalizedSummary) {
      throw new Error("Summary generation failed")
    }
    return applyReportSectionPolicies(removeSpeakerLabelsFromOutput(normalizedSummary), reportContext)
  }

  const partialSummaries: string[] = []
  for (let chunkIndex = 0; chunkIndex < transcriptChunks.length; chunkIndex += 1) {
    const summary = await summarizeChunk({
      deployment,
      chunkText: transcriptChunks[chunkIndex],
      structure,
      totalChunks: transcriptChunks.length,
      chunkIndex: chunkIndex + 1,
      systemPrompt,
    })
    const normalized = normalizeText(summary)
    if (!normalized) {
      throw new Error("Summary generation failed")
    }
    partialSummaries.push(normalized)
  }

  const merged = await mergePartialSummaries({
    deployment,
    partialSummaries,
    structure,
    systemPrompt,
  })
  if (!merged) {
    throw new Error("Summary generation failed")
  }
  return applyReportSectionPolicies(removeSpeakerLabelsFromOutput(merged), reportContext)
}

// Intent: buildSummarySystemPrompt
function buildSummarySystemPrompt() {
  return (
    "Je bent een assistent voor CoachScribe. Vat een coachgesprek samen in het Nederlands. " +
    "Noem geen details die niet in de tekst staan. " +
    "Schrijf geen persoonsgegevens zoals e-mailadressen of telefoonnummers. " +
    "Noem of gebruik nooit sprekerlabels zoals 'speaker_1', 'speaker 1', 'spreker 1' of vergelijkbare labels. " +
    "Als de input een blok [COACHSCRIBE_REPORT_CONTEXT] bevat, gebruik dan uitsluitend die context voor client- en werkgeversgegevens, datum/weeknummer (WvP) en eerste ziektedag. Leid deze gegevens nooit af uit transcript-zinnen. " +
    "Laat de onderdelen 'Ondertekening door werkgever en werknemer', 'Aanwezigen', 'Deelnemers' en 'Ondertekening' altijd leeg (alleen '-'). " +
    "Gebruik alleen Markdown met kopjes die beginnen met '### ' en bullet points die beginnen met '- '."
  )
}

// Intent: buildSummaryStructure
function buildSummaryStructure(params: { template?: SummaryTemplate; templateKey: string }) {
  if (params.template?.sections?.length) {
    return buildTemplateStructure(params.template)
  }
  if (params.templateKey === "soap") {
    return "Gebruik deze structuur:\n### Subjectief\n- ...\n### Objectief\n- ...\n### Analyse\n- ...\n### Plan\n- ...\n"
  }
  if (params.templateKey === "intake") {
    return (
      "Gebruik deze structuur:\n" +
      "### Doel van het gesprek\n- ...\n" +
      "### Achtergrond\n- ...\n" +
      "### Huidige situatie\n- ...\n" +
      "### Gewenste situatie\n- ...\n" +
      "### Obstakels\n- ...\n" +
      "### Actiepunten\n- ...\n" +
      "### Vervolgafspraken\n- ...\n"
    )
  }
  if (params.templateKey === "voorbereiding") {
    return (
      "Gebruik deze structuur:\n" +
      "### Voorbereiding\n- ...\n" +
      "### Doelen voor de volgende sessie\n- ...\n" +
      "### Vragen om te stellen\n- ...\n" +
      "### Aandachtspunten\n- ...\n" +
      "### Oefeningen / opdrachten\n- ...\n"
    )
  }
  if (params.templateKey === "themas") {
    return "Gebruik deze structuur:\n### Thema's\n- ...\n### Belangrijkste inzichten\n- ...\n### Actiepunten\n- ...\n### Afspraken / vervolg\n- ...\n"
  }
  if (params.templateKey === "gespreksplan") {
    return "Gebruik deze structuur:\n### Agenda\n- ...\n### Tijdindeling\n- ...\n### Vragen\n- ...\n### Afsluiting\n- ...\n"
  }
  return "Gebruik deze structuur:\n### Kern\n- ...\n### Belangrijkste thema's\n- ...\n### Actiepunten\n- ...\n### Afspraken / vervolg\n- ...\n"
}

// Intent: summarizeChunk
async function summarizeChunk(params: {
  deployment: string
  chunkText: string
  structure: string
  totalChunks: number
  chunkIndex: number
  systemPrompt: string
}) {
  const userPrompt =
    "Maak een korte, bruikbare samenvatting van dit deel van een groter transcript.\n\n" +
    `Dit is deel ${params.chunkIndex} van ${params.totalChunks}.\n` +
    "Beschrijf alleen informatie uit dit deel.\n" +
    "Gebruik dezelfde samenvattingsstructuur als voor het eindresultaat.\n\n" +
    `${params.structure}\n` +
    `Transcriptdeel:\n${params.chunkText}`

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

// Intent: mergePartialSummaries
async function mergePartialSummaries(params: {
  deployment: string
  partialSummaries: string[]
  structure: string
  systemPrompt: string
}): Promise<string> {
  let workingSummaries = params.partialSummaries.slice()
  while (workingSummaries.length > 1) {
    const mergeBudgetTokens = Math.max(2_000, conservativeMergeTokenBudget - estimatedPromptOverheadTokens)
    const groupedSummaries = splitTextByEstimatedTokenBudget({
      text: workingSummaries.map((summary, index) => `Deelsamenvatting ${index + 1}:\n${summary}`).join("\n\n"),
      maxAllowedTokens: mergeBudgetTokens,
    })
    const nextWorkingSummaries: string[] = []
    for (const groupText of groupedSummaries) {
      const userPrompt =
        "Je krijgt meerdere deelsamenvattingen van hetzelfde gesprek. " +
        "Voeg ze samen tot een consistente samenvatting zonder doublures en zonder nieuwe feiten.\n\n" +
        `${params.structure}\n` +
        `Deelsamenvattingen:\n${groupText}`
      const messages: ChatMessage[] = [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: userPrompt },
      ]
      const mergedGroup = await completeAzureOpenAiChat({
        deployment: params.deployment,
        messages,
        temperature: 0.2,
      })
      const normalized = normalizeText(mergedGroup)
      if (!normalized) {
        throw new Error("Summary generation failed")
      }
      nextWorkingSummaries.push(normalized)
    }
    workingSummaries = nextWorkingSummaries
  }
  return normalizeText(workingSummaries[0] || "")
}

// Intent: buildTemplateStructure
function buildTemplateStructure(template: SummaryTemplate) {
  const sectionGuide = template.sections
    .map((section) => `- ${section.title}: ${normalizeText(section.description) || "Geen extra toelichting."}`)
    .join("\n")
  const structure = template.sections.map((section) => `### ${section.title}\n- ...`).join("\n")
  return `Gebruik de structuur van het template "${normalizeText(template.name) || "Template"}".\n\nUitleg per onderdeel:\n${sectionGuide}\n\nStructuur:\n${structure}\n`
}
