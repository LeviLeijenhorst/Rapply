import { isSessionReportArtifact } from '../../../types/sessionArtifacts'
import type { Coachee, LocalAppData } from '../../../storage/types'

export type ClientListStatus = 'active' | 'closed'

export type ClientListItem = {
  clientId: string
  clientName: string
  profilePhotoUri: string | null
  trajectoryCount: number
  sessionCount: number
  reportCount: number
  status: ClientListStatus
  statusLabel: 'Actief' | 'Afgesloten'
  lastSessionLabel: string
  lastSessionAtUnixMs: number | null
}

function toRelativeDateLabel(valueUnixMs: number | null): string {
  if (!valueUnixMs) return 'Nog geen sessie'
  const now = Date.now()
  const diffMs = Math.max(0, now - valueUnixMs)
  const dayMs = 24 * 60 * 60 * 1000
  const diffDays = Math.floor(diffMs / dayMs)
  if (diffDays <= 0) return 'Vandaag'
  if (diffDays === 1) return '1 dag geleden'
  if (diffDays < 7) return `${diffDays} dagen geleden`
  if (diffDays < 14) return '1 week geleden'
  if (diffDays < 31) return `${Math.floor(diffDays / 7)} weken geleden`
  if (diffDays < 61) return '1 maand geleden'
  return `${Math.floor(diffDays / 30)} maanden geleden`
}

function parseJsonObject(value: string | null | undefined): Record<string, unknown> | null {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function pickProfilePhotoUri(clientDetails: string): string | null {
  const parsed = parseJsonObject(clientDetails)
  if (!parsed) return null

  const candidateKeys = [
    'profilePhotoDataUrl',
    'photoDataUrl',
    'avatarDataUrl',
    'profilePhotoUrl',
    'photoUrl',
    'avatarUrl',
    'imageUrl',
    'image',
  ] as const

  for (const key of candidateKeys) {
    const value = readString(parsed[key])
    if (value) return value
  }

  return null
}

function toClientListItem(client: Coachee, data: LocalAppData): ClientListItem {
  const sessions = data.sessions.filter((session) => session.coacheeId === client.id)
  const trajectories = data.trajectories.filter((trajectory) => trajectory.coacheeId === client.id)
  const reports = sessions.filter((session) => isSessionReportArtifact(session))
  const lastSessionAtUnixMs =
    sessions.length > 0 ? Math.max(...sessions.map((session) => session.createdAtUnixMs)) : null
  const status: ClientListStatus = client.isArchived ? 'closed' : 'active'

  return {
    clientId: client.id,
    clientName: client.name,
    profilePhotoUri: pickProfilePhotoUri(client.clientDetails),
    trajectoryCount: trajectories.length,
    sessionCount: sessions.length,
    reportCount: reports.length,
    status,
    statusLabel: status === 'active' ? 'Actief' : 'Afgesloten',
    lastSessionLabel: toRelativeDateLabel(lastSessionAtUnixMs),
    lastSessionAtUnixMs,
  }
}

export function selectClientListItems(data: LocalAppData): ClientListItem[] {
  return data.coachees
    .map((client) => toClientListItem(client, data))
    .sort((a, b) => {
      if ((b.lastSessionAtUnixMs ?? 0) !== (a.lastSessionAtUnixMs ?? 0)) {
        return (b.lastSessionAtUnixMs ?? 0) - (a.lastSessionAtUnixMs ?? 0)
      }
      return a.clientName.localeCompare(b.clientName, 'nl')
    })
}

export function selectActiveClients(clients: Coachee[]) {
  return clients.filter((client) => !client.isArchived)
}
