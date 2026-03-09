import { useEffect, useMemo, useRef, useState } from 'react'
import type { ScrollView } from 'react-native'

import { clearQuickQuestionsChatForCoachee, loadQuickQuestionsChatForCoachee, saveQuickQuestionsChatForCoachee } from '../../storage/quickQuestionsChatStore'
import type { Coachee, Session, Snippet, WrittenReport } from '../../storage/types'
import { fetchBillingStatus } from '../../api/billing/billingApi'
import { sendClientChatMessage } from '../../ai/chat/sendClientChatMessage'
import type { LocalChatMessage } from '../../api/chat/types'
import { createChatMessageId, type ChatStateMessage } from '../../types/chatState'
import { buildCoacheeStructuredSystemMessages } from '../../content/quickQuestionsContext'

type SessionContextInput = {
  id: string
  title: string
  createdAtUnixMs: number
  summary: string | null
  reportDate: string | null
  wvpWeekNumber: string | null
  reportFirstSickDay: string | null
}

type Params = {
  activeTrajectoryName: string | null
  assistantPanelTabKey: 'aiChat' | 'status'
  chatContextSessionIds: Set<string>
  chatScrollRef: React.RefObject<ScrollView | null>
  coachee: Coachee | null
  coacheeId: string
  coacheeName: string
  onStatusFallbackText: string
  reportCount: number
  sessionCount: number
  sessions: Session[]
  sessieItemsForStatus: Array<{ title: string; trajectoryLabel: string; dateLabel: string; timeLabel: string }>
  snippets: Snippet[]
  writtenReports: WrittenReport[]
}

function scrollChatToEnd(chatScrollRef: React.RefObject<ScrollView | null>) {
  const scrollView = chatScrollRef.current
  if (!scrollView) return
  setTimeout(() => scrollView.scrollToEnd({ animated: true }), 0)
}

function readRemainingTranscriptionSeconds(status: BillingStatus | null): number {
  if (!status) return 0
  const includedRemainingSeconds = Math.max(0, Math.floor(status.includedSeconds - status.cycleUsedSeconds))
  const nonExpiringRemainingSeconds = Math.max(0, Math.floor(status.nonExpiringTotalSeconds - status.nonExpiringUsedSeconds))
  return includedRemainingSeconds + nonExpiringRemainingSeconds
}

type BillingStatus = {
  includedSeconds: number
  cycleUsedSeconds: number
  nonExpiringTotalSeconds: number
  nonExpiringUsedSeconds: number
}

