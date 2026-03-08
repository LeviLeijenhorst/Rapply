export type ReportSection = {
  title: string
  content: string
}

const legacyFallbackTitle = 'Samenvatting (oud formaat)'

function stripSectionNumberPrefix(value: string): string {
  return String(value || '')
    .replace(/^\s*\d+(?:[.,]\d+)*\s*/, '')
    .replace(/^\s*[-:.)]\s*/, '')
    .trim()
}

function stripMarkdownListPrefix(line: string): string {
  return String(line || '')
    .replace(/^\s*[-*]\s+/, '')
    .replace(/^\s*\d+[.)]\s+/, '')
    .trimEnd()
}

function normalizePlaceholderLine(line: string): string {
  const trimmed = String(line || '').trim()
  const normalized = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  if (normalized === 'naam') return 'Naam contactpersoon re-integratiebedrijf'
  if (normalized === 'datum en handtekening') return 'Datum'
  return trimmed
}

export function parseReportSections(markdown: string): ReportSection[] {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n')
  const sections: ReportSection[] = []
  let currentTitle = ''
  let currentContentLines: string[] = []

  const pushCurrentSection = () => {
    if (!currentTitle && currentContentLines.length === 0) return
    sections.push({
      title: currentTitle || 'Samenvatting',
      content: currentContentLines.join('\n').trim(),
    })
    currentTitle = ''
    currentContentLines = []
  }

  for (const rawLine of lines) {
    const headingMatch = rawLine.match(/^###\s+(.+)\s*$/)
    if (headingMatch) {
      pushCurrentSection()
      currentTitle = stripSectionNumberPrefix(headingMatch[1].trim())
      continue
    }
    const normalizedLine = rawLine.trim()
    if (/^[-_]{3,}$/.test(normalizedLine)) continue
    currentContentLines.push(normalizePlaceholderLine(stripMarkdownListPrefix(rawLine)))
  }

  pushCurrentSection()

  if (sections.length > 0) return sections

  const trimmed = String(markdown || '').trim()
  if (!trimmed) return []
  return [{ title: legacyFallbackTitle, content: trimmed }]
}

export function serializeReportSections(sections: ReportSection[]): string {
  const normalized = sections
    .map((section, index) => ({
      title: String(section.title || '').trim() || `Onderdeel ${index + 1}`,
      content: String(section.content || '').trim(),
    }))
    .filter((section) => section.title.length > 0)

  if (normalized.length === 0) return ''

  return normalized.map((section) => `### ${section.title}\n${section.content}`).join('\n\n').trim()
}
