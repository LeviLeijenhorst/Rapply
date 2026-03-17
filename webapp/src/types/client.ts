export type ClientTrajectoryType = 'werkfit' | 'naar_werk' | 'unknown'

export type Client = {
  id: string
  name: string
  trajectoryType: ClientTrajectoryType
  profileText: string
  employerText: string
  isArchived: boolean
  createdAt: number
  updatedAt: number
}

export const unassignedClientLabel = 'Niet toegewezen'

type NamedItem = { id: string; name: string }

export function getClientDisplayName(
  clientNameOrItems: string | null | undefined | NamedItem[],
  clientIdOrFallback?: string | null,
): string {
  if (Array.isArray(clientNameOrItems)) {
    const clientId = String(clientIdOrFallback || '').trim()
    if (!clientId) return unassignedClientLabel
    const found = clientNameOrItems.find((item) => item.id === clientId)
    const value = String(found?.name || '').trim()
    return value || unassignedClientLabel
  }

  const value = String(clientNameOrItems || '').trim()
  return value || String(clientIdOrFallback || unassignedClientLabel)
}
