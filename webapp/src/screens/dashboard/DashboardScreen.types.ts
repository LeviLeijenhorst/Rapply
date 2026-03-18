import type { RefObject } from 'react'
import type { ScrollView } from 'react-native'

export type DashboardScreenProps = {
  onSelectClient: (clientId: string) => void
  onOpenNewClientPage: () => void
  onOpenRecord: (action: DashboardQuickInputId) => void
  onOpenClientsPage: () => void
  onOpenSessionsPage: () => void
  onOpenReportsPage: () => void
  onOpenInput: (sessionId: string) => void
  welcomeName?: string | null
}

export type QuickInputIconKey =
  | 'record-session'
  | 'record-summary'
  | 'write-report'
  | 'record-video'
  | 'import-audio'
  | 'import-document'

export type DashboardQuickInputId = QuickInputIconKey

export type DashboardQuickInputAction = {
  id: DashboardQuickInputId
  title: string
  subtitle: string
  accentFrom: string
  accentTo: string
  iconKey: QuickInputIconKey
  onPress?: () => void
}

export type DashboardContinueItem = {
  id: string
  clientId: string
  clientName: string
  subtitle: string
  profilePhotoUri: string | null
}

export type DashboardStatCardData = {
  id: 'active-clients' | 'inputs-this-week' | 'reports-this-week'
  title: string
  value: string
  accentFrom: string
  accentTo: string
  onPress?: () => void
}

export type DashboardScreenModel = {
  scrollRef: RefObject<ScrollView | null>
  isStacked: boolean
  welcomeName: string
  quickInputActions: DashboardQuickInputAction[]
  continueItems: DashboardContinueItem[]
  dashboardStatCards: DashboardStatCardData[]
}
