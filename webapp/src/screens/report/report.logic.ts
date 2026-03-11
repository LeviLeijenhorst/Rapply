import type { ReportScreenProps } from '@/screens/report/report.types'

export function normalizeReportScreenProps(props: ReportScreenProps): Required<ReportScreenProps> {
  return {
    initialCoacheeId: props.initialCoacheeId ?? null,
    initialSessionId: props.initialSessionId ?? null,
    mode: props.mode ?? 'controleren',
  }
}
