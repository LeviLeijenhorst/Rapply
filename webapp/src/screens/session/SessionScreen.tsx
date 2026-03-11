import React from 'react'
import { StyleSheet, View } from 'react-native'

import { semanticColorTokens } from '@/design/tokens/colors'
import { spacing } from '@/design/tokens/spacing'
import { Header } from '@/screens/session/components/Header'
import { RightPanel } from '@/screens/session/components/RightPanel'
import { SnippetSection } from '@/screens/session/components/SnippetSection'
import { SummaryCard } from '@/screens/session/components/SummaryCard'
import type { InputScreenProps } from '@/screens/session/sessionScreen.types'
import { useInputScreen } from '@/screens/session/sessionScreen.logic'
import { EmptyPageMessage } from '@/ui/EmptyPageMessage'

export function InputScreen(props: InputScreenProps) {
  const { title, clientName, date, onBack } = props

  const {
    isInputMissing,
    resolvedInputId,
    summary,
    transcriptionStatus,
    transcript,
    canRegenerateSnippets,
    sessionNotes,
    sessionSnippets,
    isRegeneratingSnippets,
    handleRegenerateInputSnippets,
    handleUpdateSnippetStatus,
    handleDeleteSnippet,
    createNote,
    updateNote,
    deleteNote,
  } = useInputScreen(props)

  if (isInputMissing) {
    return <EmptyPageMessage message="Deze sessie bestaat niet meer." onGoHome={onBack} />
  }

  return (
    <View style={styles.page}>
      {/* Page header */}
      <Header title={title} clientName={clientName} date={date} />

      <View style={styles.layoutRow}>
        {/* Left column: summary + snippets */}
        <View style={styles.leftColumn}>
          <SummaryCard summary={summary} transcriptionStatus={transcriptionStatus} />

          <SnippetSection
            snippets={sessionSnippets}
            canRegenerate={canRegenerateSnippets}
            isRegenerating={isRegeneratingSnippets}
            onRegenerate={handleRegenerateInputSnippets}
            onUpdateSnippetStatus={handleUpdateSnippetStatus}
            onDeleteSnippet={handleDeleteSnippet}
          />
        </View>

        {/* Right column: chatbot + notes */}
        <View style={styles.rightColumn}>
          <RightPanel
            inputId={resolvedInputId}
            notes={sessionNotes}
            snippets={sessionSnippets}
            summary={summary}
            transcript={transcript}
            onCreateNote={createNote}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.lg - 4,
    backgroundColor: semanticColorTokens.light.pageBackground,
  },
  layoutRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  leftColumn: {
    flex: 1,
    gap: spacing.lg,
    minWidth: 0,
  },
  rightColumn: {
    width: 437,
    minWidth: 437,
    maxWidth: 437,
    minHeight: 0,
    alignSelf: 'stretch',
  },
})

