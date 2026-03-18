import { hasStructuredSummaryContent, structuredSummaryToPlainText } from '@/types/structuredSummary'

export type SessionSummarySource = {
  summary?: string | null
  summaryStructured?: unknown
}

function looksLikeTranscript(value: string): boolean {
  const text = String(value || '').trim()
  if (!text) return false
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (lines.length === 0) return false
  const transcriptLikeLines = lines.filter((line) => {
    if (/^\[\d{1,2}:\d{2}(?:\.\d+)?\]/.test(line)) return true
    if (/^\d{1,2}:\d{2}(?:\.\d+)?\s*[-:]/.test(line)) return true
    if (/^(speaker[_\s-]*\d+|spreker\s*\d+|coach|client|cliënt)\s*:/i.test(line)) return true
    return false
  }).length
  return transcriptLikeLines >= Math.max(2, Math.ceil(lines.length * 0.4))
}

export function resolveInputSummaryText(session: SessionSummarySource | null | undefined): string | null {
  const markdownSummary = String(session?.summary || '').trim()
  const structuredSummary = (session?.summaryStructured ?? null) as Parameters<typeof hasStructuredSummaryContent>[0]
  const hasStructuredSummary = hasStructuredSummaryContent(structuredSummary)
  if (hasStructuredSummary) {
    return structuredSummaryToPlainText(structuredSummary)
  }
  if (markdownSummary && !looksLikeTranscript(markdownSummary)) return markdownSummary
  return null
}
