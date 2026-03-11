import type { ReactNode, RefObject } from 'react'
import type { ScrollView, TextInput } from 'react-native'

export type DashboardScreenProps = {
  onSelectClient: (clientId: string) => void
  onOpenNewClientPage: () => void
  onOpenRecord: () => void
  onOpenClientsPage: () => void
  onOpenReportsPage: () => void
  onOpenInput: (sessionId: string) => void
}

export type QuickInputIconKey =
  | 'record-session'
  | 'record-summary'
  | 'record-video'
  | 'import-audio'
  | 'import-document'

export type DashboardQuickInputAction = {
  id: string
  title: string
  subtitle: string
  accentFrom: string
  accentTo: string
  iconKey: QuickInputIconKey
  onPress: () => void
}

export type DashboardContinueItem = {
  id: string
  clientId: string
  clientName: string
  subtitle: string
  profilePhotoUri: string | null
}

export type OpenActionItemKind = 'report' | 'snippet'

export type DashboardOpenActionItem = {
  id: string
  kind: OpenActionItemKind
  itemLabel: string
  statusLabel: string
  clientId: string | null
  clientName: string
  sessionId: string | null
  createdAtLabel: string
  createdAtUnixMs: number
  updatedLabel: string
  updatedAtUnixMs: number
}

export type DashboardStatCardData = {
  id: 'active-clients' | 'inputs-this-week' | 'reports-this-week' | 'open-action-items'
  title: string
  value: string
  accentFrom: string
  accentTo: string
  onPress?: () => void
}

export type DashboardScreenModel = {
  scrollRef: RefObject<ScrollView | null>
  openActionInputRef: RefObject<TextInput | null>
  isStacked: boolean
  openActionQuery: string
  setOpenActionQuery: (value: string) => void
  setOpenActionsOffsetY: (value: number) => void
  quickInputActions: DashboardQuickInputAction[]
  continueItems: DashboardContinueItem[]
  filteredOpenActionItems: DashboardOpenActionItem[]
  dashboardStatCards: DashboardStatCardData[]
}

