import type { Coachee, Session } from '../../../storage/types'
import { selectClientSessions } from '../selectors/clientSessionSelectors'

export function clientViewModel(clients: Coachee[], sessions: Session[], clientId: string) {
  const client = clients.find((item) => item.id === clientId) ?? null
  return {
    client,
    sessions: selectClientSessions(sessions, clientId),
  }
}
