import { useEffect, useMemo, useRef, useState } from 'react'
import type { ScrollView } from 'react-native'

import { sendClientChatMessage } from '@/api/chat/sendClientChatPromptMessage'
import type { LocalChatMessage } from '@/api/chat/types'
import { fetchBillingStatus } from '@/api/billing/billingApi'
import { buildClientStructuredSystemMessages } from '@/content/assistantContext'
import { clearAssistantChatForClient, loadAssistantChatForClient, saveAssistantChatForClient } from '@/storage/assistantChatStore'
import { createChatMessageId, type ChatStateMessage } from '@/types/chatState'
import type {
  ClientRecord,
  ClientRightTabKey,
  ClientSession,
  ClientSnippet,
  ClientWrittenReport,
} from '@/screens/client/clientScreen.types'

type Params = {
  activeTrajectoryName: string | null
  rightActiveTabKey: ClientRightTabKey
  chatContextSessionIds: Set<string>
  chatScrollRef: React.RefObject<ScrollView | null>
  client: ClientRecord | null
  clientId: string
  clientName: string
  onStatusFallbackText: string
  reportCount: number
  sessionCount: number
  sessions: ClientSession[]
  sessionItemsForStatus: Array<{ title: string; trajectoryLabel: string; dateLabel: string; timeLabel: string }>
  snippets: ClientSnippet[]
  writtenReports: ClientWrittenReport[]
}

