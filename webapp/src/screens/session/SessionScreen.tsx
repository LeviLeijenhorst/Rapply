import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { useLocalAppData } from '../../storage/LocalAppDataProvider'
import { EmptyPageMessage } from '../../ui/EmptyPageMessage'
import { sessionViewModel } from './viewModels/sessionViewModel'
import { selectSessionNotes } from './selectors/sessionNoteSelectors'
import { SessionHeader } from './components/SessionHeader'
import { SessionSummaryCard } from './components/SessionSummaryCard'
import { SnippetApprovalSection } from './components/SnippetApprovalSection'
import { SessionNotesCard } from './components/SessionNotesCard'

type Props = {
  sessionId: string
  title: string
  coacheeName: string
  dateLabel: string
  forceRapportageOnly?: boolean
  initialOpenTemplatePicker?: boolean
  onInitialTemplatePickerHandled?: () => void
  onBack: () => void
  onOpenNewCoachee: () => void
  onOpenMySubscription: () => void
  onChangeCoachee: (coacheeId: string | null) => void
  newlyCreatedCoacheeName?: string | null
  onNewlyCreatedCoacheeHandled?: () => void
}

export function SessionScreen({ sessionId, title, coacheeName, dateLabel, onBack }: Props) {
  const { data, createNote, updateSnippet } = useLocalAppData()
  const { session, snippets } = useMemo(() => sessionViewModel(data.sessions, data.snippets, sessionId), [data.sessions, data.snippets, sessionId])
  const notes = useMemo(() => selectSessionNotes(data.notes, sessionId), [data.notes, sessionId])

  if (!session) {
    return <EmptyPageMessage message="Deze sessie bestaat niet meer." onGoHome={onBack} />
  }

  return (
    <View style={styles.page}>
      <SessionHeader title={title} clientName={coacheeName} dateLabel={dateLabel} onBack={onBack} />

      <View style={styles.layoutRow}>
        <View style={styles.leftColumn}>
          <SessionSummaryCard
            summary={session.summary}
            summaryStructured={session.summaryStructured}
            transcript={session.transcript}
            transcriptionStatus={session.transcriptionStatus}
          />
          <SnippetApprovalSection
            snippets={snippets}
            onUpdateSnippetStatus={(snippetId, status) => {
              updateSnippet(snippetId, { status })
            }}
          />
        </View>

        <View style={styles.rightColumn}>
          <SessionNotesCard
            sessionId={sessionId}
            notes={notes}
            snippets={snippets}
            summary={session.summary}
            transcript={session.transcript}
            onCreateNote={createNote}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 20,
    backgroundColor: '#F7F5F8',
  },
  layoutRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  leftColumn: {
    flex: 1,
    gap: 24,
    minWidth: 0,
  },
  rightColumn: {
    width: 437,
    minWidth: 437,
    maxWidth: 437,
    paddingBottom: 8,
  },
})
