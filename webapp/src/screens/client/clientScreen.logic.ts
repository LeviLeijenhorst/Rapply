import { isSessionNotesArtifact, isSessionReportArtifact } from '@/types/sessionArtifacts'
import type {
  ClientDataShape,
  ClientSession,
  ClientTrajectory,
  SessionListItem,
} from '@/screens/client/clientScreen.types'

function formatDurationLabel(durationSeconds: number | null): string {
  if (!Number.isFinite(durationSeconds) || durationSeconds === null || durationSeconds <= 0) return ''
  const roundedSeconds = Math.max(0, Math.round(durationSeconds))
  const hours = Math.floor(roundedSeconds / 3600)
  const minutes = Math.floor((roundedSeconds % 3600) / 60)
  const seconds = roundedSeconds % 60
  const paddedMinutes = String(minutes).padStart(hours > 0 ? 2 : 1, '0')
  const paddedSeconds = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${paddedMinutes}:${paddedSeconds}` : `${minutes}:${paddedSeconds}`
}

export function formatTrajectoryDurationLabel(startDate: string | null | undefined): string {
  const raw = String(startDate || '').trim()
  if (!raw) return '-'
  const dutchMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  const parsed = dutchMatch
    ? new Date(Number(dutchMatch[3]), Number(dutchMatch[2]) - 1, Number(dutchMatch[1]))
    : new Date(raw)
  if (!Number.isFinite(parsed.getTime())) return '-'
  const weeks = Math.max(1, Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24 * 7)))
  return `${weeks} weken`
}

export function getClientTrajectories(data: ClientDataShape, clientId: string): ClientTrajectory[] {
  return data.trajectories
    .filter((item) => readTrajectoryClientId(item) === clientId)
    .sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs)
}

export function getActiveTrajectory(clientTrajectories: ClientTrajectory[], selectedTrajectoryId: string): ClientTrajectory | null {
  return selectedTrajectoryId
    ? clientTrajectories.find((trajectory) => trajectory.id === selectedTrajectoryId) ?? clientTrajectories[0] ?? null
    : clientTrajectories.find((trajectory) => Boolean(String(trajectory.startDate || '').trim())) ?? clientTrajectories[0] ?? null
}

function readSessionClientId(session: ClientSession): string {
  return String((session as any).clientId || '')
}

function readTrajectoryClientId(trajectory: ClientTrajectory): string {
  return String((trajectory as any).clientId || '')
}

export function getClientSessionListItems(data: ClientDataShape, clientId: string): {
  allSessionItems: SessionListItem[]
  sessionItems: SessionListItem[]
  noteItems: SessionListItem[]
  reportItems: SessionListItem[]
  notesSession: ClientSession | null
} {
  const allSessionItems = data.sessions
    .filter((item) => readSessionClientId(item) === clientId)
    .map<SessionListItem>((item) => ({
      id: item.id,
      targetSessionId: item.id,
      title: item.title,
      trajectoryLabel: item.trajectoryId ? data.trajectories.find((t) => t.id === item.trajectoryId)?.name || 'Traject' : 'Geen traject',
      kind: item.kind,
      dateLabel: new Date(item.createdAtUnixMs).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric', year: 'numeric' }),
      timeLabel: new Date(item.createdAtUnixMs).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
      durationLabel: formatDurationLabel(item.audioDurationSeconds ?? null),
      isReport: isSessionReportArtifact(item),
      searchText: `${item.title} ${item.trajectoryId ? data.trajectories.find((t) => t.id === item.trajectoryId)?.name || 'Traject' : 'Geen traject'}`.toLowerCase(),
      createdAtUnixMs: item.createdAtUnixMs,
      transcriptionStatus: item.transcriptionStatus,
      rowType: isSessionReportArtifact(item) ? 'report' : 'session',
    }))
    .sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)

  const sessionItems = allSessionItems.filter(
    (item) =>
      !isSessionNotesArtifact(item) &&
      !isSessionReportArtifact(data.sessions.find((session) => session.id === item.id) ?? { kind: 'notes' }),
  )

  const notesSessionIds = new Set(
    data.sessions.filter((session) => readSessionClientId(session) === clientId && isSessionNotesArtifact(session)).map((session) => session.id),
  )

  const noteItems: SessionListItem[] = notesSessionIds.size
    ? data.notes
        .filter((note) => notesSessionIds.has(note.sessionId))
        .map<SessionListItem>((note) => {
          const linkedSession = data.sessions.find((session) => session.id === note.sessionId) ?? null
          const linkedTrajectoryLabel = linkedSession?.trajectoryId
            ? data.trajectories.find((trajectory) => trajectory.id === linkedSession.trajectoryId)?.name || 'Traject'
            : 'Geen traject'
          const fallbackTitle = String(note.text || '').trim().split('\n')[0] || 'Notitie'
          const noteTitle = String(note.title || '').trim() || fallbackTitle
          return {
            id: note.id,
            targetSessionId: note.sessionId,
            title: noteTitle,
            trajectoryLabel: linkedTrajectoryLabel,
            kind: 'note-item',
            dateLabel: new Date(note.updatedAtUnixMs).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric', year: 'numeric' }),
            timeLabel: new Date(note.updatedAtUnixMs).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
            durationLabel: '',
            isReport: false,
            searchText: `${noteTitle} ${note.text || ''} ${linkedTrajectoryLabel}`.toLowerCase(),
            createdAtUnixMs: note.updatedAtUnixMs,
            transcriptionStatus: 'done',
            rowType: 'note',
          }
        })
        .sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
    : []

  const reportItems = allSessionItems.filter((item) => item.rowType === 'report')
  const notesSession =
    data.sessions
      .filter((session) => readSessionClientId(session) === clientId && isSessionNotesArtifact(session))
      .sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)[0] ?? null

  return {
    allSessionItems,
    sessionItems,
    noteItems,
    reportItems,
    notesSession,
  }
}
