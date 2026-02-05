import { callSecureApi } from './secureApi'
import type { Coachee, LocalAppData, Note, Session, WrittenReport } from '../local/types'

export async function readAppData(): Promise<LocalAppData> {
  return callSecureApi<LocalAppData>('/app-data', {})
}

export async function createCoacheeRemote(coachee: Coachee): Promise<void> {
  await callSecureApi('/coachees/create', { coachee })
}

export async function updateCoacheeRemote(params: { id: string; name?: string; isArchived?: boolean; updatedAtUnixMs: number }): Promise<void> {
  await callSecureApi('/coachees/update', params)
}

export async function deleteCoacheeRemote(id: string): Promise<void> {
  await callSecureApi('/coachees/delete', { id })
}

export async function createSessionRemote(session: Session): Promise<void> {
  await callSecureApi('/sessions/create', { session })
}

export async function updateSessionRemote(params: {
  id: string
  updatedAtUnixMs: number
  coacheeId?: string | null
  title?: string
  transcript?: string | null
  summary?: string | null
  transcriptionStatus?: Session['transcriptionStatus']
  transcriptionError?: string | null
}): Promise<void> {
  await callSecureApi('/sessions/update', params)
}

export async function deleteSessionRemote(id: string): Promise<void> {
  await callSecureApi('/sessions/delete', { id })
}

export async function createNoteRemote(note: Note): Promise<void> {
  await callSecureApi('/notes/create', { note })
}

export async function updateNoteRemote(params: { id: string; text: string; updatedAtUnixMs: number }): Promise<void> {
  await callSecureApi('/notes/update', params)
}

export async function deleteNoteRemote(id: string): Promise<void> {
  await callSecureApi('/notes/delete', { id })
}

export async function setWrittenReportRemote(report: WrittenReport): Promise<void> {
  await callSecureApi('/written-reports/set', { report })
}
