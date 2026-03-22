import type { ReactNode } from 'react'

import type { Snippet, SnippetStatus } from '@/storage/types'

export type InputScreenProps = {
  id: string
  title: string
  clientName: string
  date: string
  onBack: () => void
}

export type InputDataItem = {
  id: string
  inputId?: string
  clientId?: string | null
  trajectoryId?: string | null
  type?: 'written' | 'recording' | string
  createdAtUnixMs?: number
  transcript?: string | null
  summary?: string | null
  summaryStructured?: unknown
  transcriptionStatus?: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  transcriptionProgressLabel?: string | null
}

export type InputNoteItem = {
  id: string
  sessionId?: string
  title?: string
  text: string
  createdAtUnixMs: number
}

export type InputSnippetItem = Snippet & {
  inputId?: string
}

export type RightTabKey = 'chatbot' | 'notes'

export type RightTabsProps = {
  activeTabKey: RightTabKey
  onTabChange: (tabKey: RightTabKey) => void
}

export type RightPanelProps = {
  inputId: string
  notes: InputNoteItem[]
  snippets: InputSnippetItem[]
  summary: string | null
  transcript: string | null
  onCreateNote: (inputId: string, values: { title: string; text: string }) => void
  onUpdateNote: (noteId: string, values: { title?: string; text: string }) => void
  onDeleteNote: (noteId: string) => void
}

export type NotesTabProps = {
  notes: InputNoteItem[]
  onEditNote: (note: InputNoteItem) => void
  onDeleteNote: (note: InputNoteItem) => void
}

export type SnippetSectionProps = {
  snippets: InputSnippetItem[]
  isLoading?: boolean
  hideEmptyState?: boolean
  canRegenerate?: boolean
  isRegenerating?: boolean
  onRegenerate?: () => void
  onCreateSnippet: (text: string) => void
  onUpdateSnippetStatus: (snippetId: string, status: SnippetStatus) => void
  onSaveSnippetText: (snippetId: string, text: string) => void
  onDeleteSnippet: (snippetId: string) => void
}

export type HeaderProps = {
  title: string
  clientName: string
  date: string
  onBack: () => void
  statusIndicator?: ReactNode
}

export type SummaryCardProps = {
  summary: string | null
  title?: string
  emptyText?: string
  transcriptionStatus: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  transcriptionProgressLabel?: string | null
  onPressEdit?: (() => void) | null
  onPressRegenerate?: (() => void) | null
  onPressCancelGeneration?: (() => void) | null
}

export type ChatbotMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAtUnixMs: number
}

export type ChatbotTabProps = {
  inputId: string
  variant: 'panel' | 'modal'
  messages: ChatbotMessage[]
  composerValue: string
  isSending: boolean
  shouldAutoFocus?: boolean
  onChangeComposerValue: (value: string) => void
  onSendMessage: () => void
  onClearChat: () => void
  onOpenExpanded: () => void
}

export type UseChatbotTabLogicParams = {
  inputId: string
  summary: string | null
  transcript: string | null
  snippets: InputSnippetItem[]
  notes: InputNoteItem[]
}

export type ExpandedChatModalProps = {
  visible: boolean
  onClose: () => void
  children: ReactNode
}
