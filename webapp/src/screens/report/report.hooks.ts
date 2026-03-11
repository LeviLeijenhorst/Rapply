import { useMemo } from 'react'

import { normalizeReportScreenProps } from '@/screens/report/report.logic'
import type { ReportScreenProps } from '@/screens/report/report.types'

export function useReportScreenProps(props: ReportScreenProps) {
  return useMemo(() => normalizeReportScreenProps(props), [props.initialCoacheeId, props.initialSessionId, props.mode])
}
