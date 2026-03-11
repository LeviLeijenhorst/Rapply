import React from 'react'

import { ReportEditorScreen } from '@/screens/report/ReportEditorScreen'
import { useReportScreenProps } from '@/screens/report/report.hooks'
import type { ReportScreenProps } from '@/screens/report/report.types'

export function ReportScreen(props: ReportScreenProps) {
  const normalizedProps = useReportScreenProps(props)
  return <ReportEditorScreen {...normalizedProps} />
}
