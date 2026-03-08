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
type SummaryResponseMode = "markdown" | "structured_item_summary"
type ReportPerspective = "forward_looking_plan" | "retrospective_evaluation" | "generic_report"
type ReportTypeContext = {
  reportTypeLabel: string
  perspective: ReportPerspective
  instructionBlock: string
}
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
const structuredSummaryKeys = [
  "doelstelling",
  "belastbaarheid",
  "belemmeringen",
  "voortgang",
  "arbeidsmarktorientatie",
] as const
type StructuredSummaryKey = (typeof structuredSummaryKeys)[number]
type StructuredSummary = Record<StructuredSummaryKey, string>

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

function resolveReportTypeContext(template?: SummaryTemplate): ReportTypeContext {
  const normalizedTemplateName = normalizeHeading(template?.name || "")
  if (normalizedTemplateName === "re integratieplan werkfit maken" || normalizedTemplateName === "reintegratieplan werkfit maken") {
    return {
      reportTypeLabel: "Re-integratieplan Werkfit maken",
      perspective: "forward_looking_plan",
      instructionBlock:
        "Dit rapporttype is een trajectplan en is nadrukkelijk toekomstgericht. " +
        "Beschrijf de beoogde begeleiding gedurende het traject als geheel, niet alleen een eerstvolgende week. " +
        "Formuleer in termen als: 'Binnen het traject zal worden ingezet op...', 'Gedurende het traject wordt toegewerkt naar...', 'Het beoogde resultaat is dat...'. " +
        "Gebruik alleen korte-termijnformuleringen als het specifieke veld daar expliciet om vraagt.",
    }
  }
  if (normalizedTemplateName === "eindrapportage werkfit maken") {
    return {
      reportTypeLabel: "Eindrapportage Werkfit maken",
      perspective: "retrospective_evaluation",
      instructionBlock:
        "Dit rapporttype is een afrondende evaluatie en is nadrukkelijk terugblikkend. " +
        "Beschrijf wat gedurende het traject feitelijk is gebeurd, welke voortgang is gerealiseerd en wat de actuele uitkomst is. " +
        "Formuleer evaluatief en evidence-based in termen als: 'Gedurende het traject heeft client...', 'Binnen de begeleiding is gewerkt aan...', 'Hieruit blijkt dat...'.",
    }
  }
  return {
    reportTypeLabel: normalizeText(template?.name) || "Onbekend rapporttype",
    perspective: "generic_report",
    instructionBlock:
      "Pas stijl en formulering aan op het doel van dit rapporttype en blijf consequent in tijdsperspectief binnen het hele document.",
  }
}

function buildFormalWritingStyleInstructionBlock(): string {
  return [
    "Stijl en toon (verplicht):",
    "- Schrijf in formeel, professioneel en neutraal Nederlands.",
    "- Gebruik volledige, goedlopende zinnen.",
    "- Vermijd informeel of spreektaalgebruik.",
    "- Schrijf per onderdeel redelijk uitgewerkt wanneer de context voldoende informatie bevat.",
    "- Vermijd losse bullet-fragmenten, tenzij het veld expliciet een lijst vereist.",
    "- Schrijf geschikt voor officiele re-integratiedocumentatie.",
    "- Overdrijf de zekerheid niet; formuleer proportioneel en zorgvuldig.",
  ].join("\n")
}

function buildAntiHallucinationInstructionBlock(): string {
  return [
    "Feitelijke begrenzing (verplicht):",
    "Gebruik uitsluitend de aangeleverde informatie als basis.",
    "Voeg geen feiten, omstandigheden of conclusies toe die niet uit de context blijken.",
    "Gebruik alleen informatie uit de transcriptcontext, snippets, activiteiten, trajectcontext, Plan van aanpak-context en rapportmetadata indien aanwezig.",
    "Als bewijs beperkt of onvolledig is: schrijf voorzichtig, algemeen-professioneel en zonder details te verzinnen.",
  ].join("\n")
}

