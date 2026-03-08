import type { ReportListItem } from '../selectors/reportListSelectors'

export function filterReportItems(items: ReportListItem[], query: string): ReportListItem[] {
  const normalizedQuery = String(query || '').trim().toLowerCase()
  if (!normalizedQuery) return items
  return items.filter((item) => {
    return item.title.toLowerCase().includes(normalizedQuery) || item.clientName.toLowerCase().includes(normalizedQuery)
  })
}
