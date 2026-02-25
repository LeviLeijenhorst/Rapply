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
import { PlusIcon } from '../components/icons/PlusIcon'
import { SearchIcon } from '../components/icons/SearchIcon'
import { TrashIcon } from '../components/icons/TrashIcon'
import { AanpassenIcon } from '../components/icons/AanpassenIcon'
import { CircleCloseIcon } from '../components/icons/CircleCloseIcon'
import { Text } from '../components/Text'
import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import { webTransitionSmooth } from '../theme/webTransitions'
import { useLocalAppData } from '../local/LocalAppDataProvider'
import { completeChat, LocalChatMessage } from '../services/chat'
import { ChatStateMessage, createChatMessageId } from '../utils/chatState'
import {
  clearQuickQuestionsChatForCoachee,
  loadQuickQuestionsChatForCoachee,
  saveQuickQuestionsChatForCoachee,
} from '../local/quickQuestionsChatStore'
import { buildCoacheeStructuredSystemMessages } from '../utils/quickQuestionsContext'
import { ConfirmSessieDeleteModal } from '../components/sessies/ConfirmSessieDeleteModal'
import { ConfirmChatClearModal } from '../components/sessionDetail/ConfirmChatClearModal'
import { CoacheeUpsertModal } from '../components/coachees/CoacheeUpsertModal'
import { getCoacheeUpsertValues, serializeCoacheeUpsertValues } from '../utils/coacheeProfile'
import { fetchBillingStatus, type BillingStatus } from '../services/billing'

type SessionListItem = {
  id: string
  title: string
  dateLabel: string
  timeLabel: string
  durationLabel: string
  isReport: boolean
  createdAtUnixMs: number
  transcriptionStatus: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
}

type Props = {
  coacheeId: string
  onBack: () => void
  onSelectSession: (sessionId: string) => void
  onPressCreateSession: () => void
  onOpenMySubscription: () => void
  isCreateSessionDisabled?: boolean
}

