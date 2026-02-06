import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedMainContent } from '../components/AnimatedMainContent'
import { CoacheeTabs, CoacheeTabKey } from '../components/coacheeDetail/CoacheeTabs'
import { SessieListItemCard } from '../components/sessies/SessieListItemCard'
import { ChatComposer } from '../components/sessionDetail/ChatComposer'
import { ChatMessage } from '../components/sessionDetail/ChatMessage'
import { QuickQuestionsStart } from '../components/sessionDetail/QuickQuestionsStart'
import { NotesTabPanel } from '../components/sessionDetail/NotesTabPanel'
import { PopoverMenu } from '../components/PopoverMenu'
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon'
import { SearchIcon } from '../components/icons/SearchIcon'
import { TrashIcon } from '../components/icons/TrashIcon'
import { Text } from '../components/Text'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import { useLocalAppData } from '../local/LocalAppDataProvider'
import { completeChat, LocalChatMessage } from '../services/chat'
import { ChatStateMessage, createChatMessageId } from '../utils/chatState'

type SessionListItem = {
  id: string
  title: string
  dateLabel: string
  timeLabel: string
  isReport: boolean
  createdAtUnixMs: number
}

type Props = {
  coacheeId: string
  onBack: () => void
  onSelectSession: (sessionId: string) => void
  onPressCreateSession: () => void
}

