import type { Session } from '../../../storage/types'

export function selectReportCandidateSessions(sessions: Session[], clientId: string) {
  return sessions.filter((session) => session.coacheeId === clientId)
}