function buildFieldLevelWritingInstructionBlock(template?: SummaryTemplate): string {
  const sections = Array.isArray(template?.sections) ? template.sections : []
  if (sections.length === 0) {
    return "Per veld: schrijf een formele, zakelijke en goedlopende tekst, gebaseerd op de aangeleverde context."
  }
  const lines = sections.map((section) => {
    const fieldLabel = normalizeText(section.title) || "Onbekend veld"
    return `- Veld '${fieldLabel}': Schrijf een formele, zakelijke en goedlopende tekst voor dit veld, passend binnen een officiele re-integratierapportage. Baseer je uitsluitend op de aangeleverde informatie. Formuleer volledig en professioneel, zonder informeel taalgebruik.`
  })
  return ["Veldniveau-instructies:", ...lines].join("\n")
}

function createEmptyStructuredSummary(): StructuredSummary {
  return {
    doelstelling: "",
    belastbaarheid: "",
    belemmeringen: "",
    voortgang: "",
    arbeidsmarktorientatie: "",
  }
}

function stripJsonCodeFences(value: string): string {
  const trimmed = normalizeText(value)
  if (!trimmed.startsWith("```")) return trimmed
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
}

function parseStructuredSummary(rawValue: string): StructuredSummary | null {
  const raw = stripJsonCodeFences(rawValue)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return null
    const next = createEmptyStructuredSummary()
    for (const key of structuredSummaryKeys) {
      next[key] = normalizeText((parsed as any)[key])
    }
    return next
  } catch {
    return null
  }
}

