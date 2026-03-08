import React, { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { sendAiChat } from '../../../api/ai'
import { fontSizes, radius, spacing } from '../../../design/tokens'
import { AnimatedMainContent } from '../../../ui/AnimatedMainContent'
import { Text } from '../../../ui/Text'
import type { Note, Snippet } from '../../../storage/types'
import { ArrowUpIcon } from '../../../icons/ArrowUpIcon'
import { NotesPanel } from './NotesPanel'
import { SessionTabs } from './SessionTabs'

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  createdAtUnixMs: number
}

type Props = {
  sessionId: string
  notes: Note[]
  snippets: Snippet[]
  summary: string | null
  transcript: string | null
  onCreateNote: (sessionId: string, values: { title: string; text: string }) => void
}

function buildChatSystemPrompt(params: { summary: string | null; transcript: string | null; snippets: Snippet[]; notes: Note[] }) {
  const snippetLines = params.snippets.map((snippet) => `- (${snippet.field}) ${snippet.text}`).join('\n')
  const noteLines = params.notes.map((note) => `- ${note.text}`).join('\n')

  return [
    'Je bent een AI-assistent voor een coach en antwoordt in formeel Nederlands.',
    'Gebruik alleen de context hieronder en wees kort en concreet.',
    '',
    'Samenvatting:',
    String(params.summary || '').trim() || '-',
    '',
    'Transcript:',
    String(params.transcript || '').trim() || '-',
    '',
    'Snippets:',
    snippetLines || '-',
    '',
    'Notities:',
    noteLines || '-',
  ].join('\n')
}

export function SessionNotesCard({ sessionId, notes, snippets, summary, transcript, onCreateNote }: Props) {
  const [activeTab, setActiveTab] = useState<'ai' | 'notes'>('notes')
  const [composerValue, setComposerValue] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isSending, setIsSending] = useState(false)

  const sortedNotes = useMemo(() => [...notes].sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs), [notes])

  async function handleSend() {
    const text = composerValue.trim()
    if (!text || isSending) return

    if (activeTab === 'notes') {
      onCreateNote(sessionId, { title: '', text })
      setComposerValue('')
      return
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      createdAtUnixMs: Date.now(),
    }

    const nextMessages = [...chatMessages, userMessage]
    setChatMessages(nextMessages)
    setComposerValue('')
    setIsSending(true)

    try {
      const response = await sendAiChat(
        [
          { role: 'system', text: buildChatSystemPrompt({ summary, transcript, snippets, notes: sortedNotes }) },
          ...nextMessages.map((message) => ({ role: message.role, text: message.text })),
        ],
        'session',
        sessionId,
      )

      setChatMessages((previous) => [
        ...previous,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: String(response || '').trim() || 'Ik kon hier geen antwoord op genereren.',
          createdAtUnixMs: Date.now(),
        },
      ])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Onbekende fout'
      setChatMessages((previous) => [
        ...previous,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          text: `Het versturen van uw vraag is mislukt: ${message}`,
          createdAtUnixMs: Date.now(),
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text isSemibold style={styles.panelHeading}>{activeTab === 'notes' ? 'Notities' : 'AI-chat'}</Text>
      </View>

      <AnimatedMainContent contentKey={`session-tab-${activeTab}`}>
        <ScrollView style={styles.feed} contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator>
          {activeTab === 'notes' ? (
            <NotesPanel notes={sortedNotes} />
          ) : chatMessages.length === 0 ? (
            <Text style={styles.emptyText}>Stel een vraag over deze sessie om AI-chat te starten.</Text>
          ) : (
            chatMessages.map((message) => (
              <View key={message.id} style={[styles.chatCard, message.role === 'user' ? styles.chatCardUser : styles.chatCardAssistant]}>
                <Text style={styles.chatText}>{message.text}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </AnimatedMainContent>

      <View style={styles.tabsDock}>
        <SessionTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      <View style={styles.composerWrap}>
        <TextInput
          value={composerValue}
          onChangeText={setComposerValue}
          placeholder={activeTab === 'notes' ? 'Typ een notitie...' : 'Stel een vraag aan AI...'}
          placeholderTextColor="#93858D"
          style={styles.composerInput}
          onSubmitEditing={() => {
            void handleSend()
          }}
          returnKeyType="send"
        />
        <Pressable
          onPress={() => {
            void handleSend()
          }}
          style={({ hovered }) => [styles.sendButton, hovered ? styles.sendButtonHover : undefined, (isSending || composerValue.trim().length === 0) ? styles.sendButtonDisabled : undefined]}
          disabled={isSending || composerValue.trim().length === 0}
          accessibilityRole="button"
        >
          <ArrowUpIcon color="#FFFFFF" size={18} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: {
    width: 437,
    height: 757,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  panelHeader: {
    height: 66,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE0E2',
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  panelHeading: {
    fontSize: fontSizes.md,
    lineHeight: 26,
    color: '#2C111F',
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSizes.sm,
    lineHeight: 21,
    color: '#93858D',
  },
  chatCard: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    minHeight: 80,
    padding: spacing.md,
  },
  chatCardAssistant: {
    backgroundColor: '#F9FAFB',
  },
  chatCardUser: {
    backgroundColor: '#FCEFF6',
    borderColor: '#F4D0E3',
    marginLeft: spacing.lg,
  },
  chatText: {
    fontSize: fontSizes.md,
    lineHeight: 24,
    color: '#2C111F',
  },
  tabsDock: {
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerWrap: {
    minHeight: 72,
    borderTopWidth: 1,
    borderTopColor: '#DFE0E2',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  composerInput: {
    flex: 1,
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: spacing.sm,
    fontSize: fontSizes.md,
    lineHeight: 24,
    color: '#2C111F',
  },
  sendButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#BE0165',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonHover: {
    opacity: 0.9,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
})
