import type { WrittenReport } from '../../../storage/types'
import { selectReportBySessionId } from '../selectors/reportSelectors'

export function reportViewModel(reports: WrittenReport[], sessionId: string) {
  return { report: selectReportBySessionId(reports, sessionId) }
}
