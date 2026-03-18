import { getClientDisplayName } from '../../../types/client'
import type { Input, LocalAppData } from '../../../storage/types'

export type SessionListItem = {
  inputId: string
  clientId: string | null
  trajectoryId: string | null
  clientName: string
  title: string
  createdAtUnixMs: number
  dateLabel: string
}

function isSessionListInput(input: Input): boolean {
  if (input.type === 'uploaded-document') return false
  if (input.type === 'recorded-session') return true
  if (input.type === 'written-recap') return true
  if (input.type === 'uploaded-session') return true
  if (input.type === 'spoken-recap') return input.kind !== 'intake'
  return false
}

function formatDateLabel(unixMs: number): string {
  return new Date(unixMs).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function toSessionListItem(input: Input, data: LocalAppData): SessionListItem {
  return {
    inputId: input.id,
    clientId: input.clientId,
    trajectoryId: input.trajectoryId,
    clientName: getClientDisplayName(data.clients, input.clientId),
    title: String(input.title || '').trim() || 'Sessie',
    createdAtUnixMs: input.createdAtUnixMs,
    dateLabel: formatDateLabel(input.createdAtUnixMs),
  }
}

export function selectSessionListItems(data: LocalAppData): SessionListItem[] {
  return data.inputs
    .filter(isSessionListInput)
    .map((input) => toSessionListItem(input, data))
    .sort((a, b) => {
      if (b.createdAtUnixMs !== a.createdAtUnixMs) return b.createdAtUnixMs - a.createdAtUnixMs
      return a.title.localeCompare(b.title, 'nl')
    })
}
