import type { SessionListItem } from '../selectors/sessionListSelectors'

export function filterSessionListItems(items: SessionListItem[], query: string): SessionListItem[] {
  const normalizedQuery = String(query || '').trim().toLowerCase()
  if (!normalizedQuery) return items
  return items.filter((item) =>
    item.clientName.toLowerCase().includes(normalizedQuery) ||
    item.title.toLowerCase().includes(normalizedQuery) ||
    item.dateLabel.toLowerCase().includes(normalizedQuery),
  )
}
