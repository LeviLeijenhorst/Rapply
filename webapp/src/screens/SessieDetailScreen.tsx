import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'

import { AnimatedMainContent } from '../components/AnimatedMainContent'
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon'
import { AanpassenIcon } from '../components/icons/AanpassenIcon'
import { CoacheeAvatarIcon } from '../components/icons/CoacheeAvatarIcon'
import { CalendarCircleIcon } from '../components/icons/CalendarCircleIcon'
import { FullScreenOpenIcon } from '../components/icons/FullScreenOpenIcon'
import { FullScreenCloseIcon } from '../components/icons/FullScreenCloseIcon'
import { Text } from '../components/Text'
import { colors } from '../theme/colors'
import { ConversationTabs, ConversationTabKey } from '../components/sessionDetail/ConversationTabs'
import { AudioPlayerCard, type AudioPlayerHandle } from '../components/sessionDetail/AudioPlayerCard'
import { ChatComposer } from '../components/sessionDetail/ChatComposer'
import { ChatMessage } from '../components/sessionDetail/ChatMessage'
import { QuickQuestionsStart } from '../components/sessionDetail/QuickQuestionsStart'
import { ReportPanel } from '../components/sessionDetail/ReportPanel'
import { NotesTabPanel } from '../components/sessionDetail/NotesTabPanel'
import { TranscriptTabPanel } from '../components/sessionDetail/TranscriptTabPanel'
import { TemplatePickerModal } from '../components/sessionDetail/TemplatePickerModal'
import { EditSessieModal } from '../components/sessionDetail/EditSessieModal'
import { WebPortal } from '../components/WebPortal'
import { AnimatedDropdownPanel } from '../components/AnimatedDropdownPanel'
import { useLocalAppData } from '../local/LocalAppDataProvider'
import { completeChat, LocalChatMessage } from '../services/chat'
import { generateSummary } from '../services/summary'
import { transcribeAudio } from '../services/transcription'
import { useE2ee } from '../e2ee/E2eeProvider'
import { loadAudioBlobRemote } from '../services/audioBlobs'
import { ChatStateMessage, createChatMessageId } from '../utils/chatState'
import {
  clearQuickQuestionsChatForSession,
  loadQuickQuestionsChatForSession,
  saveQuickQuestionsChatForSession,
} from '../local/quickQuestionsChatStore'
import { isUnassignedCoacheeName, unassignedCoacheeLabel } from '../utils/coachee'
import { ConfirmSessieDeleteModal } from '../components/sessies/ConfirmSessieDeleteModal'
import { buildCoacheeTranscriptsSystemMessages, buildConversationTranscriptSystemMessages } from '../utils/quickQuestionsContext'

type Props = {
  sessionId: string
  title: string
  coacheeName: string
  dateLabel: string
  onBack: () => void
  onOpenNewCoachee: () => void
  onChangeCoachee: (coacheeId: string | null) => void
  newlyCreatedCoacheeName?: string | null
  onNewlyCreatedCoacheeHandled?: () => void
}

