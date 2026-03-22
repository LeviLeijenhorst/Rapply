import React from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { semanticColorTokens } from '@/design/tokens/colors'
import { fontSizes } from '@/design/tokens/fontSizes'
import { radius } from '@/design/tokens/radius'
import { ReportSavedCloudIcon } from '@/icons/ReportScreenIcons'
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
  const [writtenSummaryDraft, setWrittenSummaryDraft] = React.useState('')
  const [isWrittenSummarySaving, setIsWrittenSummarySaving] = React.useState(false)
  const [hasUnsavedWrittenSummaryChanges, setHasUnsavedWrittenSummaryChanges] = React.useState(false)
  const writtenSummarySaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveWrittenSummaryRef = React.useRef<(value: string) => void>(() => {})
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
    isWrittenInput,
    isUploadedDocument,
    summary,
    transcriptionStatus,
    transcriptionProgressLabel,
    transcript,
    canRegenerateSnippets,
    canRegenerateSummary,
    canCancelSummaryGeneration,
    isSnippetsLoading,
    sessionNotes,
    sessionSnippets,
    isRegeneratingSnippets,
    handleRegenerateInputSnippets,
    handleCreateSnippet,
    handleUpdateSnippetStatus,
    handleSaveSnippetText,
    handleDeleteSnippet,
    handleSaveSummary,
    handleCancelSummaryGeneration,
    handleRegenerateSummary,
    createNote,
    updateNote,
    deleteNote,
  } = useInputScreen(props)

  React.useEffect(() => {
    saveWrittenSummaryRef.current = handleSaveSummary
  }, [handleSaveSummary])

  React.useEffect(() => {
    if (!isWrittenInput) return
    const normalizedSummary = String(summary || '')
    setWrittenSummaryDraft(normalizedSummary)
    setHasUnsavedWrittenSummaryChanges(false)
    setIsWrittenSummarySaving(false)
  }, [isWrittenInput, summary, resolvedInputId])

  React.useEffect(() => {
    if (!isWrittenInput) return undefined
    if (!hasUnsavedWrittenSummaryChanges) return undefined
    if (writtenSummarySaveTimerRef.current) {
      clearTimeout(writtenSummarySaveTimerRef.current)
      writtenSummarySaveTimerRef.current = null
    }
    writtenSummarySaveTimerRef.current = setTimeout(() => {
      setIsWrittenSummarySaving(true)
      saveWrittenSummaryRef.current(writtenSummaryDraft)
      setHasUnsavedWrittenSummaryChanges(false)
      setIsWrittenSummarySaving(false)
      writtenSummarySaveTimerRef.current = null
    }, 450)
    return () => {
      if (!writtenSummarySaveTimerRef.current) return
      clearTimeout(writtenSummarySaveTimerRef.current)
      writtenSummarySaveTimerRef.current = null
    }
  }, [hasUnsavedWrittenSummaryChanges, isWrittenInput, writtenSummaryDraft])

  React.useEffect(
    () => () => {
      if (!writtenSummarySaveTimerRef.current) return
      clearTimeout(writtenSummarySaveTimerRef.current)
      writtenSummarySaveTimerRef.current = null
    },
    [],
  )

  if (isInputMissing) {
    return <EmptyPageMessage message="Deze sessie bestaat niet meer." onGoHome={onBack} />
  }

  const sessionSaveIndicator = isWrittenInput ? (
    isWrittenSummarySaving ? (
      <ActivityIndicator size="small" color="#667085" />
    ) : (
      <ReportSavedCloudIcon color={hasUnsavedWrittenSummaryChanges ? '#BE0165' : '#171717'} />
    )
  ) : null

  return (
    <View style={styles.page}>
      <Header title={title} clientName={clientName} date={date} onBack={onBack} statusIndicator={sessionSaveIndicator} />

      <View style={styles.layoutRow}>
        <View style={styles.leftColumn}>
          {isWrittenInput ? (
            <View style={styles.writtenSummaryCard}>
              <TextInput
                value={writtenSummaryDraft}
                onChangeText={(nextValue) => {
                  setWrittenSummaryDraft(nextValue)
                  setHasUnsavedWrittenSummaryChanges(true)
                }}
                placeholder="Schrijf je verslag..."
                placeholderTextColor={semanticColorTokens.light.textMuted}
                multiline
                textAlignVertical="top"
                style={styles.writtenSummaryInput}
              />
            </View>
          ) : (
            <ScrollView
              {...({ 'data-left-column-scroll': 'true' } as any)}
              style={styles.leftColumnScroll}
              contentContainerStyle={styles.leftColumnContent}
              showsVerticalScrollIndicator
            >
              <SummaryCard
                summary={summary}
                transcriptionStatus={transcriptionStatus}
                transcriptionProgressLabel={transcriptionProgressLabel}
                title={isUploadedDocument ? 'Document' : 'Samenvatting'}
                emptyText={isUploadedDocument ? 'Geen leesbare documenttekst beschikbaar.' : undefined}
                onPressEdit={!isUploadedDocument ? () => setIsSummaryEditModalOpen(true) : null}
                onPressRegenerate={canRegenerateSummary ? handleRegenerateSummary : null}
                onPressCancelGeneration={canCancelSummaryGeneration ? handleCancelSummaryGeneration : null}
              />

              <SnippetSection
                snippets={sessionSnippets}
                isLoading={isSnippetsLoading}
                hideEmptyState={transcriptionStatus === 'transcribing'}
                canRegenerate={canRegenerateSnippets}
                isRegenerating={isRegeneratingSnippets}
                onRegenerate={handleRegenerateInputSnippets}
                onCreateSnippet={handleCreateSnippet}
                onUpdateSnippetStatus={handleUpdateSnippetStatus}
                onSaveSnippetText={handleSaveSnippetText}
                onDeleteSnippet={handleDeleteSnippet}
              />
            </ScrollView>
          )}
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

      {!isWrittenInput ? (
        <SummaryEditModal
          visible={isSummaryEditModalOpen}
          initialSummary={String(summary || '')}
          onClose={() => setIsSummaryEditModalOpen(false)}
          onSave={handleSaveSummary}
        />
      ) : null}
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
  writtenSummaryCard: {
    flex: 1,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 0,
    backgroundColor: semanticColorTokens.light.surface,
    overflow: 'hidden',
  },
  writtenSummaryInput: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.sm,
    lineHeight: 22,
    color: semanticColorTokens.light.text,
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
