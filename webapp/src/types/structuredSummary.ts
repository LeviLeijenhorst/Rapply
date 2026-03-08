import { parseReportSections } from './reportStructure'

export type StructuredSessionSummary = {
  doelstelling: string
  belastbaarheid: string
  belemmeringen: string
  voortgang: string
  arbeidsmarktorientatie: string
}

export const structuredSummaryFieldOrder: Array<{
  key: keyof StructuredSessionSummary
  label: string
}> = [
  { key: 'doelstelling', label: 'Doelstelling' },
  { key: 'belastbaarheid', label: 'Belastbaarheid' },
  { key: 'belemmeringen', label: 'Belemmeringen' },
  { key: 'voortgang', label: 'Voortgang' },
  { key: 'arbeidsmarktorientatie', label: 'Arbeidsmarktori\u00ebntatie' },
]

export const legacySummaryFallbackTitle = 'Samenvatting (oud formaat)'

export function createEmptyStructuredSummary(): StructuredSessionSummary {
  return {
    doelstelling: '',
    belastbaarheid: '',
    belemmeringen: '',
    voortgang: '',
    arbeidsmarktorientatie: '',
  }
}

export function normalizeStructuredSummary(value: Partial<StructuredSessionSummary> | null | undefined): StructuredSessionSummary {
  const input = value || {}
  return {
    doelstelling: String(input.doelstelling || '').trim(),
    belastbaarheid: String(input.belastbaarheid || '').trim(),
    belemmeringen: String(input.belemmeringen || '').trim(),
    voortgang: String(input.voortgang || '').trim(),
    arbeidsmarktorientatie: String(input.arbeidsmarktorientatie || '').trim(),
  }
}

function normalizeTitle(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

export function hasStructuredSummaryContent(value: StructuredSessionSummary | null | undefined): boolean {
  const normalized = normalizeStructuredSummary(value)
  return structuredSummaryFieldOrder.some((field) => normalized[field.key].length > 0)
}

export function structuredSummaryToMarkdown(value: StructuredSessionSummary | null | undefined): string {
  const normalized = normalizeStructuredSummary(value)
  const sections = structuredSummaryFieldOrder
    .map((field) => {
      const content = normalized[field.key]
      if (!content) return null
      return `### ${field.label}\n${content}`
    })
    .filter((item): item is string => Boolean(item))
  return sections.join('\n\n').trim()
}

function stripJsonCodeFences(value: string): string {
  const trimmed = String(value || '').trim()
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fencedMatch?.[1]) return fencedMatch[1].trim()
  if (!trimmed.startsWith('```')) return trimmed
  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
}

function extractFirstJsonObject(value: string): string | null {
  const text = String(value || '')
  const startIndex = text.indexOf('{')
  if (startIndex < 0) return null

  let depth = 0
  let inString = false
  let isEscaped = false

  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index]
    if (isEscaped) {
      isEscaped = false
      continue
    }
    if (char === '\\') {
      isEscaped = true
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return text.slice(startIndex, index + 1).trim()
      }
    }
  }

  return null
}

export function parseStructuredSummaryJson(value: string | null | undefined): StructuredSessionSummary | null {
  const rawInput = String(value || '').trim()
  if (!rawInput) return null
  const raw = stripJsonCodeFences(rawInput)
  const jsonCandidate = extractFirstJsonObject(raw) ?? extractFirstJsonObject(rawInput)
  if (!jsonCandidate) {
    console.log('[STRUCTURED_SUMMARY_PARSE_FAILED]', {
      reason: 'no_json_object_found',
      raw: rawInput,
    })
    return null
  }
  try {
    const parsed = JSON.parse(jsonCandidate)
    if (!parsed || typeof parsed !== 'object') {
      console.log('[STRUCTURED_SUMMARY_PARSE_FAILED]', {
        reason: 'parsed_value_not_object',
        raw: rawInput,
        jsonCandidate,
      })
      return null
    }
    return normalizeStructuredSummary(parsed as Partial<StructuredSessionSummary>)
  } catch {
    console.log('[STRUCTURED_SUMMARY_PARSE_FAILED]', {
      reason: 'json_parse_failed',
      raw: rawInput,
      jsonCandidate,
    })
    return null
  }
}

export function mapReportMarkdownToStructuredSummary(markdown: string | null | undefined): StructuredSessionSummary | null {
  const sections = parseReportSections(String(markdown || ''))
  if (sections.length === 0) return null
  const next = createEmptyStructuredSummary()
  let hasAny = false

  for (const section of sections) {
    const title = normalizeTitle(section.title)
    const content = String(section.content || '').trim()
    if (!content) continue
    if (title === 'doelstelling') {
      next.doelstelling = content
      hasAny = true
      continue
    }
    if (title === 'belastbaarheid') {
      next.belastbaarheid = content
      hasAny = true
      continue
    }
    if (title === 'belemmeringen') {
      next.belemmeringen = content
      hasAny = true
      continue
    }
    if (title === 'voortgang') {
      next.voortgang = content
      hasAny = true
      continue
    }
    if (title === 'arbeidsmarktorientatie' || title === 'arbeidsorientatie') {
      next.arbeidsmarktorientatie = content
      hasAny = true
    }
  }

  return hasAny ? next : null
}