export function SessieDetailScreen({
  sessionId,
  title,
  coacheeName,
  dateLabel,
  onBack,
  onOpenNewCoachee,
  onChangeCoachee,
  newlyCreatedCoacheeName,
  onNewlyCreatedCoacheeHandled,
}: Props) {
  const { width } = useWindowDimensions()
  const isCompactLayout = width < 1100
  const isVerySmallLayout = width < 860
  const isMobileLayout = width < 760
  const isHeaderActionButtonsCompact = width < 990
  const hideDate = width < 930
  const { data, deleteSession, setWrittenReport, updateSession } = useLocalAppData()
  const e2ee = useE2ee()
  const session = data.sessions.find((item) => item.id === sessionId) ?? null
  const isWrittenSession = session?.kind === 'written'
  const writtenReportText = data.writtenReports.find((report) => report.sessionId === sessionId)?.text ?? ''
  const hasTranscript = Boolean(session?.transcript && session.transcript.trim())

  const [activeTabKey, setActiveTabKey] = useState<ConversationTabKey>('snelleVragen')
  const [composerText, setComposerText] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatStateMessage[]>([])
  const [isChatSending, setIsChatSending] = useState(false)
  const [transcriptSearchText, setTranscriptSearchText] = useState('')
  const [editableCoacheeName, setEditableCoacheeName] = useState(coacheeName)
  const [editableSessionTitle, setEditableSessionTitle] = useState(title)
  const [isEditSessieModalVisible, setIsEditSessieModalVisible] = useState(false)
  const [isTemplatePickerModalVisible, setIsTemplatePickerModalVisible] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [isChatMaximized, setIsChatMaximized] = useState(false)
  const [isChatMaximizedRendered, setIsChatMaximizedRendered] = useState(false)
  const [writtenReportDraft, setWrittenReportDraft] = useState(writtenReportText)
  const [isDeleteSessieModalVisible, setIsDeleteSessieModalVisible] = useState(false)

  const coacheeButtonRef = useRef<any>(null)
  const templates = data.templates ?? []
  const defaultTemplateId = useMemo(() => {
    const standardTemplate = templates.find((template) => template.name.toLowerCase() === 'standaard verslag')
    return (standardTemplate ?? templates[0])?.id ?? null
  }, [templates])
  const selectedTemplate = useMemo(() => templates.find((template) => template.id === selectedTemplateId) ?? null, [selectedTemplateId, templates])
  const summaryTemplate = useMemo(() => {
    if (!selectedTemplate) return undefined
    const sections = selectedTemplate.sections
      .map((section, index) => {
        const title = section.title.trim()
        const description = section.description.trim()
        if (!title && !description) return null
        return { title: title || `Onderdeel ${index + 1}`, description }
      })
      .filter((section): section is { title: string; description: string } => Boolean(section))
    if (sections.length === 0) return undefined
    return { name: selectedTemplate.name, sections }
  }, [selectedTemplate])
  const selectedTemplateLabel = selectedTemplate?.name ?? 'Template'
  const audioPlayerRef = useRef<AudioPlayerHandle | null>(null)
  const chatScrollRef = useRef<ScrollView | null>(null)
  const [isCoacheeMenuOpen, setIsCoacheeMenuOpen] = useState(false)
  const [coacheeMenuAnchor, setCoacheeMenuAnchor] = useState<{ left: number; top: number; width: number } | null>(null)

  const activeCoacheeNames = useMemo(() => {
    const names = data.coachees.filter((coachee) => !coachee.isArchived).map((coachee) => coachee.name)
    return [unassignedCoacheeLabel, ...names]
  }, [data.coachees])
  const isCoacheeMenuVisible = isCoacheeMenuOpen
  const inputWebStyle = useMemo(() => ({ outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any), [])
  const isWrittenReportDirty = isWrittenSession && writtenReportDraft !== writtenReportText
  const shouldShowQuickStart = chatMessages.length === 0
  const shouldShowClearChat = chatMessages.length > 0
  const chatOverlayOpacity = useRef(new Animated.Value(0)).current
  const chatOverlayScale = useRef(new Animated.Value(0.98)).current
  const previousMessageCountRef = useRef(chatMessages.length)
  const shouldSkipChatSaveRef = useRef(false)

  const coacheeMenuEstimatedHeight = useMemo(() => {
    const rowCount = activeCoacheeNames.length + 1
    return Math.min(48 * rowCount, 48 * 7)
  }, [activeCoacheeNames.length])

  const coacheeMenuPosition = useMemo(() => {
    if (!coacheeMenuAnchor) return null
    const padding = 12
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800
    const width = Math.max(220, coacheeMenuAnchor.width)
    const estimatedHeight = coacheeMenuEstimatedHeight
    const left = Math.min(Math.max(padding, coacheeMenuAnchor.left), Math.max(padding, viewportWidth - width - padding))
    const top = Math.min(Math.max(padding, coacheeMenuAnchor.top), Math.max(padding, viewportHeight - estimatedHeight - padding))
    return { left, top, width }
  }, [coacheeMenuAnchor, coacheeMenuEstimatedHeight])

  function updateCoacheeMenuAnchor() {
    const rect = coacheeButtonRef.current?.getBoundingClientRect?.()
    if (!rect) return
    setCoacheeMenuAnchor({ left: rect.left, top: rect.bottom + 8, width: rect.width })
  }

  useEffect(() => {
    setWrittenReportDraft(writtenReportText)
  }, [writtenReportText, sessionId])

  useEffect(() => {
    if (!newlyCreatedCoacheeName) return
    const match = data.coachees.find((coachee) => coachee.name === newlyCreatedCoacheeName)
    if (!match) return
    setEditableCoacheeName(match.name)
    updateSession(sessionId, { coacheeId: match.id })
    setIsCoacheeMenuOpen(false)
    onNewlyCreatedCoacheeHandled?.()
  }, [data.coachees, newlyCreatedCoacheeName, onNewlyCreatedCoacheeHandled, sessionId, updateSession])

  useEffect(() => {
    if (!defaultTemplateId) return
    if (selectedTemplateId && templates.some((template) => template.id === selectedTemplateId)) return
    setSelectedTemplateId(defaultTemplateId)
  }, [defaultTemplateId, selectedTemplateId, templates])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isCoacheeMenuOpen) return

    const isInsideRect = (x: number, y: number, rect: { left: number; top: number; right: number; bottom: number }) => {
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    }

    const closeIfOutsideAllowedArea = (x: number, y: number) => {
      const buttonRect = coacheeButtonRef.current?.getBoundingClientRect?.()
      if (!buttonRect || !coacheeMenuPosition) {
        setIsCoacheeMenuOpen(false)
        return
      }

      const buttonRectSimplified = {
        left: buttonRect.left,
        top: buttonRect.top,
        right: buttonRect.right,
        bottom: buttonRect.bottom,
      }

      const menuRect = {
        left: coacheeMenuPosition.left,
        top: coacheeMenuPosition.top,
        right: coacheeMenuPosition.left + coacheeMenuPosition.width,
        bottom: coacheeMenuPosition.top + coacheeMenuEstimatedHeight,
      }

      const connectorRect = {
        left: Math.min(buttonRectSimplified.left, menuRect.left),
        right: Math.max(buttonRectSimplified.right, menuRect.right),
        top: Math.min(buttonRectSimplified.bottom, menuRect.top),
        bottom: Math.max(buttonRectSimplified.bottom, menuRect.top),
      }

      const isInsideAllowedArea =
        isInsideRect(x, y, buttonRectSimplified) || isInsideRect(x, y, connectorRect) || isInsideRect(x, y, menuRect)

      if (!isInsideAllowedArea) {
        setIsCoacheeMenuOpen(false)
      }
    }

    const onMouseMove = (event: MouseEvent) => {
      closeIfOutsideAllowedArea(event.clientX, event.clientY)
    }

    const onMouseDown = (event: MouseEvent) => {
      closeIfOutsideAllowedArea(event.clientX, event.clientY)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onMouseDown)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onMouseDown)
    }
  }, [coacheeMenuEstimatedHeight, coacheeMenuPosition, isCoacheeMenuOpen])

  useEffect(() => {
    shouldSkipChatSaveRef.current = true
    setChatMessages(loadQuickQuestionsChatForSession(sessionId))
    setComposerText('')
    setIsChatSending(false)
  }, [sessionId])

  useEffect(() => {
    if (shouldSkipChatSaveRef.current) {
      shouldSkipChatSaveRef.current = false
      return
    }
    saveQuickQuestionsChatForSession(sessionId, chatMessages)
  }, [chatMessages, sessionId])

  useEffect(() => {
    if (isChatMaximized) {
      setIsChatMaximizedRendered(true)
      chatOverlayOpacity.setValue(0)
      chatOverlayScale.setValue(0.98)
      Animated.parallel([
        Animated.timing(chatOverlayOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(chatOverlayScale, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start()
      return
    }

    Animated.parallel([
      Animated.timing(chatOverlayOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(chatOverlayScale, { toValue: 0.98, duration: 160, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setIsChatMaximizedRendered(false)
    })
  }, [chatOverlayOpacity, chatOverlayScale, isChatMaximized])

  useEffect(() => {
    if (!isChatMaximized) return
    if (typeof window === 'undefined') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setIsChatMaximized(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isChatMaximized])

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
    clearQuickQuestionsChatForSession(sessionId)
    scrollChatToEnd()
  }

  function handleTranscriptMentionPress(seconds: number) {
    audioPlayerRef.current?.seekToSeconds(seconds)
  }

  async function sendChatMessage(messageText: string) {
    const trimmedText = messageText.trim()
    if (!trimmedText || isChatSending) return

    const pdfStartToken = '[[PDF_START]]'
    const pdfEndToken = '[[PDF_END]]'
    const systemMessage: LocalChatMessage = {
      role: 'system',
      text:
        'Je antwoord moet duidelijk en beknopt zijn. Gebruik nooit labels zoals "speaker_3". Als je een spreker moet noemen, zeg dan "coachee", "coach" of "de spreker". Als je verwijst naar een specifiek moment in het transcript, schrijf het dan als [[timestamp=MM:SS|hier]] en gebruik dat alleen voor klikbare tijdstippen. Als het antwoord geschikt is om als PDF te downloaden, zet dan alleen de gewenste inhoud tussen deze twee regels. Gebruik exact deze regels op een eigen regel: ' +
        `${pdfStartToken} en ${pdfEndToken}. ` +
        'Plaats geen andere tekst tussen die regels dan de inhoud die in de PDF hoort. Zet alle overige uitleg buiten die blokken.',
    }

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
      const coacheeId = session?.coacheeId ?? null
      const coacheeTranscriptSessions = coacheeId
        ? data.sessions
            .filter((item) => item.coacheeId === coacheeId && item.kind !== 'notes')
            .map((item) => ({ title: item.title, createdAtUnixMs: item.createdAtUnixMs, transcript: item.transcript ?? null }))
        : []
      const transcriptSystemMessages = coacheeId
        ? buildCoacheeTranscriptsSystemMessages({
            coacheeName: editableCoacheeName,
            sessions: coacheeTranscriptSessions,
            maxTotalCharacters: 500000,
            maxTranscriptCharactersPerSession: 200000,
            maxSessions: 9999,
          })
        : buildConversationTranscriptSystemMessages({ transcript: session?.transcript ?? null })

      const responseText = await completeChat({
        messages: [
          ...transcriptSystemMessages,
          systemMessage,
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
      console.error('[SessieDetailScreen] Chat failed', error)
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout'
      setChatMessages((previousMessages) => [
        ...previousMessages,
        { id: createChatMessageId(), role: 'assistant', text: `Er ging iets mis bij het ophalen van het antwoord. ${errorMessage}` },
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

  async function retryTranscription() {
    if (!session?.audioBlobId) return
    if (session?.transcriptionStatus === 'transcribing' || session?.transcriptionStatus === 'generating') return

    updateSession(sessionId, { transcriptionStatus: 'transcribing', transcriptionError: null, summary: null })

    try {
      const audioData = await loadAudioBlobRemote(session.audioBlobId)
      if (!audioData) {
        throw new Error('Failed to load audio')
      }
      const decrypted = await e2ee.decryptAudioBlobFromStorage(audioData.blob)

      const { transcript, summary } = await transcribeAudio({
        audioBlob: decrypted.audioBlob,
        mimeType: decrypted.mimeType,
        languageCode: 'nl',
      })
      const cleanedSummary = String(summary || '').trim()
      if (cleanedSummary) {
        updateSession(sessionId, {
          transcript,
          summary: cleanedSummary,
          transcriptionStatus: 'done',
          transcriptionError: null,
        })
      } else {
        updateSession(sessionId, {
          transcript,
          transcriptionStatus: 'generating',
          transcriptionError: null,
          summary: null,
        })
        const generatedSummary = await generateSummary({ transcript, template: summaryTemplate })
        updateSession(sessionId, {
          summary: generatedSummary,
          transcriptionStatus: 'done',
          transcriptionError: null,
        })
      }
    } catch (error) {
      console.error('[SessieDetailScreen] Transcription retry failed:', error)
      const rawMessage = error instanceof Error ? error.message : 'Unknown error'
      const isTooLarge = rawMessage.toLowerCase().includes('too large')
      updateSession(sessionId, {
        transcriptionStatus: 'error',
        transcriptionError: isTooLarge ? 'Audio bestand is te groot voor transcriptie.' : rawMessage,
      })
    }
  }

  async function generateReportForTemplate(templateId: string) {
    if (session?.transcriptionStatus === 'transcribing' || session?.transcriptionStatus === 'generating') return
    const template = templates.find((item) => item.id === templateId) ?? null
    const templateForSummary = template
      ? {
          name: template.name,
          sections: template.sections
            .map((section, index) => {
              const title = section.title.trim()
              const description = section.description.trim()
              if (!title && !description) return null
              return { title: title || `Onderdeel ${index + 1}`, description }
            })
            .filter((section): section is { title: string; description: string } => Boolean(section)),
        }
      : undefined

    try {
      let transcript = String(session?.transcript || '').trim()
      if (!transcript) {
        updateSession(sessionId, { transcriptionStatus: 'transcribing', transcriptionError: null, summary: null })
        if (!session?.audioBlobId) {
          throw new Error('Geen audio beschikbaar om een transcript te maken.')
        }
        const audioData = await loadAudioBlobRemote(session.audioBlobId)
        if (!audioData) {
          throw new Error('Failed to load audio')
        }
        const decrypted = await e2ee.decryptAudioBlobFromStorage(audioData.blob)
        const transcription = await transcribeAudio({
          audioBlob: decrypted.audioBlob,
          mimeType: decrypted.mimeType,
          languageCode: 'nl',
        })
        transcript = String(transcription.transcript || '').trim()
        if (!transcript) {
          throw new Error('No transcript returned')
        }
        updateSession(sessionId, { transcript })
      }

      updateSession(sessionId, { transcriptionStatus: 'generating', transcriptionError: null, summary: null })
      const summary = await generateSummary({
        transcript,
        template: templateForSummary && templateForSummary.sections.length > 0 ? templateForSummary : undefined,
      })
      updateSession(sessionId, {
        summary,
        transcriptionStatus: 'done',
        transcriptionError: null,
      })
    } catch (error) {
      console.error('[SessieDetailScreen] Report generation failed', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      updateSession(sessionId, {
        transcriptionStatus: 'error',
        transcriptionError: message,
      })
    }
  }


  if (isMobileLayout) {
    return (
      <View style={styles.container}>
        {/* Detail header */}
        <View style={styles.headerRow}>
          <View style={styles.leftHeader}>
            <Pressable
              onPress={onBack}
              style={({ hovered }) => [styles.backTitleButton, hovered ? styles.backTitleButtonHovered : undefined]}
            >
              {/* Back and session title */}
              <ChevronLeftIcon color={colors.text} size={24} />
              <Text numberOfLines={1} isSemibold style={styles.sessionTitle}>
                {editableSessionTitle}
              </Text>
            </Pressable>
          </View>

          <View style={styles.rightHeader}>
            <View style={styles.headerActionsMenuAnchor}>
              {isWrittenSession ? (
                <Pressable
                  onPress={() => {
                    if (!isWrittenReportDirty) return
                    setWrittenReport(sessionId, writtenReportDraft)
                  }}
                  style={({ hovered }) => [styles.secondaryActionButton, hovered ? styles.secondaryActionButtonHovered : undefined]}
                >
                  {/* Save */}
                  <Text isBold style={styles.secondaryActionText}>
                    Opslaan
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => {
                  setIsEditSessieModalVisible(true)
                }}
                style={({ hovered }) => [styles.secondaryActionButton, styles.secondaryActionButtonIconOnly, hovered ? styles.secondaryActionButtonHovered : undefined]}
              >
                {/* Adjust button */}
                <AanpassenIcon color="#656565" size={18} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Mobile content */}
        {isWrittenSession ? (
          <View style={styles.writtenReportContainer}>
            <View style={[styles.reportCard, styles.reportCardFill]}>
              <TextInput
                value={writtenReportDraft}
                onChangeText={setWrittenReportDraft}
                multiline
                textAlignVertical="top"
                style={[styles.writtenReportInput, inputWebStyle]}
              />
            </View>
          </View>
        ) : (
          <ScrollView style={styles.mobileScroll} contentContainerStyle={styles.mobileScrollContent} showsVerticalScrollIndicator={false}>
            <>
              {/* Audio */}
              <AudioPlayerCard ref={audioPlayerRef} audioBlobId={session?.audioBlobId ?? null} />
              {/* Report */}
              <View style={styles.reportCard}>
                  <ReportPanel
                  templateLabel={selectedTemplateLabel}
                  onPressTemplate={() => setIsTemplatePickerModalVisible(true)}
                  isCompact
                  summary={session?.summary ?? null}
                    hasTranscript={hasTranscript}
                  transcriptionStatus={session?.transcriptionStatus ?? 'idle'}
                  transcriptionError={session?.transcriptionError ?? null}
                  onRetryTranscription={() => (selectedTemplateId ? generateReportForTemplate(selectedTemplateId) : null)}
                />
              </View>
              {/* Active tab content */}
              <View style={styles.mobileTabContentCard}>
                <View style={styles.tabsRow}>
                  <View style={styles.tabsLeft}>
                    <ConversationTabs activeTabKey={activeTabKey} onSelectTab={setActiveTabKey} />
                  </View>
                  {activeTabKey === 'snelleVragen' ? (
                    <View style={styles.tabsRight}>
                      <Pressable
                        onPress={() => setIsChatMaximized(true)}
                        style={({ hovered }) => [styles.chatActionButton, hovered ? styles.chatActionButtonHovered : undefined]}
                      >
                        {/* Maximize chat */}
                        <FullScreenOpenIcon />
                      </Pressable>
                    </View>
                  ) : null}
                </View>
                {activeTabKey === 'snelleVragen' && shouldShowClearChat ? (
                  <View style={styles.chatActionsRowMobile}>
                    <Pressable
                      onPress={resetChat}
                      style={({ hovered }) => [styles.chatActionButton, hovered ? styles.chatActionButtonHovered : undefined]}
                    >
                      {/* Clear chat */}
                      <Text isBold style={styles.chatActionText}>
                        Chat wissen
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
                <AnimatedMainContent key={activeTabKey} contentKey={activeTabKey} style={styles.mobileTabAnimated}>
                  {activeTabKey === 'snelleVragen' ? (
                    <View style={[styles.chatTab, styles.chatTabMobile]}>
                      <ScrollView
                        ref={chatScrollRef}
                        style={[styles.chatArea, styles.chatAreaMobile]}
                        contentContainerStyle={shouldShowQuickStart ? styles.chatAreaContentCentered : styles.chatAreaContent}
                        showsVerticalScrollIndicator={false}
                      >
                        {shouldShowQuickStart ? (
                          <QuickQuestionsStart
                            coacheeName={editableCoacheeName}
                            onSelectOption={(fullSentence) => sendChatMessage(fullSentence)}
                          />
                        ) : (
                          <>
                            {chatMessages.map((message) => (
                              <ChatMessage
                                key={message.id}
                                role={message.role}
                                text={message.text}
                                onTranscriptMentionPress={handleTranscriptMentionPress}
                              />
                            ))}
                            {isChatSending ? (
                              <ChatMessage role="assistant" text="" isLoading onTranscriptMentionPress={handleTranscriptMentionPress} />
                            ) : null}
                          </>
                        )}
                      </ScrollView>
                      <View style={styles.chatBottom}>
                        <ChatComposer
                          value={composerText}
                          onChangeValue={setComposerText}
                          onSend={handleSendChatMessage}
                          isSendDisabled={isChatSending || composerText.trim().length === 0}
                          shouldAutoFocus={activeTabKey === 'snelleVragen'}
                          autoFocusKey={activeTabKey}
                          onPressEscape={() => {
                            if (!isChatMaximized) return
                            setIsChatMaximized(false)
                          }}
                        />
                      </View>
                    </View>
                  ) : null}

                  {activeTabKey === 'notities' ? (
                    <NotesTabPanel sessionId={sessionId} dateTimeLabel="Jan 22 2026 om 20:04" shouldFillAvailableHeight={false} />
                  ) : null}
                  {activeTabKey === 'volledigeSessie' ? (
                    <TranscriptTabPanel
                      searchValue={transcriptSearchText}
                      onChangeSearchValue={setTranscriptSearchText}
                      shouldFillAvailableHeight={false}
                      transcript={session?.transcript ?? null}
                      transcriptionStatus={session?.transcriptionStatus ?? 'idle'}
                      transcriptionError={session?.transcriptionError ?? null}
                      onSeekToSeconds={(seconds) => audioPlayerRef.current?.seekToSeconds(seconds)}
                      onRetryTranscription={retryTranscription}
                    />
                  ) : null}
                </AnimatedMainContent>
              </View>
            </>
          </ScrollView>
        )}

        <EditSessieModal
          visible={isEditSessieModalVisible}
          initialSessionTitle={editableSessionTitle}
          initialCoacheeName={editableCoacheeName}
          initialTemplateKey={selectedTemplateId ?? ''}
          initialTemplateLabel={selectedTemplateLabel}
          coacheeOptions={activeCoacheeNames}
          templateOptions={templates.map((template) => ({ key: template.id, label: template.name }))}
          isTemplateChangeAllowed={!isWrittenSession}
          onClose={() => setIsEditSessieModalVisible(false)}
          onApply={(values) => {
            const nextCoacheeId = isUnassignedCoacheeName(values.coacheeName)
              ? null
              : data.coachees.find((coachee) => coachee.name === values.coacheeName)?.id ?? session?.coacheeId ?? null
            updateSession(sessionId, {
              coacheeId: nextCoacheeId,
              title: values.sessionTitle,
            })
            onChangeCoachee(nextCoacheeId)
            setEditableSessionTitle(values.sessionTitle)
            setEditableCoacheeName(values.coacheeName)
            setSelectedTemplateId(values.templateKey)
            setIsEditSessieModalVisible(false)
          }}
          onOpenNewCoachee={onOpenNewCoachee}
          onDelete={() => {
            setIsEditSessieModalVisible(false)
            setIsDeleteSessieModalVisible(true)
          }}
        />

        <ConfirmSessieDeleteModal
          visible={isDeleteSessieModalVisible}
          sessieTitle={editableSessionTitle}
          onClose={() => setIsDeleteSessieModalVisible(false)}
          onConfirm={() => {
            deleteSession(sessionId)
            setIsDeleteSessieModalVisible(false)
            onBack()
          }}
        />

        <TemplatePickerModal
          visible={isTemplatePickerModalVisible}
          templates={templates.map((template) => ({ id: template.id, name: template.name }))}
          selectedTemplateId={selectedTemplateId}
          onClose={() => setIsTemplatePickerModalVisible(false)}
          onContinue={(templateId) => {
            setSelectedTemplateId(templateId)
            setIsTemplatePickerModalVisible(false)
            void generateReportForTemplate(templateId)
          }}
        />

      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Detail header */}
      <View style={styles.headerRow}>
        <View pointerEvents="none" style={styles.headerGradient} />
        <View style={styles.leftHeader}>
          <Pressable
            onPress={onBack}
            style={({ hovered }) => [styles.backTitleButton, hovered ? styles.backTitleButtonHovered : undefined]}
          >
            {/* Back and session title */}
            <ChevronLeftIcon color={colors.text} size={24} />
            <Text numberOfLines={1} isSemibold style={styles.sessionTitle}>
              {editableSessionTitle}
            </Text>
          </Pressable>

          {!isVerySmallLayout ? (
            <Pressable
              ref={coacheeButtonRef}
              onPress={() => {
                updateCoacheeMenuAnchor()
                setIsCoacheeMenuOpen((value) => !value)
              }}
              onHoverIn={() => {
                updateCoacheeMenuAnchor()
                setIsCoacheeMenuOpen(true)
              }}
              style={({ hovered }) => [styles.coacheeContainer, hovered ? styles.coacheeContainerHovered : undefined]}
            >
              {/* Coachee */}
              <CoacheeAvatarIcon color={colors.selected} size={24} />
              <Text isSemibold style={styles.coacheeName}>
                {editableCoacheeName}
              </Text>
            </Pressable>
          ) : null}

          {!isVerySmallLayout && !hideDate && dateLabel.length > 0 ? (
            <View style={styles.dateContainer}>
              {/* Date */}
              <CalendarCircleIcon size={24} />
              <Text isSemibold style={styles.dateText}>
                {dateLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.rightHeader}>
          <View style={styles.headerActionsMenuAnchor}>
            {isWrittenReportDirty ? (
              <Pressable
                onPress={() => {
                  if (!isWrittenReportDirty) return
                  setWrittenReport(sessionId, writtenReportDraft)
                }}
                style={({ hovered }) => [
                  styles.secondaryActionButton,
                  isHeaderActionButtonsCompact ? styles.secondaryActionButtonIconOnly : undefined,
                  hovered ? styles.secondaryActionButtonHovered : undefined,
                ]}
              >
                {/* Save */}
                <Text isBold style={styles.secondaryActionText}>
                  Opslaan
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => {
                setIsEditSessieModalVisible(true)
              }}
              style={({ hovered }) => [
                styles.secondaryActionButton,
                isHeaderActionButtonsCompact ? styles.secondaryActionButtonIconOnly : undefined,
                hovered ? styles.secondaryActionButtonHovered : undefined,
              ]}
            >
              {/* Adjust button */}
              <AanpassenIcon color="#656565" size={18} />
              {!isHeaderActionButtonsCompact ? (
                <Text isBold style={styles.secondaryActionText}>
                  Aanpassen
                </Text>
              ) : null}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Detail content */}
      <View style={styles.content}>
        <View style={styles.mainRow}>
          {/* Left column */}
          <View style={styles.leftColumn}>
            {isWrittenSession ? (
              <View style={styles.leftScroll}>
                <View style={[styles.reportCard, styles.reportCardFill]}>
                  <TextInput
                    value={writtenReportDraft}
                    onChangeText={setWrittenReportDraft}
                    multiline
                    textAlignVertical="top"
                    style={[styles.writtenReportInput, inputWebStyle]}
                  />
                </View>
              </View>
            ) : (
              <ScrollView style={styles.leftScroll} contentContainerStyle={styles.leftScrollContent} showsVerticalScrollIndicator={false}>
                {/* Audio card */}
                <AudioPlayerCard ref={audioPlayerRef} audioBlobId={session?.audioBlobId ?? null} />
                {/* Report card */}
                <View style={styles.reportCard}>
                  <ReportPanel
                    templateLabel={selectedTemplateLabel}
                    onPressTemplate={() => setIsTemplatePickerModalVisible(true)}
                    isCompact={isCompactLayout}
                    summary={session?.summary ?? null}
                    hasTranscript={hasTranscript}
                    transcriptionStatus={session?.transcriptionStatus ?? 'idle'}
                    transcriptionError={session?.transcriptionError ?? null}
                    onRetryTranscription={() => (selectedTemplateId ? generateReportForTemplate(selectedTemplateId) : null)}
                  />
                </View>
              </ScrollView>
            )}
          </View>

          {!isWrittenSession ? (
            <View style={styles.rightColumn}>
              <View style={styles.rightCard}>
                <View style={styles.tabsRow}>
                  <View style={styles.tabsLeft}>
                    <ConversationTabs activeTabKey={activeTabKey} onSelectTab={setActiveTabKey} />
                  </View>
                  {activeTabKey === 'snelleVragen' ? (
                    <View style={styles.tabsRight}>
                      {shouldShowClearChat ? (
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
                        onPress={() => setIsChatMaximized(true)}
                        style={({ hovered }) => [styles.chatActionButton, hovered ? styles.chatActionButtonHovered : undefined]}
                      >
                        {/* Maximize chat */}
                        <FullScreenOpenIcon />
                      </Pressable>
                    </View>
                  ) : null}
                </View>

                <AnimatedMainContent key={activeTabKey} contentKey={activeTabKey} style={styles.tabAnimated}>
                  {activeTabKey === 'snelleVragen' ? (
                    <View style={styles.chatTab}>
                      <ScrollView
                        ref={chatScrollRef}
                        style={styles.chatArea}
                        contentContainerStyle={shouldShowQuickStart ? styles.chatAreaContentCentered : styles.chatAreaContent}
                        showsVerticalScrollIndicator={false}
                      >
                        {shouldShowQuickStart ? (
                          <QuickQuestionsStart
                            coacheeName={editableCoacheeName}
                            onSelectOption={(fullSentence) => sendChatMessage(fullSentence)}
                          />
                        ) : (
                          <>
                            {chatMessages.map((message) => (
                              <ChatMessage
                                key={message.id}
                                role={message.role}
                                text={message.text}
                                onTranscriptMentionPress={handleTranscriptMentionPress}
                              />
                            ))}
                            {isChatSending ? (
                              <ChatMessage role="assistant" text="" isLoading onTranscriptMentionPress={handleTranscriptMentionPress} />
                            ) : null}
                          </>
                        )}
                      </ScrollView>

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

                  {activeTabKey === 'notities' ? <NotesTabPanel sessionId={sessionId} dateTimeLabel="Jan 22 2026 om 20:04" /> : null}

                  {activeTabKey === 'volledigeSessie' ? (
                    <TranscriptTabPanel
                      searchValue={transcriptSearchText}
                      onChangeSearchValue={setTranscriptSearchText}
                      transcript={session?.transcript ?? null}
                      transcriptionStatus={session?.transcriptionStatus ?? 'idle'}
                      transcriptionError={session?.transcriptionError ?? null}
                      onSeekToSeconds={(seconds) => audioPlayerRef.current?.seekToSeconds(seconds)}
                      onRetryTranscription={retryTranscription}
                    />
                  ) : null}
                </AnimatedMainContent>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      <EditSessieModal
        visible={isEditSessieModalVisible}
        initialSessionTitle={editableSessionTitle}
        initialCoacheeName={editableCoacheeName}
        initialTemplateKey={selectedTemplateId ?? ''}
        initialTemplateLabel={selectedTemplateLabel}
        coacheeOptions={activeCoacheeNames}
        templateOptions={templates.map((template) => ({ key: template.id, label: template.name }))}
        isTemplateChangeAllowed={!isWrittenSession}
        onClose={() => setIsEditSessieModalVisible(false)}
        onApply={(values) => {
          const nextCoacheeId = isUnassignedCoacheeName(values.coacheeName)
            ? null
            : data.coachees.find((coachee) => coachee.name === values.coacheeName)?.id ?? session?.coacheeId ?? null
          updateSession(sessionId, {
            coacheeId: nextCoacheeId,
            title: values.sessionTitle,
          })
          setEditableSessionTitle(values.sessionTitle)
          setEditableCoacheeName(values.coacheeName)
          setSelectedTemplateId(values.templateKey)
          setIsEditSessieModalVisible(false)
        }}
        onOpenNewCoachee={onOpenNewCoachee}
        newlyCreatedCoacheeName={newlyCreatedCoacheeName ?? null}
        onNewlyCreatedCoacheeHandled={onNewlyCreatedCoacheeHandled}
        onDelete={() => {
          setIsEditSessieModalVisible(false)
          setIsDeleteSessieModalVisible(true)
        }}
      />

      <ConfirmSessieDeleteModal
        visible={isDeleteSessieModalVisible}
        sessieTitle={editableSessionTitle}
        onClose={() => setIsDeleteSessieModalVisible(false)}
        onConfirm={() => {
          deleteSession(sessionId)
          setIsDeleteSessieModalVisible(false)
          onBack()
        }}
      />

      <TemplatePickerModal
        visible={isTemplatePickerModalVisible}
        templates={templates.map((template) => ({ id: template.id, name: template.name }))}
        selectedTemplateId={selectedTemplateId}
        onClose={() => setIsTemplatePickerModalVisible(false)}
        onContinue={(templateId) => {
          setSelectedTemplateId(templateId)
          setIsTemplatePickerModalVisible(false)
          void generateReportForTemplate(templateId)
        }}
      />

      {isChatMaximizedRendered ? (
        <WebPortal>
          <Animated.View style={[styles.chatOverlay, { opacity: chatOverlayOpacity }]}>
            <Animated.View style={[styles.chatOverlayCard, { transform: [{ scale: chatOverlayScale }] }]}>
              <View style={styles.chatOverlayHeader}>
                <Text isSemibold style={styles.chatOverlayTitle}>
                  Snelle vragen
                </Text>
                <View style={styles.chatOverlayActions}>
                  {shouldShowClearChat ? (
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
                    onPress={() => setIsChatMaximized(false)}
                    style={({ hovered }) => [styles.chatActionButton, hovered ? styles.chatActionButtonHovered : undefined]}
                  >
                    {/* Close full screen */}
                    <FullScreenCloseIcon />
                  </Pressable>
                </View>
              </View>
              <View style={styles.chatTab}>
                <ScrollView
                  ref={chatScrollRef}
                  style={styles.chatArea}
                  contentContainerStyle={shouldShowQuickStart ? styles.chatAreaContentCentered : styles.chatAreaContent}
                  showsVerticalScrollIndicator={false}
                >
                  {shouldShowQuickStart ? (
                    <QuickQuestionsStart coacheeName={editableCoacheeName} onSelectOption={(fullSentence) => sendChatMessage(fullSentence)} />
                  ) : (
                    <>
                      {chatMessages.map((message) => (
                        <ChatMessage
                          key={message.id}
                          role={message.role}
                          text={message.text}
                          onTranscriptMentionPress={handleTranscriptMentionPress}
                        />
                      ))}
                      {isChatSending ? (
                        <ChatMessage role="assistant" text="" isLoading onTranscriptMentionPress={handleTranscriptMentionPress} />
                      ) : null}
                    </>
                  )}
                </ScrollView>
                <View style={styles.chatBottom}>
                  <ChatComposer
                    value={composerText}
                    onChangeValue={setComposerText}
                    onSend={handleSendChatMessage}
                    isSendDisabled={isChatSending || composerText.trim().length === 0}
                    shouldAutoFocus
                    autoFocusKey="full-screen-chat"
                    onPressEscape={() => setIsChatMaximized(false)}
                  />
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </WebPortal>
      ) : null}

      {isCoacheeMenuVisible && coacheeMenuPosition ? (
        <WebPortal>
          <AnimatedDropdownPanel
            visible={isCoacheeMenuVisible}
            style={[styles.coacheeMenu, { left: coacheeMenuPosition.left, top: coacheeMenuPosition.top, width: coacheeMenuPosition.width } as any]}
          >
            <View>
              {activeCoacheeNames.map((name, index) => {
                const isFirst = index === 0
                return (
                  <Pressable
                    key={name}
                    onPress={() => {
                      const nextCoacheeId = isUnassignedCoacheeName(name)
                        ? null
                        : data.coachees.find((coachee) => coachee.name === name)?.id ?? session?.coacheeId ?? null
                      updateSession(sessionId, { coacheeId: nextCoacheeId })
                      onChangeCoachee(nextCoacheeId)
                      setEditableCoacheeName(name)
                      setIsCoacheeMenuOpen(false)
                    }}
                    style={({ hovered }) => [
                      styles.coacheeMenuRow,
                      isFirst ? styles.coacheeMenuRowTop : undefined,
                      hovered ? styles.coacheeMenuRowHovered : undefined,
                    ]}
                  >
                    {/* Coachee menu item */}
                    <Text isSemibold style={styles.coacheeMenuRowText}>
                      {name}
                    </Text>
                  </Pressable>
                )
              })}
              <Pressable
                onPress={(event) => {
                  event.stopPropagation()
                  setIsCoacheeMenuOpen(false)
                  onOpenNewCoachee()
                }}
                style={({ hovered }) => [
                  styles.coacheeMenuRow,
                  styles.coacheeMenuRowAdd,
                  activeCoacheeNames.length === 0 ? styles.coacheeMenuRowTop : undefined,
                  styles.coacheeMenuRowBottom,
                  hovered ? styles.coacheeMenuRowAddHovered : undefined,
                ]}
              >
                {/* Add coachee */}
                <Text isSemibold style={styles.coacheeMenuRowAddText}>
                  + Nieuwe coachee
                </Text>
              </Pressable>
            </View>
          </AnimatedDropdownPanel>
        </WebPortal>
      ) : null}
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
    zIndex: 2,
    paddingVertical: 8,
    position: 'relative',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    ...( { backgroundImage: `linear-gradient(180deg, ${colors.pageBackground} 0%, rgba(248,249,249,0) 100%)` } as any ),
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
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
  sessionTitle: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.text,
    flexShrink: 1,
  },
  coacheeContainer: {
    height: 40,
    borderRadius: 12,
    backgroundColor: 'transparent',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coacheeContainerHovered: {
    backgroundColor: colors.hoverBackground,
  },
  coacheeName: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  coacheeMenu: {
    ...( { position: 'fixed', zIndex: 9999, boxShadow: '0 20px 60px rgba(0,0,0,0.16)' } as any ),
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    padding: 0,
    maxHeight: 48 * 7,
  },
  coacheeMenuRow: {
    height: 48,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  coacheeMenuRowTop: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  coacheeMenuRowBottom: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  coacheeMenuRowHovered: {
    backgroundColor: colors.hoverBackground,
  },
  coacheeMenuRowText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  coacheeMenuRowAdd: {
    backgroundColor: colors.selected,
  },
  coacheeMenuRowAddHovered: {
    backgroundColor: '#A50058',
  },
  coacheeMenuRowAddText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  dateContainer: {
    height: 40,
    borderRadius: 12,
    backgroundColor: 'transparent',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionsMenuAnchor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...( { position: 'relative' } as any ),
  },
  secondaryActionButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionButtonIconOnly: {
    width: 40,
    padding: 0,
  },
  secondaryActionButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  secondaryActionText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
  },
  content: {
    flex: 1,
    gap: 16,
    paddingTop: 16,
  },
  mainRow: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'stretch',
  },
  leftColumn: {
    flex: 1,
    position: 'relative',
  },
  rightColumn: {
    flex: 1,
  },
  leftScroll: {
    flex: 1,
  },
  leftScrollContent: {
    gap: 16,
    paddingBottom: 16,
  },
  mobileScroll: {
    flex: 1,
  },
  mobileScrollContent: {
    gap: 16,
    paddingBottom: 24,
  },
  reportCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  reportCardFill: {
    flex: 1,
  },
  writtenReportContainer: {
    flex: 1,
  },
  writtenReportInput: {
    width: '100%',
    height: '100%',
    padding: 0,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  rightCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 16,
  },
  mobileTabsContainer: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  mobileTabContentCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 16,
  },
  mobileTabAnimated: {
    flex: 0,
  },
  chatTab: {
    flex: 1,
    gap: 16,
  },
  chatTabMobile: {
    flex: 0,
  },
  chatArea: {
    flex: 1,
  },
  chatAreaContent: {
    gap: 12,
    paddingBottom: 8,
  },
  chatAreaMobile: {
    minHeight: 320,
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
  tabsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  tabsLeft: {
    flex: 1,
    minWidth: 0,
  },
  tabsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatActionsRowMobile: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  chatAreaContentCentered: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 8,
  },
  chatOverlay: {
    ...( { position: 'fixed', inset: 0, zIndex: 9999 } as any ),
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 24,
  },
  chatOverlayCard: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 16,
  },
  chatOverlayHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatOverlayTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  chatOverlayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  tabAnimated: {
    flex: 1,
  },
})

