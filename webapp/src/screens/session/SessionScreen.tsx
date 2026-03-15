import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

import { semanticColorTokens } from '@/design/tokens/colors'
import { spacing } from '@/design/tokens/spacing'
import { Header } from '@/screens/session/components/Header'
import { RightPanel } from '@/screens/session/components/RightPanel'
import { SnippetSection } from '@/screens/session/components/SnippetSection'
import { SummaryCard } from '@/screens/session/components/SummaryCard'
import { SummaryEditModal } from '@/screens/session/components/modals/SummaryEditModal'
import type { InputScreenProps } from '@/screens/session/sessionScreen.types'
import { useInputScreen } from '@/screens/session/sessionScreen.logic'
import { EmptyPageMessage } from '@/ui/EmptyPageMessage'

export function InputScreen(props: InputScreenProps) {
  const { title, clientName, date, onBack } = props
  const [isSummaryEditModalOpen, setIsSummaryEditModalOpen] = React.useState(false)

  const {
    isInputMissing,
    resolvedInputId,
    isWrittenInput,
    isUploadedDocument,
    summary,
    transcriptionStatus,
    transcript,
    canRegenerateSnippets,
    sessionNotes,
    sessionSnippets,
    isSnippetStateSettling,
    isRegeneratingSnippets,
    handleRegenerateInputSnippets,
    handleUpdateSnippetStatus,
    handleDeleteSnippet,
    handleSaveSummary,
    createNote,
    updateNote,
    deleteNote,
  } = useInputScreen(props)

  if (isInputMissing) {
    return <EmptyPageMessage message="Deze sessie bestaat niet meer." onGoHome={onBack} />
  }

  return (
    <View style={styles.page}>
      <Header title={title} clientName={clientName} date={date} onBack={onBack} />

      <View style={styles.layoutRow}>
        <ScrollView style={styles.leftColumnScroll} contentContainerStyle={styles.leftColumnContent} showsVerticalScrollIndicator>
          <SummaryCard
            summary={summary}
            transcriptionStatus={transcriptionStatus}
            title={isUploadedDocument ? 'Document' : 'Samenvatting'}
            emptyText={isUploadedDocument ? 'Geen leesbare documenttekst beschikbaar.' : undefined}
            onPressEdit={!isUploadedDocument ? () => setIsSummaryEditModalOpen(true) : null}
          />

          {!isWrittenInput ? (
            <SnippetSection
              snippets={sessionSnippets}
              isLoading={((transcriptionStatus === 'transcribing' || transcriptionStatus === 'generating') && sessionSnippets.length === 0) || isSnippetStateSettling}
              canRegenerate={canRegenerateSnippets}
              isRegenerating={isRegeneratingSnippets}
              onRegenerate={handleRegenerateInputSnippets}
              onUpdateSnippetStatus={handleUpdateSnippetStatus}
              onDeleteSnippet={handleDeleteSnippet}
            />
          ) : null}
        </ScrollView>

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

      <SummaryEditModal
        visible={isSummaryEditModalOpen}
        initialSummary={String(summary || '')}
        onClose={() => setIsSummaryEditModalOpen(false)}
        onSave={handleSaveSummary}
      />
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
  leftColumnScroll: {
    flex: 1,
    minWidth: 0,
  },
  leftColumnContent: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  rightColumn: {
    width: 437,
    minWidth: 437,
    maxWidth: 437,
    minHeight: 0,
    alignSelf: 'stretch',
  },
})
