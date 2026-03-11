import type { ReactNode } from 'react'

import type { Snippet, SnippetStatus } from '@/storage/types'

export type SessionScreenProps = {
  id: string
  title: string
  clientName: string
  date: string
  onBack: () => void
}

export type SessionDataItem = {
  id: string
  inputId?: string
  clientId?: string | null
  trajectoryId?: string | null
  type?: 'written' | 'recording' | string
  createdAtUnixMs?: number
  transcript?: string | null
  summary?: string | null
  transcriptionStatus?: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
}

export type SessionNoteItem = {
  id: string
  sessionId?: string
  title?: string
  text: string
  createdAtUnixMs: number
}

export type SessionSnippetItem = Snippet & {
  inputId?: string
}

export type RightTabKey = 'chatbot' | 'notes'

export type RightTabsProps = {
  activeTabKey: RightTabKey
  onTabChange: (tabKey: RightTabKey) => void
}

export type RightPanelProps = {
  inputId: string
  notes: SessionNoteItem[]
  snippets: SessionSnippetItem[]
  summary: string | null
  transcript: string | null
  onCreateNote: (inputId: string, values: { title: string; text: string }) => void
  onUpdateNote: (noteId: string, values: { title?: string; text: string }) => void
  onDeleteNote: (noteId: string) => void
}

export type NotesTabProps = {
  notes: SessionNoteItem[]
  onEditNote: (note: SessionNoteItem) => void
  onDeleteNote: (note: SessionNoteItem) => void
}

export type SnippetSectionProps = {
  snippets: SessionSnippetItem[]
  canRegenerate?: boolean
  isRegenerating?: boolean
  onRegenerate?: () => void
  onUpdateSnippetStatus: (snippetId: string, status: SnippetStatus) => void
  onDeleteSnippet: (snippetId: string) => void
}

export type HeaderProps = {
  title: string
  clientName: string
  date: string
}

export type SummaryCardProps = {
  summary: string | null
  transcriptionStatus: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
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
  onChangeComposerValue: (value: string) => void
  onSendMessage: () => void
  onDeleteMessage: (messageId: string) => void
  onClearChat: () => void
  onOpenExpanded: () => void
}

export type UseChatbotTabLogicParams = {
  inputId: string
  summary: string | null
  transcript: string | null
  snippets: SessionSnippetItem[]
  notes: SessionNoteItem[]
}

export type ExpandedChatModalProps = {
  visible: boolean
  onClose: () => void
  children: ReactNode
}
