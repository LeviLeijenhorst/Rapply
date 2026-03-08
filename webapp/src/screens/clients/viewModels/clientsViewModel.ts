import type { Coachee } from '../../../storage/types'
import { selectActiveClients, type ClientListItem } from '../selectors/clientListSelectors'

export function clientsViewModel(clients: Coachee[]) {
  return { activeClients: selectActiveClients(clients) }
}

export function filterClientListItems(items: ClientListItem[], query: string): ClientListItem[] {
  const normalizedQuery = String(query || '').trim().toLowerCase()
  if (!normalizedQuery) return items
  return items.filter((item) => item.clientName.toLowerCase().includes(normalizedQuery))
}
