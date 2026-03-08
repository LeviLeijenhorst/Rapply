import type { Session } from '../../../storage/types'
import { selectReportCandidateSessions } from '../selectors/newReportSelectors'

export function newReportViewModel(sessions: Session[], clientId: string) {
  return { candidates: selectReportCandidateSessions(sessions, clientId) }
}
