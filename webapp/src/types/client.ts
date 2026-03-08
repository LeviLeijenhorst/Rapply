export type ClientTrajectoryType = 'werkfit' | 'naar_werk' | 'unknown'

export type Client = {
  id: string
  name: string
  trajectoryType: ClientTrajectoryType
  profileText: string
  employerText: string
  firstSickDay: string
  isArchived: boolean
  createdAt: number
  updatedAt: number
}

export const unassignedClientLabel = 'Ongekoppelde client'
export const unassignedCoacheeLabel = unassignedClientLabel

type NamedItem = { id: string; name: string }

export function getClientDisplayName(clientName: string | null | undefined, fallbackLabel?: string): string {
  const value = String(clientName || '').trim()
  return value || String(fallbackLabel || unassignedClientLabel)
}

export function getCoacheeDisplayName(
  clientNameOrItems: string | null | undefined | NamedItem[],
  clientIdOrFallback?: string | null,
): string {
  if (Array.isArray(clientNameOrItems)) {
    const clientId = String(clientIdOrFallback || '').trim()
    if (!clientId) return unassignedClientLabel
    const found = clientNameOrItems.find((item) => item.id === clientId)
    return getClientDisplayName(found?.name || null)
  }
  return getClientDisplayName(clientNameOrItems, clientIdOrFallback || undefined)
}