function formatDurationLabel(durationSeconds: number | null): string {
  if (!Number.isFinite(durationSeconds) || durationSeconds === null || durationSeconds <= 0) return ''
  const roundedSeconds = Math.max(0, Math.round(durationSeconds))
  const hours = Math.floor(roundedSeconds / 3600)
  const minutes = Math.floor((roundedSeconds % 3600) / 60)
  const seconds = roundedSeconds % 60
  const paddedMinutes = String(minutes).padStart(hours > 0 ? 2 : 1, '0')
  const paddedSeconds = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${paddedMinutes}:${paddedSeconds}` : `${minutes}:${paddedSeconds}`
}

export function CoacheeDetailScreen({ coacheeId, onBack, onSelectSession, onPressCreateSession, onOpenMySubscription, isCreateSessionDisabled = false }: Props) {
  const { data, deleteSession, updateCoachee } = useLocalAppData()
  const coachee = data.coachees.find((c) => c.id === coacheeId)
  const coacheeName = coachee?.name ?? 'Cliënt'

  const sessions = useMemo<SessionListItem[]>(() => {
    return data.sessions
      .filter((item) => item.coacheeId === coacheeId && item.kind !== 'notes')
      .map((item) => ({
        id: item.id,
        title: item.title,
        dateLabel: new Date(item.createdAtUnixMs).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric', year: 'numeric' }),
        timeLabel: new Date(item.createdAtUnixMs).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
        durationLabel: formatDurationLabel(item.audioDurationSeconds),
        isReport: item.kind === 'written',
        createdAtUnixMs: item.createdAtUnixMs,
        transcriptionStatus: item.transcriptionStatus,
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState<string | null>(null)
  const [isClearChatModalVisible, setIsClearChatModalVisible] = useState(false)
  const [isEditCoacheeModalOpen, setIsEditCoacheeModalOpen] = useState(false)
  const [isChatMinutesBlocked, setIsChatMinutesBlocked] = useState(false)
  const [isCheckingChatMinutes, setIsCheckingChatMinutes] = useState(false)
  const [isNoMinutesCtaDismissed, setIsNoMinutesCtaDismissed] = useState(false)

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredSessions = sessions.filter((item) => item.title.toLowerCase().includes(normalizedQuery))
  const notesSession = useMemo(() => {
    return data.sessions.find((item) => item.coacheeId === coacheeId && item.kind === 'notes') ?? null
  }, [coacheeId, data.sessions])
  const quickQuestionTemplates = useMemo(
    () => data.templates.map((template) => ({ id: template.id, name: template.name })),
    [data.templates],
  )

  const isMenuVisible = !!menuSessionId && !!menuAnchorPoint
  const pendingDeleteSessionTitle = pendingDeleteSessionId ? data.sessions.find((item) => item.id === pendingDeleteSessionId)?.title : null

  const searchInputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const shouldShowQuickStart = chatMessages.length === 0
  const shouldShowClearChat = chatMessages.length > 0
  const previousMessageCountRef = useRef(chatMessages.length)
  const shouldSkipChatSaveRef = useRef(false)

  useEffect(() => {
    shouldSkipChatSaveRef.current = true
    setChatMessages(loadQuickQuestionsChatForCoachee(coacheeId))
    setComposerText('')
    setIsChatSending(false)
  }, [coacheeId])

  useEffect(() => {
    if (shouldSkipChatSaveRef.current) {
      shouldSkipChatSaveRef.current = false
      return
    }
    saveQuickQuestionsChatForCoachee(coacheeId, chatMessages)
  }, [chatMessages, coacheeId])

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
    clearQuickQuestionsChatForCoachee(coacheeId)
    scrollChatToEnd()
  }

  function requestResetChat() {
    setIsClearChatModalVisible(true)
  }

  function readRemainingTranscriptionSeconds(status: BillingStatus | null): number {
    if (!status) return 0
    const includedRemainingSeconds = Math.max(0, Math.floor(status.includedSeconds - status.cycleUsedSeconds))
    const nonExpiringRemainingSeconds = Math.max(0, Math.floor(status.nonExpiringTotalSeconds - status.nonExpiringUsedSeconds))
    return includedRemainingSeconds + nonExpiringRemainingSeconds
  }

  function appendNoMinutesAssistantMessage() {
    const noMinutesText = 'U heeft geen minuten meer. Ga naar Mijn abonnement om extra minuten toe te voegen.'
    setChatMessages((previousMessages) => {
      if (previousMessages.some((message) => message.role === 'assistant' && message.text === noMinutesText)) {
        return previousMessages
      }
      return [...previousMessages, { id: createChatMessageId(), role: 'assistant', text: noMinutesText }]
    })
  }

  async function ensureSufficientChatMinutes(): Promise<boolean> {
    setIsCheckingChatMinutes(true)
    try {
      const response = await fetchBillingStatus()
      const remainingSeconds = readRemainingTranscriptionSeconds(response?.billingStatus ?? null)
      const hasMinutes = remainingSeconds > 0
      setIsChatMinutesBlocked(!hasMinutes)
      if (!hasMinutes) {
        setIsNoMinutesCtaDismissed(false)
        appendNoMinutesAssistantMessage()
      }
      return hasMinutes
    } catch (error) {
      console.error('[CoacheeDetailScreen] Failed to read billing status before chat send', error)
      return true
    } finally {
      setIsCheckingChatMinutes(false)
    }
  }

  async function sendChatMessage(messageText: string) {
    const trimmedText = messageText.trim()
    if (!trimmedText || isChatSending) return
    if (!(await ensureSufficientChatMinutes())) return

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
        messages: [
          ...buildCoacheeStructuredSystemMessages({
            coacheeName,
            coacheeCreatedAtUnixMs: coachee?.createdAtUnixMs ?? null,
            clientDetails: coachee?.clientDetails ?? '',
            employerDetails: coachee?.employerDetails ?? '',
            firstSickDay: coachee?.firstSickDay ?? '',
            includeSessionReports: false,
            sessions: [],
            maxTotalCharacters: 55000,
            maxSessionCharacters: 3500,
          }),
          ...nextChatMessages.map<LocalChatMessage>((message) => ({
            role: message.role,
            text: message.text,
          })),
        ],
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

  useEffect(() => {
    if (isChatMinutesBlocked) return
    setIsNoMinutesCtaDismissed(false)
  }, [isChatMinutesBlocked])

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
        <Pressable onPress={() => setIsEditCoacheeModalOpen(true)} style={({ hovered }) => [styles.editCoacheeButton, hovered ? styles.editCoacheeButtonHovered : undefined]}>
          <AanpassenIcon color="#656565" size={18} />
          <Text isBold style={styles.editCoacheeButtonText}>
            Cliëntgegevens
          </Text>
        </Pressable>
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
                  onPress={requestResetChat}
                  style={({ hovered }) => [styles.chatActionButton, hovered ? styles.chatActionButtonHovered : undefined]}
                >
                  {/* Clear chat */}
                  <Text isBold style={styles.chatActionText}>
                    Chat wissen
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                disabled={isCreateSessionDisabled}
                style={({ hovered }) => [
                  styles.newSessionButton,
                  webTransitionSmooth,
                  isCreateSessionDisabled ? styles.newSessionButtonDisabled : undefined,
                  hovered && !isCreateSessionDisabled ? styles.newSessionButtonHovered : undefined,
                ]}
                onPress={onPressCreateSession}
              >
                {/* New report button */}
                <PlusIcon color="#FFFFFF" size={22} />
                <Text numberOfLines={1} style={styles.newSessionButtonText}>
                  Nieuw verslag
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
                    {/* Empty reports message */}
                    <Text style={styles.emptySessionsText}>Deze cliënt heeft nog geen verslagen.</Text>
                  </View>
                ) : (
                  <>
                    {/* Reports search */}
                    <Pressable
                      onPress={() => searchInputRef.current?.focus()}
                      style={({ hovered }) => [styles.searchInputContainer, hovered ? styles.searchInputContainerHovered : undefined]}
                    >
                      {/* Search icon */}
                      <SearchIcon color="#656565" size={18} />
                      {/* Search input */}
                      <TextInput
                        ref={searchInputRef}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Zoek verslag..."
                        placeholderTextColor="#656565"
                        style={[styles.searchInput, searchInputWebStyle]}
                      />
                    </Pressable>

                    {/* Reports list */}
                    <ScrollView style={styles.sessionsScroll} contentContainerStyle={styles.sessionsScrollContent} showsVerticalScrollIndicator={false}>
                      {filteredSessions.map((item) => {
                        return (
                        <View key={item.id} style={styles.sessionsListItem}>
                          <SessieListItemCard
                            title={item.title}
                            dateLabel={item.dateLabel}
                            timeLabel={item.timeLabel}
                            durationLabel={item.durationLabel}
                            isReport={item.isReport}
                            transcriptionStatus={item.transcriptionStatus}
                            onPress={() => onSelectSession(item.id)}
                            onPressEdit={(anchorPoint) => {
                              setMenuAnchorPoint(anchorPoint)
                              setMenuSessionId(item.id)
                            }}
                            onPressMore={(anchorPoint) => {
                              setMenuAnchorPoint(anchorPoint)
                              setMenuSessionId(item.id)
                            }}
                            showCoachee={false}
                          />
                        </View>
                        )
                      })}
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
                    <QuickQuestionsStart
                      templates={quickQuestionTemplates}
                      onSelectOption={(option) => sendChatMessage(option.promptText)}
                    />
                  ) : (
                    <>
                      {chatMessages.map((message) => (
                        <ChatMessage key={message.id} role={message.role} text={message.text} />
                      ))}
                      {isChatSending ? <ChatMessage role="assistant" text="" isLoading /> : null}
                    </>
                  )}
                </ScrollView>

                {isChatMinutesBlocked && !isNoMinutesCtaDismissed ? (
                  <View style={styles.noMinutesCtaContainer}>
                    <Pressable
                      onPress={() => setIsNoMinutesCtaDismissed(true)}
                      style={({ hovered }) => [styles.noMinutesCtaCloseButton, hovered ? styles.noMinutesCtaCloseButtonHovered : undefined]}
                      accessibilityRole="button"
                      accessibilityLabel="Melding sluiten"
                    >
                      <CircleCloseIcon size={18} color={colors.textSecondary} />
                    </Pressable>
                    <Text style={styles.noMinutesCtaText}>U heeft geen minuten meer.</Text>
                    <Pressable
                      onPress={onOpenMySubscription}
                      style={({ hovered }) => [
                        styles.noMinutesCtaButton,
                        hovered ? styles.noMinutesCtaButtonHovered : undefined,
                      ]}
                    >
                      <Text isBold style={styles.noMinutesCtaButtonText}>
                        Mijn abonnement
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

                {/* Chat composer */}
                <View style={styles.chatBottom}>
                  <ChatComposer
                    value={composerText}
                    onChangeValue={setComposerText}
                    onSend={handleSendChatMessage}
                    isSendDisabled={isChatSending || isCheckingChatMinutes || isChatMinutesBlocked || composerText.trim().length === 0}
                    shouldAutoFocus={activeTabKey === 'snelleVragen'}
                    autoFocusKey={activeTabKey}
                  />
                </View>
              </View>
            ) : null}

            {activeTabKey === 'notities' ? (
              <NotesTabPanel
                sessionId={notesSession?.id}
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
              setPendingDeleteSessionId(menuSessionId)
              setIsDeleteModalOpen(true)
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

      <ConfirmSessieDeleteModal
        visible={isDeleteModalOpen}
        sessieTitle={pendingDeleteSessionTitle}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setPendingDeleteSessionId(null)
        }}
        onConfirm={() => {
          if (!pendingDeleteSessionId) return
          deleteSession(pendingDeleteSessionId)
          setIsDeleteModalOpen(false)
          setPendingDeleteSessionId(null)
        }}
      />
      <ConfirmChatClearModal
        visible={isClearChatModalVisible}
        onClose={() => setIsClearChatModalVisible(false)}
        onConfirm={() => {
          setIsClearChatModalVisible(false)
          resetChat()
        }}
      />
      <CoacheeUpsertModal
        visible={isEditCoacheeModalOpen}
        mode="edit"
        initialValues={getCoacheeUpsertValues(coachee)}
        onClose={() => setIsEditCoacheeModalOpen(false)}
        onSave={(values) => {
          if (!coachee) return
          const serialized = serializeCoacheeUpsertValues(values)
          if (!serialized.name.trim()) return
          updateCoachee(coachee.id, serialized)
          setIsEditCoacheeModalOpen(false)
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
  editCoacheeButton: {
    height: 40,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  editCoacheeButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  editCoacheeButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
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
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    padding: 0,
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
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...( { cursor: 'pointer' } as any ),
  },
  searchInputContainerHovered: {
    backgroundColor: colors.hoverBackground,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: typography.fontFamilyRegular,
    color: '#656565',
    padding: 0,
    height: '100%',
    ...( { textAlignVertical: 'center' } as any ),
    ...( { transform: [{ translateY: 1 }] } as any ),
    ...( { cursor: 'pointer' } as any ),
  },
  newSessionButton: {
    width: 162,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.selected,
    borderWidth: 1,
    borderColor: colors.selected,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newSessionButtonHovered: {
    backgroundColor: '#A50058',
  },
  newSessionButtonDisabled: {
    backgroundColor: '#C6C6C6',
    borderColor: '#C6C6C6',
  },
  newSessionButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    ...( { transform: [{ translateY: 1 }] } as any ),
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
    position: 'relative',
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
  noMinutesCtaContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 82,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    padding: 12,
    paddingRight: 36,
    gap: 10,
    zIndex: 2,
  },
  noMinutesCtaCloseButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMinutesCtaCloseButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  noMinutesCtaText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  noMinutesCtaButton: {
    alignSelf: 'flex-start',
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.selected,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMinutesCtaButtonHovered: {
    backgroundColor: '#A50058',
  },
  noMinutesCtaButtonText: {
    fontSize: 13,
    lineHeight: 16,
    color: '#FFFFFF',
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