function mergeStructuredSummaries(chunks: StructuredSummary[]): StructuredSummary {
  const merged = createEmptyStructuredSummary()
  for (const chunk of chunks) {
    for (const key of structuredSummaryKeys) {
      const value = normalizeText(chunk[key])
      if (!value) continue
      merged[key] = merged[key] ? `${merged[key]}\n\n${value}` : value
    }
  }
  return merged
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

function normalizeSectionLines(lines: string[]): string[] {
  const normalized = lines.map((line) => normalizeText(line)).filter(Boolean)
  if (normalized.length > 0) return normalized
  return [""]
}

function buildDateWeekLines(context: ExtractedReportContext | null): string[] {
  if (!context) return [""]
  return normalizeSectionLines([
    context.reportDate ? `Datum: ${context.reportDate}` : "",
    context.wvpWeekNumber ? `Weeknummer (WvP): ${context.wvpWeekNumber}` : "",
  ])
}

function buildFirstSickDayLines(context: ExtractedReportContext | null): string[] {
  if (!context) return [""]
  return normalizeSectionLines([context.firstSickDay ? `Eerste ziektedag: ${context.firstSickDay}` : ""])
}

function buildDateWeekFirstSickDayLines(context: ExtractedReportContext | null): string[] {
  if (!context) return [""]
  return normalizeSectionLines([
    context.reportDate ? `Datum: ${context.reportDate}` : "",
    context.wvpWeekNumber ? `Weeknummer (WvP): ${context.wvpWeekNumber}` : "",
    context.firstSickDay ? `Eerste ziektedag: ${context.firstSickDay}` : "",
  ])
}

function buildClientEmployerLines(context: ExtractedReportContext | null): string[] {
  if (!context) return [""]
  return normalizeSectionLines(context.clientEmployerLines)
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
      replacementBody = [""]
    } else if (isClientEmployerSection) {
      replacementBody = buildClientEmployerLines(context)
    } else if (hasDate && hasWeek && hasFirstSickDay) {
      replacementBody = buildDateWeekFirstSickDayLines(context)
    } else if (hasDate && hasWeek) {
      replacementBody = buildDateWeekLines(context)
    } else if (hasFirstSickDay) {
      replacementBody = buildFirstSickDayLines(context)
    }
    if (!replacementBody) continue

    const bodyStart = section.start + 1
    const bodyEnd = section.end
    lines.splice(bodyStart, Math.max(0, bodyEnd - bodyStart + 1), ...replacementBody)
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

function clearEmptyPlaceholderText(summary: string): string {
  const lines = String(summary || "").split(/\r?\n/)
  const cleanedLines = lines.map((line) => {
    const trimmed = String(line || "").trim()
    const normalized = normalizeHeading(trimmed)
    const isDashPlaceholder = trimmed === "-" || trimmed === "â€“" || trimmed === "â€”"
    const isNotMentionedPlaceholder =
      normalized === "niet benoemd in dit verslag" ||
      normalized === "niet benoemd in dit verslag." ||
      normalized === "niet benoemd" ||
      normalized === "niet genoemd in dit verslag"
    if (isDashPlaceholder || isNotMentionedPlaceholder) return ""
    return line
  })
  return cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

// Intent: generateSummaryWithAzureOpenAi
export async function generateSummaryWithAzureOpenAi(params: {
  transcript: string
  templateKey?: string
  template?: SummaryTemplate
  responseMode?: SummaryResponseMode
}): Promise<string> {
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

  const responseMode = params.responseMode === "structured_item_summary" ? "structured_item_summary" : "markdown"
  const reportTypeContext = resolveReportTypeContext(params.template)
  const systemPrompt = buildSummarySystemPrompt({
    responseMode,
    reportTypeContext,
    template: params.template,
  })
  const structure = buildSummaryStructure({ template: params.template, templateKey, responseMode })
  const chunkBudgetTokens = Math.max(1_500, conservativeChunkTokenBudget - estimatedPromptOverheadTokens)
  const transcriptChunks = splitTextByEstimatedTokenBudget({
    text: transcript,
    maxAllowedTokens: chunkBudgetTokens,
  })

  if (transcriptChunks.length <= 1) {
    logSummaryDebugData({
      stage: "single_chunk_request",
      reportTypeContext,
      responseMode,
      systemPrompt,
      structure,
      totalChunks: transcriptChunks.length,
      chunkIndex: 1,
      chunkText: transcriptChunks[0] || transcript,
    })
    const summary = await summarizeChunk({
      deployment,
      chunkText: transcriptChunks[0] || transcript,
      structure,
      totalChunks: 1,
      chunkIndex: 1,
      systemPrompt,
      responseMode,
      reportTypeContext,
    })
    if (responseMode === "structured_item_summary") {
      const parsed = parseStructuredSummary(summary)
      if (!parsed) throw new Error("Summary generation failed")
      return JSON.stringify(parsed)
    }
    const normalizedSummary = normalizeText(summary)
    if (!normalizedSummary) throw new Error("Summary generation failed")
    const cleanedSummary = clearEmptyPlaceholderText(removeSpeakerLabelsFromOutput(normalizedSummary))
    logSummaryDebugData({
      stage: "single_chunk_response",
      reportTypeContext,
      responseMode,
      outputText: cleanedSummary,
    })
    return applyReportSectionPolicies(cleanedSummary, reportContext)
  }

  if (responseMode === "structured_item_summary") {
    const partialStructured: StructuredSummary[] = []
    for (let chunkIndex = 0; chunkIndex < transcriptChunks.length; chunkIndex += 1) {
      const summary = await summarizeChunk({
        deployment,
        chunkText: transcriptChunks[chunkIndex],
        structure,
        totalChunks: transcriptChunks.length,
        chunkIndex: chunkIndex + 1,
        systemPrompt,
        responseMode,
        reportTypeContext,
      })
      const parsed = parseStructuredSummary(summary)
      if (!parsed) throw new Error("Summary generation failed")
      partialStructured.push(parsed)
    }
    return JSON.stringify(mergeStructuredSummaries(partialStructured))
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
      responseMode,
      reportTypeContext,
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
    reportTypeContext,
  })
  if (!merged) {
    throw new Error("Summary generation failed")
  }
  const cleanedMerged = clearEmptyPlaceholderText(removeSpeakerLabelsFromOutput(merged))
  logSummaryDebugData({
    stage: "merged_response",
    reportTypeContext,
    responseMode,
    outputText: cleanedMerged,
  })
  return applyReportSectionPolicies(cleanedMerged, reportContext)
}

// Intent: buildSummarySystemPrompt
function buildSummarySystemPrompt(params: {
  responseMode: SummaryResponseMode
  reportTypeContext: ReportTypeContext
  template?: SummaryTemplate
}) {
  const commonReportBlocks = [
    `Rapporttype: ${params.reportTypeContext.reportTypeLabel}`,
    `Tijdsperspectief: ${
      params.reportTypeContext.perspective === "forward_looking_plan"
        ? "forward-looking plan"
        : params.reportTypeContext.perspective === "retrospective_evaluation"
          ? "retrospective evaluation"
          : "generic report"
    }`,
    params.reportTypeContext.instructionBlock,
    buildFormalWritingStyleInstructionBlock(),
    buildAntiHallucinationInstructionBlock(),
    buildFieldLevelWritingInstructionBlock(params.template),
  ].join("\n\n")

  if (params.responseMode === "structured_item_summary") {
    return (
      "U maakt een samenvatting in strikt JSON-formaat voor re-integratie-items. " +
      "Antwoord met exact een JSON-object en geen markdown of extra tekst. " +
      "Gebruik exact deze keys: doelstelling, belastbaarheid, belemmeringen, voortgang, arbeidsmarktorientatie. " +
      "Gebruik lege string als een categorie ontbreekt. " +
      "Noem geen details die niet in de tekst staan.\n\n" +
      commonReportBlocks
    )
  }
  return (
    "Je bent een assistent voor CoachScribe. Vat een coachgesprek samen in het Nederlands. " +
    "Noem geen details die niet in de tekst staan. " +
    "Schrijf geen persoonsgegevens zoals e-mailadressen of telefoonnummers. " +
    "Noem of gebruik nooit sprekerlabels zoals 'speaker_1', 'speaker 1', 'spreker 1' of vergelijkbare labels. " +
    "Als de input een blok [COACHSCRIBE_REPORT_CONTEXT] bevat, gebruik die regels als leidende context voor rapporttype, tijdsperspectief, metadata en aanvullend bewijs (zoals snippets en activiteiten). Leid geen feiten af die niet expliciet in transcript of contextregels staan. " +
    "Laat de onderdelen 'Ondertekening door werkgever en werknemer', 'Aanwezigen', 'Deelnemers' en 'Ondertekening' altijd leeg. " +
    "Gebruik alleen Markdown met kopjes die beginnen met '### '. Schrijf onder elk kopje gewone doorlopende tekst zonder bullets of nummering. " +
    "Als informatie ontbreekt, laat het onderdeel leeg. Gebruik nooit '-' of varianten, en nooit teksten zoals 'Niet benoemd in dit verslag'.\n\n" +
    commonReportBlocks
  )
}

function logSummaryDebugData(params: {
  stage: string
  reportTypeContext: ReportTypeContext
  responseMode: SummaryResponseMode
  systemPrompt?: string
  structure?: string
  totalChunks?: number
  chunkIndex?: number
  chunkText?: string
  outputText?: string
}) {
  if (env.runtimeEnvironment === "production") return
  console.log("[report-ai-debug]", {
    stage: params.stage,
    reportType: params.reportTypeContext.reportTypeLabel,
    perspective: params.reportTypeContext.perspective,
    responseMode: params.responseMode,
    totalChunks: params.totalChunks,
    chunkIndex: params.chunkIndex,
    systemPromptChars: typeof params.systemPrompt === "string" ? params.systemPrompt.length : 0,
    fieldContextChars: typeof params.structure === "string" ? params.structure.length : 0,
    evidenceChars: typeof params.chunkText === "string" ? params.chunkText.length : 0,
    finalOutputChars: typeof params.outputText === "string" ? params.outputText.length : 0,
  })
}

// Intent: buildSummaryStructure
function buildSummaryStructure(params: { template?: SummaryTemplate; templateKey: string; responseMode: SummaryResponseMode }) {
  if (params.responseMode === "structured_item_summary") {
    return (
      "Gebruik exact dit JSON-shape:\n" +
      '{"doelstelling":"","belastbaarheid":"","belemmeringen":"","voortgang":"","arbeidsmarktorientatie":""}'
    )
  }
  if (params.template?.sections?.length) {
    return buildTemplateStructure(params.template)
  }
  if (params.templateKey === "soap") {
    return "Gebruik deze structuur:\n### Subjectief\n...\n### Objectief\n...\n### Analyse\n...\n### Plan\n...\n"
  }
  if (params.templateKey === "intake") {
    return (
      "Gebruik deze structuur:\n" +
      "### Doel van het gesprek\n...\n" +
      "### Achtergrond\n...\n" +
      "### Huidige situatie\n...\n" +
      "### Gewenste situatie\n...\n" +
      "### Obstakels\n...\n" +
      "### Actiepunten\n...\n" +
      "### Vervolgafspraken\n...\n"
    )
  }
  if (params.templateKey === "voorbereiding") {
    return (
      "Gebruik deze structuur:\n" +
      "### Voorbereiding\n...\n" +
      "### Doelen voor de volgende sessie\n...\n" +
      "### Vragen om te stellen\n...\n" +
      "### Aandachtspunten\n...\n" +
      "### Oefeningen / opdrachten\n...\n"
    )
  }
  if (params.templateKey === "themas") {
    return "Gebruik deze structuur:\n### Thema's\n...\n### Belangrijkste inzichten\n...\n### Actiepunten\n...\n### Afspraken / vervolg\n...\n"
  }
  if (params.templateKey === "gespreksplan") {
    return "Gebruik deze structuur:\n### Agenda\n...\n### Tijdindeling\n...\n### Vragen\n...\n### Afsluiting\n...\n"
  }
  return "Gebruik deze structuur:\n### Kern\n...\n### Belangrijkste thema's\n...\n### Actiepunten\n...\n### Afspraken / vervolg\n...\n"
}

// Intent: summarizeChunk
async function summarizeChunk(params: {
  deployment: string
  chunkText: string
  structure: string
  totalChunks: number
  chunkIndex: number
  systemPrompt: string
  responseMode: SummaryResponseMode
  reportTypeContext: ReportTypeContext
}) {
  const userPrompt =
    params.responseMode === "structured_item_summary"
      ? "Vul voor dit transcriptdeel het JSON-object in.\n\n" +
        `Dit is deel ${params.chunkIndex} van ${params.totalChunks}.\n` +
        "Gebruik alleen informatie uit dit deel. Geen extra keys.\n\n" +
        `${params.structure}\n` +
        `Transcriptdeel:\n${params.chunkText}`
      : "Maak een korte, bruikbare samenvatting van dit deel van een groter transcript.\n\n" +
        `Dit is deel ${params.chunkIndex} van ${params.totalChunks}.\n` +
        "Beschrijf alleen informatie uit dit deel.\n" +
        `Rapporttype: ${params.reportTypeContext.reportTypeLabel}.\n` +
        `Tijdsperspectief: ${
          params.reportTypeContext.perspective === "forward_looking_plan"
            ? "forward-looking plan"
            : params.reportTypeContext.perspective === "retrospective_evaluation"
              ? "retrospective evaluation"
              : "generic report"
        }.\n` +
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
  reportTypeContext: ReportTypeContext
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
        `Rapporttype: ${params.reportTypeContext.reportTypeLabel}.\n` +
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
  const structure = template.sections.map((section) => `### ${section.title}\n...`).join("\n")
  return `Gebruik de structuur van het template "${normalizeText(template.name) || "Template"}".\n\nUitleg per onderdeel:\n${sectionGuide}\n\nStructuur:\n${structure}\n`
}

