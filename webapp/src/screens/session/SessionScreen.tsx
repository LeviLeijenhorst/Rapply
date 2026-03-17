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
  React.useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const styleId = 'session-left-scrollbar-track-transparent'
    if (document.getElementById(styleId)) return undefined
    const styleElement = document.createElement('style')
    styleElement.id = styleId
    styleElement.textContent =
      '[data-left-column-scroll="true"]::-webkit-scrollbar-track { background: transparent; }' +
      '[data-left-column-scroll="true"]::-webkit-scrollbar-corner { background: transparent; }'
    document.head.appendChild(styleElement)
    return () => {
      try {
        styleElement.remove()
      } catch {}
    }
  }, [])

  const {
    isInputMissing,
    resolvedInputId,
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
    handleCreateSnippet,
    handleUpdateSnippetStatus,
    handleSaveSnippetText,
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
        <View style={styles.leftColumn}>
          <ScrollView
            {...({ 'data-left-column-scroll': 'true' } as any)}
            style={styles.leftColumnScroll}
            contentContainerStyle={styles.leftColumnContent}
            showsVerticalScrollIndicator
          >
            <SummaryCard
              summary={summary}
              transcriptionStatus={transcriptionStatus}
              title={isUploadedDocument ? 'Document' : 'Samenvatting'}
              emptyText={isUploadedDocument ? 'Geen leesbare documenttekst beschikbaar.' : undefined}
              onPressEdit={!isUploadedDocument ? () => setIsSummaryEditModalOpen(true) : null}
            />

            <SnippetSection
              snippets={sessionSnippets}
              isLoading={((transcriptionStatus === 'transcribing' || transcriptionStatus === 'generating') && sessionSnippets.length === 0) || isSnippetStateSettling}
              canRegenerate={canRegenerateSnippets}
              isRegenerating={isRegeneratingSnippets}
              onRegenerate={handleRegenerateInputSnippets}
              onCreateSnippet={handleCreateSnippet}
              onUpdateSnippetStatus={handleUpdateSnippetStatus}
              onSaveSnippetText={handleSaveSnippetText}
              onDeleteSnippet={handleDeleteSnippet}
            />
          </ScrollView>
        </View>

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
    paddingBottom: 0,
    gap: spacing.sm,
    backgroundColor: semanticColorTokens.light.pageBackground,
  },
  layoutRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.lg,
  },
  leftColumn: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    marginRight: -spacing.sm,
    paddingRight: spacing.sm,
    backgroundColor: 'transparent',
  },
  leftColumnScroll: {
    flex: 1,
    backgroundColor: 'transparent',
    ...({ scrollbarWidth: 'thin', scrollbarColor: '#C7C9CE transparent' } as any),
  },
  leftColumnContent: {
    gap: spacing.lg,
    paddingRight: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: 'transparent',
  },
  rightColumn: {
    width: 437,
    minWidth: 437,
    maxWidth: 437,
    minHeight: 0,
    alignSelf: 'stretch',
    paddingBottom: spacing.lg,
  },
})