export function useClientDetailChatFlow({
  activeTrajectoryName,
  assistantPanelTabKey,
  chatContextSessionIds,
  chatScrollRef,
  coachee,
  coacheeId,
  coacheeName,
  onStatusFallbackText,
  reportCount,
  sessionCount,
  sessions,
  sessieItemsForStatus,
  snippets,
  writtenReports,
}: Params) {
  const [composerText, setComposerText] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatStateMessage[]>([])
  const [isChatSending, setIsChatSending] = useState(false)
  const [isChatMinutesBlocked, setIsChatMinutesBlocked] = useState(false)
  const [isCheckingChatMinutes, setIsCheckingChatMinutes] = useState(false)
  const [isNoMinutesCtaDismissed, setIsNoMinutesCtaDismissed] = useState(false)
  const [statusSummaryAi, setStatusSummaryAi] = useState<string>('Status wordt gegenereerd...')
  const [isStatusSummaryLoading, setIsStatusSummaryLoading] = useState(false)

  const previousMessageCountRef = useRef(0)
  const shouldSkipChatSaveRef = useRef(false)

  const writtenReportBySessionId = useMemo(
    () => new Map(writtenReports.map((item) => [item.sessionId, item])),
    [writtenReports],
  )

  useEffect(() => {
    shouldSkipChatSaveRef.current = true
    const loadedMessages = loadQuickQuestionsChatForCoachee(coacheeId)
    setChatMessages(loadedMessages)
    previousMessageCountRef.current = loadedMessages.length
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

  useEffect(() => {
    const previousCount = previousMessageCountRef.current
    const nextCount = chatMessages.length
    if (nextCount > previousCount) {
      scrollChatToEnd(chatScrollRef)
    }
    previousMessageCountRef.current = nextCount
  }, [chatMessages.length, chatScrollRef])

  useEffect(() => {
    if (!isChatSending) return
    scrollChatToEnd(chatScrollRef)
  }, [chatScrollRef, isChatSending])

  useEffect(() => {
    if (assistantPanelTabKey !== 'status') return

    let isCancelled = false
    async function generateStatus() {
      const recentItems = sessieItemsForStatus.slice(0, 8).map((item) => ({
        title: item.title,
        trajectory: item.trajectoryLabel,
        date: `${item.dateLabel} ${item.timeLabel}`.trim(),
      }))

      setIsStatusSummaryLoading(true)
      try {
        const response = await sendClientChatMessage([
            {
              role: 'system',
              text: 'Je bent een coach-assistent. Schrijf een korte statusupdate in het Nederlands (max 90 woorden): hoe gaat het met deze client en waar zijn we gebleven. Wees concreet, professioneel en zonder opsommingen.',
            },
            {
              role: 'user',
              text: `Client: ${coacheeName}\nTraject: ${activeTrajectoryName || 'Geen traject'}\nSessies: ${sessionCount}\nRapportages: ${reportCount}\nLaatste items: ${JSON.stringify(recentItems)}`,
            },
          ])
        if (!isCancelled) setStatusSummaryAi(response.trim() || onStatusFallbackText)
      } catch {
        if (!isCancelled) setStatusSummaryAi(onStatusFallbackText)
      } finally {
        if (!isCancelled) setIsStatusSummaryLoading(false)
      }
    }

    void generateStatus()
    return () => {
      isCancelled = true
    }
  }, [activeTrajectoryName, assistantPanelTabKey, coacheeName, onStatusFallbackText, reportCount, sessionCount, sessieItemsForStatus])

  function appendNoMinutesAssistantMessage() {
    const noMinutesText = 'U heeft geen minuten meer. Ga naar Mijn abonnement om extra minuten toe te voegen.'
    setChatMessages((previousMessages) => {
      if (previousMessages.some((message) => message.role === 'assistant' && message.text === noMinutesText)) return previousMessages
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
    } catch {
      return true
    } finally {
      setIsCheckingChatMinutes(false)
    }
  }

  async function sendChatMessage(messageText: string) {
    const trimmedText = messageText.trim()
    if (!trimmedText || isChatSending) return

    const nextUserMessage: ChatStateMessage = { id: createChatMessageId(), role: 'user', text: trimmedText }
    const nextChatMessages = [...chatMessages, nextUserMessage]
    setChatMessages((previous) => [...previous, nextUserMessage])
    setComposerText('')
    setIsChatSending(true)

    try {
      if (!(await ensureSufficientChatMinutes())) {
        setIsChatSending(false)
        return
      }

      const contextMessages = buildCoacheeStructuredSystemMessages({
        coacheeName,
        coacheeCreatedAtUnixMs: coachee?.createdAtUnixMs ?? null,
        clientDetails: coachee?.clientDetails ?? '',
        employerDetails: coachee?.employerDetails ?? '',
        firstSickDay: coachee?.firstSickDay ?? '',
        includeSessionReports: true,
        sessions: sessions
          .filter((session) => session.coacheeId === coacheeId && chatContextSessionIds.has(session.id))
          .sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
          .slice(0, 25)
          .map((session) => ({
            title: session.title,
            createdAtUnixMs: session.createdAtUnixMs,
            summary: session.summary,
            reportText: writtenReportBySessionId.get(session.id)?.text ?? null,
            reportDate: session.reportDate,
            wvpWeekNumber: session.wvpWeekNumber,
            reportFirstSickDay: session.reportFirstSickDay,
          })),
        snippets: snippets
          .filter((snippet) => snippet.status === 'approved')
          .filter((snippet) => chatContextSessionIds.has(snippet.itemId))
          .map((snippet) => ({
            sessionId: snippet.itemId,
            field: snippet.field,
            text: snippet.text,
          })),
        maxTotalCharacters: 18000,
        maxSessionCharacters: 3500,
      })
      const responseText = await sendClientChatMessage(
        nextChatMessages.map<LocalChatMessage>((message) => ({ role: message.role, text: message.text })),
        contextMessages,
      )

      setChatMessages((previous) => [...previous, { id: createChatMessageId(), role: 'assistant', text: responseText }])
    } catch {
      setChatMessages((previous) => [
        ...previous,
        { id: createChatMessageId(), role: 'assistant', text: 'Er ging iets mis bij het ophalen van het antwoord. Probeer het opnieuw.' },
      ])
    } finally {
      setIsChatSending(false)
    }
  }

  function resetChat() {
    setChatMessages([])
    setComposerText('')
    setIsChatSending(false)
    clearQuickQuestionsChatForCoachee(coacheeId)
    scrollChatToEnd(chatScrollRef)
  }

  async function handleSendChatMessage() {
    const trimmedText = composerText.trim()
    if (!trimmedText) return
    setComposerText('')
    await sendChatMessage(trimmedText)
  }

  return {
    chatMessages,
    composerText,
    handleSendChatMessage,
    isChatMinutesBlocked,
    isChatSending,
    isCheckingChatMinutes,
    isNoMinutesCtaDismissed,
    isStatusSummaryLoading,
    resetChat,
    sendChatMessage,
    setComposerText,
    setIsNoMinutesCtaDismissed,
    statusSummaryAi,
  }
}

