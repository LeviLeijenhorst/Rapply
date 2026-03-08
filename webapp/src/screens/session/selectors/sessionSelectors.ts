import type { Session } from '../../../storage/types'

export function selectSessionById(sessions: Session[], sessionId: string) {
  return sessions.find((session) => session.id === sessionId) ?? null
}
