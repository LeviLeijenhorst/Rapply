import { parseReportSections } from './reportStructure'

export type StructuredInputSummary = {
  doelstelling: string
  belastbaarheid: string
  belemmeringen: string
  voortgang: string
  arbeidsmarktorientatie: string
}

export const structuredSummaryFieldOrder: Array<{
  key: keyof StructuredInputSummary
  label: string
}> = [
  { key: 'doelstelling', label: 'Kernpunten' },
  { key: 'belastbaarheid', label: 'Situatie' },
  { key: 'belemmeringen', label: 'Aandachtspunten' },
  { key: 'voortgang', label: 'Afspraken' },
  { key: 'arbeidsmarktorientatie', label: 'Vervolg' },
]

export const legacySummaryFallbackTitle = 'Samenvatting (oud formaat)'

export function createEmptyStructuredSummary(): StructuredInputSummary {
  return {
    doelstelling: '',
    belastbaarheid: '',
    belemmeringen: '',
    voortgang: '',
    arbeidsmarktorientatie: '',
  }
}

export function normalizeStructuredSummary(value: Partial<StructuredInputSummary> | null | undefined): StructuredInputSummary {
  const input = value || {}
  const doelstelling = String(input.doelstelling || (input as Record<string, unknown>).kernpunten || '').trim()
  const belastbaarheid = String(input.belastbaarheid || (input as Record<string, unknown>).situatie || '').trim()
  const belemmeringen = String(input.belemmeringen || (input as Record<string, unknown>).aandachtspunten || '').trim()
  const voortgang = String(input.voortgang || (input as Record<string, unknown>).afspraken || '').trim()
  const arbeidsmarktorientatie = String(input.arbeidsmarktorientatie || (input as Record<string, unknown>).vervolg || '').trim()
  return {
    doelstelling,
    belastbaarheid,
    belemmeringen,
    voortgang,
    arbeidsmarktorientatie,
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

export function hasStructuredSummaryContent(value: StructuredInputSummary | null | undefined): boolean {
  const normalized = normalizeStructuredSummary(value)
  return structuredSummaryFieldOrder.some((field) => normalized[field.key].length > 0)
}

export function structuredSummaryToMarkdown(value: StructuredInputSummary | null | undefined): string {
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

export function structuredSummaryToPlainText(value: StructuredInputSummary | null | undefined): string {
  const normalized = normalizeStructuredSummary(value)

  const normalizeSentence = (input: string): string => {
    const trimmed = String(input || '').trim()
    if (!trimmed) return ''
    if (/[.!?]$/.test(trimmed)) return trimmed
    return `${trimmed}.`
  }

  const orderedParts = [
    normalizeSentence(normalized.doelstelling),
    normalizeSentence(normalized.belastbaarheid),
    normalizeSentence(normalized.belemmeringen),
    normalizeSentence(normalized.voortgang),
    normalizeSentence(normalized.arbeidsmarktorientatie),
  ].filter((content): content is string => content.length > 0)

  return orderedParts.join(' ').trim()
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

export function parseStructuredSummaryJson(value: string | null | undefined): StructuredInputSummary | null {
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
    return normalizeStructuredSummary(parsed as Partial<StructuredInputSummary>)
  } catch {
    console.log('[STRUCTURED_SUMMARY_PARSE_FAILED]', {
      reason: 'json_parse_failed',
      raw: rawInput,
      jsonCandidate,
    })
    return null
  }
}

export function mapReportMarkdownToStructuredSummary(markdown: string | null | undefined): StructuredInputSummary | null {
  const sections = parseReportSections(String(markdown || ''))
  if (sections.length === 0) return null
  const next = createEmptyStructuredSummary()
  let hasAny = false

  for (const section of sections) {
    const title = normalizeTitle(section.title)
    const content = String(section.content || '').trim()
    if (!content) continue
    if (title === 'doelstelling' || title === 'kernpunten') {
      next.doelstelling = content
      hasAny = true
      continue
    }
    if (title === 'belastbaarheid' || title === 'situatie') {
      next.belastbaarheid = content
      hasAny = true
      continue
    }
    if (title === 'belemmeringen' || title === 'aandachtspunten') {
      next.belemmeringen = content
      hasAny = true
      continue
    }
    if (title === 'voortgang' || title === 'afspraken') {
      next.voortgang = content
      hasAny = true
      continue
    }
    if (title === 'arbeidsmarktorientatie' || title === 'arbeidsorientatie' || title === 'vervolg') {
      next.arbeidsmarktorientatie = content
      hasAny = true
    }
  }

  return hasAny ? next : null
}


