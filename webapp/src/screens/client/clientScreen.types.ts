import type React from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ScrollView, TextInput } from 'react-native'

import type { ChatStateMessage } from '@/types/chatState'

export type ClientLeftTabKey = 'sessies' | 'notities' | 'rapportages' | 'documenten'

export type ClientRightTabKey = 'chatbot' | 'status'

export type InputListItem = {
  id: string
  targetInputId: string
  title: string
  trajectoryLabel: string
  kind: string
  dateLabel: string
  timeLabel: string
  durationLabel: string
  isReport: boolean
  searchText: string
  createdAtUnixMs: number
  transcriptionStatus: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  rowType: 'session' | 'note' | 'report'
}

export type ClientRecord = {
  id: string
  name: string
  clientDetails?: string
  employerDetails?: string
  createdAtUnixMs: number
}

export type ClientTrajectory = {
  id: string
  clientId?: string | null
  name: string
  dienstType?: string | null
  uwvContactName?: string | null
  orderNumber?: string | null
  startDate?: string | null
  createdAtUnixMs: number
}

export type ClientInput = {
  id: string
  clientId?: string | null
  trajectoryId?: string | null
  title: string
  kind: string
  audioBlobId?: string | null
  audioDurationSeconds?: number | null
  uploadFileName?: string | null
  summary?: string | null
  reportDate?: string | null
  createdAtUnixMs: number
  transcriptionStatus: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
}

export type ClientNote = {
  id: string
  clientId?: string | null
  sourceInputId?: string | null
  sessionId: string
  title: string
  text: string
  updatedAtUnixMs: number
}

export type ClientReport = {
  id: string
  clientId?: string | null
  sourceInputId?: string | null
  title: string
  reportText: string
  createdAtUnixMs: number
  updatedAtUnixMs: number
  state: 'incomplete' | 'needs_review' | 'complete'
}

export type ClientSnippet = {
  itemId: string
  field: string
  text: string
  status: string
  date: number
}

export type ClientWrittenReport = {
  sessionId: string
  text: string
  updatedAtUnixMs: number
}

export type ClientTemplate = {
  id: string
  name: string
}

export type ClientDataShape = {
  clients: ClientRecord[]
  trajectories: ClientTrajectory[]
  inputs: ClientInput[]
  reports: ClientReport[]
  notes: ClientNote[]
  snippets: ClientSnippet[]
  inputSummaries: ClientWrittenReport[]
  templates: ClientTemplate[]
}

export type ClientIntentTemplate = {
  id: string
  name: string
}

export type ClientScreenProps = {
  clientId: string
  onBack: () => void
  onSelectInput: (sessionId: string, sourceTab: ClientLeftTabKey) => void
  onPressCreateInput: (trajectoryId: string | null) => void
  onPressCreateReports: (trajectoryId: string | null) => void
  initialLeftActiveTabKey?: ClientLeftTabKey
  initialRightActiveTabKey?: ClientRightTabKey
  onLeftActiveTabChange?: (tabKey: ClientLeftTabKey) => void
  isCreateInputDisabled?: boolean
}

export type ClientLeftTabsProps = {
  activeTabKey: ClientLeftTabKey
  filteredInputs: InputListItem[]
  hoveredItemId: string | null
  hoveredMenuItemId: string | null
  isDocumentsTab: boolean
  isSearchExpanded: boolean
  leftColumnStyle: any
  menuInputId: string | null
  searchInputRef: React.RefObject<TextInput | null>
  searchPlaceholder: string
  searchQuery: string
  title: string
  shouldShowSearch: boolean
  showsDurationColumn: boolean
  tableFirstColumnLabel: string
  onAddItem: () => void
  onOpenRowMenu: (item: InputListItem, event?: any) => void
  onPressRow: (item: InputListItem) => void
  onSelectTab: (tabKey: ClientLeftTabKey) => void
  setHoveredItemId: Dispatch<SetStateAction<string | null>>
  setHoveredMenuItemId: Dispatch<SetStateAction<string | null>>
  setIsSearchOpen: (isOpen: boolean) => void
  setSearchQuery: (value: string) => void
}

export type ClientRightTabsProps = {
  activeTabKey: ClientRightTabKey
  chatContent: React.ReactNode
  isStatusSummaryLoading: boolean
  rightColumnStyle: any
  statusSummary: string
  onSelectTab: (tabKey: ClientRightTabKey) => void
}

export type ClientChatbotProps = {
  autoFocusKey: string
  chatMessages: ChatStateMessage[]
  chatScrollRef: React.RefObject<ScrollView | null>
  clientId: string
  clientIntentTemplates: ClientIntentTemplate[]
  composerText: string
  handleSendChatMessage: () => Promise<void>
  isAssistantFullscreen: boolean
  isChatMinutesBlocked: boolean
  isChatSending: boolean
  isCheckingChatMinutes: boolean
  isModal: boolean
  isNoMinutesCtaDismissed: boolean
  onSelectStarterPrompt: (promptText: string) => Promise<void>
  onShowClearChatConfirm: () => void
  onToggleFullscreen: () => void
  setComposerText: (value: string) => void
  setIsNoMinutesCtaDismissed: (value: boolean) => void
}

