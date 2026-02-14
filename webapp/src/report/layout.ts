export function buildReportFooterLine(practiceName: string, website: string): string {
  const parts = [String(practiceName || '').trim(), String(website || '').trim()].filter((part) => part.length > 0)
  return parts.join(' | ')
}

export function formatReportDate(date: Date): string {
  return date.toLocaleDateString('nl-NL', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '/')
}