export function CoacheeDetailScreen({ coacheeId, onBack, onSelectSession, onPressCreateSession }: Props) {
  const { data, deleteSession } = useLocalAppData()
  const coachee = data.coachees.find((c) => c.id === coacheeId)
  const coacheeName = coachee?.name ?? 'Coachee'

  const sessions = useMemo<SessionListItem[]>(() => {
    return data.sessions
      .filter((item) => item.coacheeId === coacheeId && item.kind !== 'notes')
      .map((item) => ({
        id: item.id,
        title: item.title,
        dateLabel: new Date(item.createdAtUnixMs).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric', year: 'numeric' }),
        timeLabel: new Date(item.createdAtUnixMs).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
        isReport: item.kind === 'written',
        createdAtUnixMs: item.createdAtUnixMs,
      }))
      .sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
  }, [coacheeId, data.sessions])

  const [activeTabKey, setActiveTabKey] = useState<CoacheeTabKey>('sessies')
  const [composerText, setComposerText] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatStateMessage[]>([])
  const [isChatSending, setIsChatSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<TextInput | null>(null)
  const chatScrollRef = useRef<ScrollView | null>(null)
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null)
  const [menuAnchorPoint, setMenuAnchorPoint] = useState<{ x: number; y: number } | null>(null)

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredSessions = sessions.filter((item) => item.title.toLowerCase().includes(normalizedQuery))
  const notesSession = useMemo(() => {
    return data.sessions.find((item) => item.coacheeId === coacheeId && item.kind === 'notes') ?? null
  }, [coacheeId, data.sessions])
  const notesDateTimeLabel = notesSession
    ? `${new Date(notesSession.createdAtUnixMs).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric', year: 'numeric' })}, ${new Date(notesSession.createdAtUnixMs).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
    : ''

  const isMenuVisible = !!menuSessionId && !!menuAnchorPoint

  const searchInputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const shouldShowQuickStart = chatMessages.length === 0
  const shouldShowClearChat = chatMessages.length > 0
  const previousMessageCountRef = useRef(chatMessages.length)

  useEffect(() => {
    const id = setTimeout(() => searchInputRef.current?.focus(), 0)
    return () => clearTimeout(id)
  }, [activeTabKey])

  useEffect(() => {
    setChatMessages([])
    setComposerText('')
    setIsChatSending(false)
  }, [coacheeId])

  function scrollChatToEnd() {
    const scrollView = chatScrollRef.current
    if (!scrollView) return
    setTimeout(() => {
      scrollView.scrollToEnd({ animated: true })
    }, 0)
  }

  function resetChat() {
    setChatMessages([])
    setComposerText('')
    setIsChatSending(false)
    scrollChatToEnd()
  }

  async function sendChatMessage(messageText: string) {
    const trimmedText = messageText.trim()
    if (!trimmedText || isChatSending) return

    const nextUserMessage: ChatStateMessage = {
      id: createChatMessageId(),
      role: 'user',
      text: trimmedText,
    }

    const nextChatMessages = [...chatMessages, nextUserMessage]
    setChatMessages(nextChatMessages)
    setComposerText('')
    setIsChatSending(true)

    try {
      const responseText = await completeChat({
        messages: nextChatMessages.map<LocalChatMessage>((message) => ({
          role: message.role,
          text: message.text,
        })),
      })
      setChatMessages((previousMessages) => [
        ...previousMessages,
        { id: createChatMessageId(), role: 'assistant', text: responseText },
      ])
    } catch (error) {
      setChatMessages((previousMessages) => [
        ...previousMessages,
        { id: createChatMessageId(), role: 'assistant', text: 'Er ging iets mis bij het ophalen van het antwoord. Probeer het opnieuw.' },
      ])
    } finally {
      setIsChatSending(false)
    }
  }

  useEffect(() => {
    const previousCount = previousMessageCountRef.current
    const nextCount = chatMessages.length
    if (nextCount > previousCount) {
      scrollChatToEnd()
    }
    previousMessageCountRef.current = nextCount
  }, [chatMessages.length])

  useEffect(() => {
    if (!isChatSending) return
    scrollChatToEnd()
  }, [isChatSending])

  async function handleSendChatMessage() {
    const trimmedText = composerText.trim()
    if (!trimmedText) return
    setComposerText('')
    await sendChatMessage(trimmedText)
  }

  useEffect(() => {
    if (activeTabKey !== 'snelleVragen') return
    scrollChatToEnd()
  }, [activeTabKey, chatMessages.length, isChatSending])

  return (
    <View style={styles.container}>
      {/* Detail header */}
      <View style={styles.headerRow}>
        <View style={styles.leftHeader}>
          <Pressable onPress={onBack} style={({ hovered }) => [styles.backTitleButton, hovered ? styles.backTitleButtonHovered : undefined]}>
            {/* Back and coachee name */}
            <ChevronLeftIcon color={colors.text} size={24} />
            <Text numberOfLines={1} isSemibold style={styles.coacheeTitle}>
              {coacheeName}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Detail content */}
      <View style={styles.content}>
        {/* Detail card */}
        <View style={styles.card}>
          {/* Tabs and actions */}
          <View style={styles.tabsRow}>
            <View style={styles.tabsLeft}>
              <CoacheeTabs activeTabKey={activeTabKey} onSelectTab={setActiveTabKey} />
            </View>
            <View style={styles.tabsRight}>
              {activeTabKey === 'snelleVragen' && shouldShowClearChat ? (
                <Pressable
                  onPress={resetChat}
                  style={({ hovered }) => [styles.chatActionButton, hovered ? styles.chatActionButtonHovered : undefined]}
                >
                  {/* Clear chat */}
                  <Text isBold style={styles.chatActionText}>
                    Chat wissen
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                style={({ hovered }) => [styles.newSessionButton, hovered ? styles.newSessionButtonHovered : undefined]}
                onPress={onPressCreateSession}
              >
                {/* New session button */}
                <Text numberOfLines={1} isBold style={styles.newSessionButtonText}>
                  + Nieuwe sessie
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Active tab content */}
          <AnimatedMainContent key={activeTabKey} contentKey={activeTabKey} style={styles.tabContent}>
            {activeTabKey === 'sessies' ? (
              <View style={styles.sessionsTab}>
                {sessions.length === 0 ? (
                  <View style={styles.emptySessionsContainer}>
                    {/* Empty sessions message */}
                    <Text style={styles.emptySessionsText}>Deze coachee heeft nog geen sessies.</Text>
                  </View>
                ) : (
                  <>
                    {/* Sessions search */}
                    <View style={styles.searchInputContainer}>
                      {/* Search icon */}
                      <SearchIcon color="#656565" size={18} />
                      {/* Search input */}
                      <TextInput
                        ref={searchInputRef}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Zoek sessie..."
                        placeholderTextColor="#656565"
                        style={[styles.searchInput, searchInputWebStyle]}
                      />
                    </View>

                    {/* Sessions list */}
                    <ScrollView style={styles.sessionsScroll} contentContainerStyle={styles.sessionsScrollContent} showsVerticalScrollIndicator={false}>
                      {filteredSessions.map((item) => (
                        <View key={item.id} style={styles.sessionsListItem}>
                          <SessieListItemCard
                            title={item.title}
                            dateTimeLabel={`${item.dateLabel}, ${item.timeLabel}`}
                            isReport={item.isReport}
                            onPress={() => onSelectSession(item.id)}
                            onPressEdit={() => onSelectSession(item.id)}
                            onPressMore={(anchorPoint) => {
                              setMenuAnchorPoint(anchorPoint)
                              setMenuSessionId(item.id)
                            }}
                            showCoachee={false}
                          />
                        </View>
                      ))}
                    </ScrollView>
                  </>
                )}
              </View>
            ) : null}

            {activeTabKey === 'snelleVragen' ? (
              <View style={styles.chatTab}>
                {/* Chat messages */}
                <ScrollView
                  ref={chatScrollRef}
                  style={styles.chatArea}
                  contentContainerStyle={shouldShowQuickStart ? styles.chatAreaContentCentered : styles.chatAreaContent}
                  showsVerticalScrollIndicator={false}
                >
                  {shouldShowQuickStart ? (
                    <QuickQuestionsStart coacheeName={coacheeName} onSelectOption={(fullSentence) => sendChatMessage(fullSentence)} />
                  ) : (
                    <>
                      {chatMessages.map((message) => (
                        <ChatMessage key={message.id} role={message.role} text={message.text} />
                      ))}
                      {isChatSending ? <ChatMessage role="assistant" text="" isLoading /> : null}
                    </>
                  )}
                </ScrollView>

                {/* Chat composer */}
                <View style={styles.chatBottom}>
                  <ChatComposer
                    value={composerText}
                    onChangeValue={setComposerText}
                    onSend={handleSendChatMessage}
                    isSendDisabled={isChatSending || composerText.trim().length === 0}
                    shouldAutoFocus={activeTabKey === 'snelleVragen'}
                    autoFocusKey={activeTabKey}
                  />
                </View>
              </View>
            ) : null}

            {activeTabKey === 'notities' ? (
              <NotesTabPanel
                sessionId={notesSession?.id}
                dateTimeLabel={notesDateTimeLabel}
                coacheeIdForNewNotes={coacheeId}
                contentHorizontalPadding={12}
              />
            ) : null}
          </AnimatedMainContent>
        </View>
      </View>

      <PopoverMenu
        visible={isMenuVisible}
        anchorPoint={menuAnchorPoint}
        placement="below"
        width={220}
        estimatedHeight={44 + 4 * 2 + 8}
        items={[
          {
            key: 'delete',
            label: 'Verwijderen',
            icon: <TrashIcon color={colors.selected} size={18} />,
            isDanger: true,
            onPress: () => {
              if (!menuSessionId) return
              deleteSession(menuSessionId)
              setMenuSessionId(null)
              setMenuAnchorPoint(null)
            },
          },
        ]}
        onClose={() => {
          setMenuSessionId(null)
          setMenuAnchorPoint(null)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    paddingVertical: 8,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  backTitleButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'flex-start',
    flexShrink: 1,
    maxWidth: '100%',
  },
  backTitleButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  coacheeTitle: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.text,
    flexShrink: 1,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 16,
    ...( { overflow: 'hidden' } as any ),
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tabsLeft: {
    flex: 1,
    minWidth: 0,
  },
  tabsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tabContent: {
    flex: 1,
  },
  sessionsTab: {
    flex: 1,
    gap: 16,
  },
  searchInputContainer: {
    width: '100%',
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: typography.fontFamilyMedium,
    color: '#656565',
    padding: 0,
    height: '100%',
    ...( { textAlignVertical: 'center' } as any ),
  },
  newSessionButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.selected,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newSessionButtonHovered: {
    backgroundColor: 'rgba(190,1,101,0.08)',
  },
  newSessionButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.selected,
    textAlign: 'center',
    ...( { transform: [{ translateY: -1 }] } as any ),
  },
  sessionsScroll: {
    flex: 1,
  },
  sessionsScrollContent: {
    gap: 12,
    paddingBottom: 16,
  },
  sessionsListItem: {
    width: '100%',
  },
  emptySessionsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptySessionsText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  chatTab: {
    flex: 1,
    gap: 16,
  },
  chatArea: {
    flex: 1,
  },
  chatAreaContent: {
    gap: 12,
    paddingBottom: 8,
  },
  chatAreaContentCentered: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 8,
  },
  chatBottom: {
    width: '100%',
    gap: 10,
  },
  chatActionButton: {
    height: 32,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatActionButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  chatActionText: {
    fontSize: 13,
    lineHeight: 16,
    color: colors.textSecondary,
  },
})