type BillingStatus = {
  includedSeconds: number
  cycleUsedSeconds: number
  nonExpiringTotalSeconds: number
  nonExpiringUsedSeconds: number
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

function formatDutchDateTime(unixMs: number): string {
  if (!Number.isFinite(unixMs)) return '-'
  return new Date(unixMs).toLocaleString('nl-NL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function readSessionClientId(session: ClientSession): string {
  return String((session as any).clientId || '')
}

export function useClientChatbot({
  activeTrajectoryName,
  rightActiveTabKey,
  chatContextSessionIds,
  chatScrollRef,
  client,
  clientId,
  clientName,
  onStatusFallbackText,
  reportCount,
  sessionCount,
  sessions,
  sessionItemsForStatus,
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

  const writtenReportBySessionId = useMemo(() => new Map(writtenReports.map((item) => [item.sessionId, item])), [writtenReports])

  useEffect(() => {
    shouldSkipChatSaveRef.current = true
    const loadedMessages = loadAssistantChatForClient(clientId)
    setChatMessages(loadedMessages)
    previousMessageCountRef.current = loadedMessages.length
    setComposerText('')
    setIsChatSending(false)
  }, [clientId])

  useEffect(() => {
    if (shouldSkipChatSaveRef.current) {
      shouldSkipChatSaveRef.current = false
      return
    }
    saveAssistantChatForClient(clientId, chatMessages)
  }, [chatMessages, clientId])

  useEffect(() => {
    const previousCount = previousMessageCountRef.current
    const nextCount = chatMessages.length
    if (nextCount > previousCount) scrollChatToEnd(chatScrollRef)
    previousMessageCountRef.current = nextCount
  }, [chatMessages.length, chatScrollRef])

  useEffect(() => {
    if (!isChatSending) return
    scrollChatToEnd(chatScrollRef)
  }, [chatScrollRef, isChatSending])

  useEffect(() => {
    if (rightActiveTabKey !== 'status') return

    let isCancelled = false
    async function generateStatus() {
      const sessionsForClient = sessions
        .filter((session) => readSessionClientId(session) === clientId)
        .sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
      const sessionById = new Map(sessionsForClient.map((session) => [session.id, session]))

      const approvedSnippets = snippets
        .filter((snippet) => snippet.status === 'approved')
        .filter((snippet) => sessionById.has(snippet.itemId))
        .sort((a, b) => a.date - b.date)

      const snippetsByInput = new Map<
        string,
        {
          inputDateUnixMs: number
          snippets: Array<{ field: string; text: string }>
        }
      >()
      for (const snippet of approvedSnippets) {
        const session = sessionById.get(snippet.itemId)
        const inputDateUnixMs = Number.isFinite(session?.createdAtUnixMs as number)
          ? Number(session?.createdAtUnixMs)
          : Number.isFinite(snippet.date)
            ? snippet.date
            : Date.now()
        const current = snippetsByInput.get(snippet.itemId) || { inputDateUnixMs, snippets: [] }
        current.snippets.push({
          field: String(snippet.field || '').trim(),
          text: String(snippet.text || '').trim(),
        })
        snippetsByInput.set(snippet.itemId, current)
      }

      const groupedSnippetsByInputDate = [...snippetsByInput.entries()]
        .sort((a, b) => a[1].inputDateUnixMs - b[1].inputDateUnixMs)
        .map(([inputId, value]) => {
          const session = sessionById.get(inputId)
          const snippetLines = value.snippets
            .filter((snippet) => snippet.text.length > 0)
            .map((snippet) => `- [${snippet.field || 'general'}] ${snippet.text}`)
          return [
            `Input-ID: ${inputId}`,
            `Inputdatum: ${formatDutchDateTime(value.inputDateUnixMs)}`,
            `Titel: ${String(session?.title || 'Onbekend input-item').trim()}`,
            ...(snippetLines.length > 0 ? snippetLines : ['- Geen snippets']),
          ].join('\n')
        })
        .join('\n\n')

      const timelineEvents: Array<{ atUnixMs: number; label: string }> = []
      for (const session of sessionsForClient) {
        const eventLines = [`${formatDutchDateTime(session.createdAtUnixMs)} | Sessie | ${String(session.title || 'Sessie').trim()}`]
        const snippetSet = snippetsByInput.get(session.id)
        if (snippetSet && snippetSet.snippets.length > 0) {
          eventLines.push(
            ...snippetSet.snippets
              .filter((snippet) => snippet.text.length > 0)
              .map((snippet) => `  - [${snippet.field || 'general'}] ${snippet.text}`),
          )
        } else {
          eventLines.push('  - Geen snippets')
        }
        timelineEvents.push({
          atUnixMs: session.createdAtUnixMs,
          label: eventLines.join('\n'),
        })
      }
      for (const report of writtenReports) {
        const session = sessionById.get(report.sessionId)
        if (!session) continue
        timelineEvents.push({
          atUnixMs: report.updatedAtUnixMs,
          label: `${formatDutchDateTime(report.updatedAtUnixMs)} | Rapportage aangemaakt | ${String(session.title || 'Rapportage').trim()}`,
        })
      }

      const lastFiveTimeline = timelineEvents
        .sort((a, b) => b.atUnixMs - a.atUnixMs)
        .slice(0, 5)
        .map((event) => event.label)
        .join('\n\n')

      setIsStatusSummaryLoading(true)
      try {
        const response = await sendClientChatMessage([
          {
            role: 'system',
            text:
              'Je bent een statusgenerator in een softwareproduct voor re-integratiecoaches. Schrijf een korte statusupdate in het Nederlands (max 90 woorden): hoe gaat het met deze client en waar zijn we gebleven. Wees concreet, professioneel en zonder opsommingen.',
          },
          {
            role: 'user',
            text:
              `Client: ${clientName}\n` +
              `Traject: ${activeTrajectoryName || 'Geen traject'}\n` +
              `Sessies: ${sessionCount}\n` +
              `Rapportages: ${reportCount}\n\n` +
              `Snippets gegroepeerd per inputdatum (chronologisch):\n${groupedSnippetsByInputDate || 'Geen snippets beschikbaar.'}\n\n` +
              `Laatste 5 items (nieuw naar oud):\n${lastFiveTimeline || 'Geen items beschikbaar.'}`,
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
  }, [activeTrajectoryName, rightActiveTabKey, clientId, clientName, onStatusFallbackText, reportCount, sessionCount, sessions, snippets, writtenReports, sessionItemsForStatus])

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

      const contextMessages = buildClientStructuredSystemMessages({
        clientName,
        clientCreatedAtUnixMs: client?.createdAtUnixMs ?? null,
        clientDetails: client?.clientDetails ?? '',
        employerDetails: client?.employerDetails ?? '',
        firstSickDay: client?.firstSickDay ?? '',
        includeSessionReports: true,
        sessions: sessions
          .filter((session) => readSessionClientId(session) === clientId && chatContextSessionIds.has(session.id))
          .sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
          .slice(0, 25)
          .map((session) => ({
            title: session.title,
            createdAtUnixMs: session.createdAtUnixMs,
            summary: session.summary ?? null,
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
    clearAssistantChatForClient(clientId)
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
