import React, { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

import { semanticColorTokens } from '@/design/tokens/colors'
import { borderWidths } from '@/design/tokens/borderWidths'
import { radius } from '@/design/tokens/radius'
import { rnShadows } from '@/design/tokens/shadows'
import { spacing } from '@/design/tokens/spacing'
import { ChatbotTab } from '@/screens/session/components/chatbotTab/ChatbotTab'
import { useChatbotTabLogic } from '@/screens/session/components/chatbotTab/ChatbotTab.logic'
import { ExpandedChatModal } from '@/screens/session/components/modals/ExpandedChatModal'
import { NotesTab } from '@/screens/session/components/NotesTab'
import { RightTabs } from '@/screens/session/components/RightTabs'
import type { RightPanelProps, RightTabKey, InputNoteItem } from '@/screens/session/sessionScreen.types'
import { ChatComposer } from '@/screens/shared/components/chat/ChatComposer'
import { ConfirmChatClearModal } from '@/screens/shared/modals/ConfirmChatClearModal'
import { ConfirmNoteDeleteModal } from '@/screens/shared/modals/ConfirmNoteDeleteModal'
import { NoteEditModal } from '@/screens/shared/modals/NoteEditModal'
import { MainContainer } from '@/ui/animated/MainContainer'

export function RightPanel({
  inputId,
  notes,
  snippets,
  summary,
  transcript,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}: RightPanelProps) {
  const [activeTabKey, setActiveTabKey] = useState<RightTabKey>('notes')
  const [noteComposerValue, setNoteComposerValue] = useState('')
  const [editingNote, setEditingNote] = useState<InputNoteItem | null>(null)
  const [pendingDeleteNote, setPendingDeleteNote] = useState<InputNoteItem | null>(null)

  const sortedNotes = useMemo(
    () => [...notes].sort((leftNote, rightNote) => leftNote.createdAtUnixMs - rightNote.createdAtUnixMs),
    [notes],
  )

  const chatbotState = useChatbotTabLogic({
    inputId,
    summary,
    transcript,
    snippets,
    notes: sortedNotes,
  })

  function handleCreateNoteFromComposer() {
    const trimmedText = noteComposerValue.trim()
    if (!trimmedText) return
    onCreateNote(inputId, { title: '', text: trimmedText })
    setNoteComposerValue('')
  }

  return (
    <View style={styles.container}>
      {/* Top tab controls */}
      <RightTabs activeTabKey={activeTabKey} onTabChange={setActiveTabKey} />

      {/* Main panel body */}
      <View style={styles.panel}>
        <MainContainer contentKey={`session-right-tab-${activeTabKey}`} style={styles.panelContent}>
          {activeTabKey === 'notes' ? (
            <ScrollView style={styles.feed} contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator>
              <NotesTab notes={sortedNotes} onEditNote={setEditingNote} onDeleteNote={setPendingDeleteNote} />
            </ScrollView>
          ) : (
            <ChatbotTab
              inputId={inputId}
              variant="panel"
              messages={chatbotState.chatMessages}
              composerValue={chatbotState.chatComposerValue}
              isSending={chatbotState.isChatSending}
              onChangeComposerValue={chatbotState.setChatComposerValue}
              onSendMessage={chatbotState.handleSendChatMessage}
              onDeleteMessage={chatbotState.handleDeleteChatMessage}
              onClearChat={() => chatbotState.setIsClearChatModalVisible(true)}
              onOpenExpanded={() => chatbotState.setIsExpandedChatOpen(true)}
            />
          )}
        </MainContainer>

        {activeTabKey === 'notes' ? (
          <View style={styles.composerWrap}>
            <ChatComposer
              value={noteComposerValue}
              onChangeValue={setNoteComposerValue}
              onSend={handleCreateNoteFromComposer}
              showDisclaimer={false}
              sendIconVariant="arrow"
              preferCenteredSingleLine
              forceSingleLine
              isSendDisabled={noteComposerValue.trim().length === 0}
            />
          </View>
        ) : null}
      </View>

      {/* Expanded chatbot modal */}
      <ExpandedChatModal visible={chatbotState.isExpandedChatOpen} onClose={() => chatbotState.setIsExpandedChatOpen(false)}>
        <ChatbotTab
          inputId={inputId}
          variant="modal"
          messages={chatbotState.chatMessages}
          composerValue={chatbotState.chatComposerValue}
          isSending={chatbotState.isChatSending}
          onChangeComposerValue={chatbotState.setChatComposerValue}
          onSendMessage={chatbotState.handleSendChatMessage}
          onDeleteMessage={chatbotState.handleDeleteChatMessage}
          onClearChat={() => chatbotState.setIsClearChatModalVisible(true)}
          onOpenExpanded={() => undefined}
        />
      </ExpandedChatModal>

      {/* Chat clear confirmation */}
      <ConfirmChatClearModal
        visible={chatbotState.isClearChatModalVisible}
        onClose={() => chatbotState.setIsClearChatModalVisible(false)}
        onConfirm={chatbotState.handleConfirmClearChat}
      />

      {/* Note edit modal */}
      <NoteEditModal
        visible={!!editingNote}
        mode="edit"
        initialTitle={editingNote?.title ?? ''}
        initialBody={editingNote?.text ?? ''}
        onClose={() => setEditingNote(null)}
        onSave={(values) => {
          if (!editingNote) return
          onUpdateNote(editingNote.id, values)
        }}
        onDelete={() => {
          if (!editingNote) return
          onDeleteNote(editingNote.id)
          setEditingNote(null)
        }}
      />

      {/* Note delete confirmation */}
      <ConfirmNoteDeleteModal
        visible={!!pendingDeleteNote}
        noteText={pendingDeleteNote?.text ?? ''}
        onClose={() => setPendingDeleteNote(null)}
        onConfirm={() => {
          if (!pendingDeleteNote) return
          onDeleteNote(pendingDeleteNote.id)
          setPendingDeleteNote(null)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 437,
    flex: 1,
    minHeight: 0,
  },
  panel: {
    flex: 1,
    borderRadius: radius.md,
    borderTopLeftRadius: 0,
    borderWidth: borderWidths.hairline,
    borderColor: semanticColorTokens.light.panelBorder,
    backgroundColor: semanticColorTokens.light.elevatedSurface,
    overflow: 'hidden',
    ...rnShadows.card,
  },
  panelContent: {
    flex: 1,
    minHeight: 0,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  composerWrap: {
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
})

