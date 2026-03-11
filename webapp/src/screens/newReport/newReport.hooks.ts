import { useMemo } from 'react'

import { normalizeNewReportScreenProps } from '@/screens/newReport/newReport.logic'
import type { NewReportScreenProps } from '@/screens/newReport/newReport.types'

export function useNewReportScreenProps(props: NewReportScreenProps) {
  return useMemo(
    () => normalizeNewReportScreenProps(props),
    [props.initialCoacheeId, props.initialSessionId, props.mode],
  )
}
