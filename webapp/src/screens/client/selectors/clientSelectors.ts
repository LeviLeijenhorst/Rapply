import type { Coachee } from '../../../storage/types'

export function selectClientById(clients: Coachee[], clientId: string) {
  return clients.find((client) => client.id === clientId) ?? null
}
