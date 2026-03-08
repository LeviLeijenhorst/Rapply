import React from 'react'
import { View } from 'react-native'

import { ConversationTabs, type ConversationTabKey } from './ConversationTabs'
import { NotesTabPanel } from './NotesTabPanel'
import { TranscriptTabPanel } from './TranscriptTabPanel'

type Props = {
  activeTabKey: ConversationTabKey
  onSelectTab: (tabKey: ConversationTabKey) => void
  reportPanelNode?: React.ReactNode
  snippetsPanelNode?: React.ReactNode
  linkedActivitiesNode?: React.ReactNode
  transcript?: string | null
  transcriptionStatus?: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  transcriptionError?: string | null
  transcriptSearchText?: string
  onChangeTranscriptSearchText?: (value: string) => void
  onSeekToSeconds?: (seconds: number) => void
  suppressTranscriptErrorToast?: boolean
  useTranscriptTintColors?: boolean
  transcriptHighlightTintColor?: string
  [key: string]: unknown
}

export function TabContent(props: Props) {
  return (
    <View>
      <ConversationTabs activeTabKey={props.activeTabKey} onSelectTab={props.onSelectTab} />
      {props.activeTabKey === 'summary' ? props.reportPanelNode ?? null : null}
      {props.activeTabKey === 'activities' ? props.snippetsPanelNode ?? props.linkedActivitiesNode ?? null : null}
      {props.activeTabKey === 'notes' ? <NotesTabPanel sessionId={typeof props.sessionId === 'string' ? props.sessionId : undefined} /> : null}
      {props.activeTabKey === 'transcript' ? (
        <TranscriptTabPanel
          transcript={props.transcript ?? null}
          transcriptionStatus={props.transcriptionStatus ?? 'idle'}
          transcriptionError={props.transcriptionError ?? null}
          searchValue={props.transcriptSearchText ?? ''}
          onChangeSearchValue={props.onChangeTranscriptSearchText ?? (() => {})}
          onSeekToSeconds={props.onSeekToSeconds}
          suppressErrorToast={Boolean(props.suppressTranscriptErrorToast)}
          useTintColors={Boolean(props.useTranscriptTintColors)}
          highlightTintColor={props.transcriptHighlightTintColor ?? undefined}
        />
      ) : null}
    </View>
  )
}

