import { useEffect, useMemo, useRef, useState } from 'react'
import type { ScrollView } from 'react-native'

import { fetchBillingStatus } from '@/api/billing/billingApi'
import { sendClientPipelineChatMessage, streamClientPipelineChatMessage } from '@/api/pipeline/pipelineApi'
import { clearChatBotForClient, loadChatBotForClient, saveChatBotForClient } from '@/storage/chatBotStore'
import { createChatMessageId, type ChatStateMessage } from '@/types/chatState'
import type {
  ClientRecord,
  ClientRightTabKey,
  ClientInput,
  ClientSnippet,
  ClientWrittenReport,
} from '@/screens/client/clientScreen.types'

type Params = {
  activeTrajectoryName: string | null
  rightActiveTabKey: ClientRightTabKey
  chatContextInputIds: Set<string>
  chatScrollRef: React.RefObject<ScrollView | null>
  client: ClientRecord | null
  clientId: string
  clientName: string
  onStatusFallbackText: string
  reportCount: number
  sessionCount: number
  inputs: ClientInput[]
  sessionItemsForStatus: Array<{ title: string; trajectoryLabel: string; dateLabel: string; timeLabel: string }>
  snippets: ClientSnippet[]
  inputSummaries: ClientWrittenReport[]
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

function readInputClientId(session: ClientInput): string {
  return String((session as any).clientId || '')
}

function readSnippetLabels(snippet: { fields?: string[]; field?: string }): string[] {
  const labels = [
    ...(Array.isArray(snippet.fields) ? snippet.fields : []),
    String(snippet.field || '').trim(),
  ]
    .map((value) => String(value || '').trim())
    .filter((value, index, values) => value.length > 0 && values.indexOf(value) === index)
  return labels.length > 0 ? labels : ['general']
}

export function useClientChatbot({
  activeTrajectoryName,
  rightActiveTabKey,
  chatContextInputIds,
  chatScrollRef,
  client,
  clientId,
  clientName,
  onStatusFallbackText,
  reportCount,
  sessionCount,
  inputs,
  sessionItemsForStatus,
  snippets,
  inputSummaries,
}: Params) {
  const [composerText, setComposerText] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatStateMessage[]>([])
  const [isChatSending, setIsChatSending] = useState(false)
  const [isChatMinutesBlocked, setIsChatMinutesBlocked] = useState(false)
  const [isCheckingChatMinutes, setIsCheckingChatMinutes] = useState(false)
  const [isNoMinutesCtaDismissed, setIsNoMinutesCtaDismissed] = useState(false)
  const [statusSummaryAi, setStatusSummaryAi] = useState<string>('')
  const [isStatusSummaryLoading, setIsStatusSummaryLoading] = useState(false)

  const previousMessageCountRef = useRef(0)
  const shouldSkipChatSaveRef = useRef(false)
  const lastStatusSignatureRef = useRef<string | null>(null)

  const statusKnowledgeSignature = useMemo(() => {
    const clientInputs = inputs.filter((session) => readInputClientId(session) === clientId)
    const inputPart = clientInputs
      .map((session) => `${session.id}:${session.createdAtUnixMs}:${String(session.title || '')}`)
      .sort()
      .join('|')
    const snippetPart = snippets
      .filter((snippet) => snippet.status === 'approved')
      .filter((snippet) => {
        const itemId = String((snippet as any).itemId || '')
        return itemId.length > 0 && clientInputs.some((session) => session.id === itemId)
      })
      .map((snippet) => `${snippet.itemId}:${snippet.date}:${readSnippetLabels(snippet).join('|')}:${snippet.text}:${snippet.status}`)
      .sort()
      .join('|')
    const summaryPart = inputSummaries
      .filter((summary) => clientInputs.some((session) => session.id === summary.sessionId))
      .map((summary) => `${summary.sessionId}:${summary.updatedAtUnixMs}`)
      .sort()
      .join('|')
    return `${clientId}::${inputPart}::${snippetPart}::${summaryPart}`
  }, [clientId, inputs, inputSummaries, snippets])

  useEffect(() => {
    shouldSkipChatSaveRef.current = true
    const loadedMessages = loadChatBotForClient(clientId)
    setChatMessages(loadedMessages)
    previousMessageCountRef.current = loadedMessages.length
    setComposerText('')
    setIsChatSending(false)
    setStatusSummaryAi('')
    setIsStatusSummaryLoading(false)
    lastStatusSignatureRef.current = null
  }, [clientId])

  useEffect(() => {
    if (shouldSkipChatSaveRef.current) {
      shouldSkipChatSaveRef.current = false
      return
    }
    saveChatBotForClient(clientId, chatMessages)
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
    if (lastStatusSignatureRef.current === statusKnowledgeSignature) return

    let isCancelled = false
    async function generateStatus() {
      const inputsForClient = inputs
        .filter((session) => readInputClientId(session) === clientId)
        .sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
      const sessionById = new Map(inputsForClient.map((session) => [session.id, session]))

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
          field: readSnippetLabels(snippet).join(', '),
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
      for (const session of inputsForClient) {
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
      for (const report of inputSummaries) {
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
        const response = await sendClientPipelineChatMessage({
          clientId,
          messages: [
            {
              role: 'user',
              text:
                `Schrijf een korte, menselijk klinkende statusupdate over deze client in 2-3 volledige zinnen (max 90 woorden, zonder opsomming).\n` +
                `Vermijd droge telegramstijl; maak er een vloeiend mini-verhaal van op basis van de feiten.\n` +
                `Client: ${clientName}\n` +
                `Traject: ${activeTrajectoryName || 'Geen traject'}\n` +
                `Sessies: ${sessionCount}\n` +
                `Rapportages: ${reportCount}\n\n` +
                `Snippets gegroepeerd per inputdatum:\n${groupedSnippetsByInputDate || 'Geen snippets beschikbaar.'}\n\n` +
                `Laatste 5 items:\n${lastFiveTimeline || 'Geen items beschikbaar.'}`,
            },
          ],
        })
        if (!isCancelled) setStatusSummaryAi(response.answer.trim() || onStatusFallbackText)
        lastStatusSignatureRef.current = statusKnowledgeSignature
      } catch {
        if (!isCancelled) {
          setStatusSummaryAi(onStatusFallbackText)
          lastStatusSignatureRef.current = statusKnowledgeSignature
        }
      } finally {
        if (!isCancelled) setIsStatusSummaryLoading(false)
      }
    }

    void generateStatus()
    return () => {
      isCancelled = true
    }
  }, [
    activeTrajectoryName,
    rightActiveTabKey,
    clientId,
    clientName,
    onStatusFallbackText,
    reportCount,
    sessionCount,
    inputs,
    snippets,
    inputSummaries,
    sessionItemsForStatus,
    statusKnowledgeSignature,
  ])

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
    const assistantId = `assistant-stream-${Date.now()}`
    setChatMessages((previous) => [...previous, nextUserMessage, { id: assistantId, role: 'assistant', text: '' }])
    setComposerText('')
    setIsChatSending(true)

    try {
      if (!(await ensureSufficientChatMinutes())) {
        setIsChatSending(false)
        return
      }

      const response = await streamClientPipelineChatMessage({
        clientId,
        messages: nextChatMessages.map((message) => ({ role: message.role, text: message.text })),
        onDelta: (delta) => {
          setChatMessages((previous) =>
            previous.map((message) =>
              message.id === assistantId ? { ...message, text: `${message.text}${delta}` } : message,
            ),
          )
        },
      })

      setChatMessages((previous) =>
        previous.map((message) =>
          message.id === assistantId
            ? { ...message, text: response.answer.trim() || 'Ik kon hier geen antwoord op geven.' }
            : message,
        ),
      )
    } catch {
      setChatMessages((previous) =>
        previous.map((message) =>
          message.id === assistantId
            ? { ...message, text: 'Er ging iets mis bij het ophalen van het antwoord. Probeer het opnieuw.' }
            : message,
        ),
      )
    } finally {
      setIsChatSending(false)
    }
  }

  function resetChat() {
    setChatMessages([])
    setComposerText('')
    setIsChatSending(false)
    clearChatBotForClient(clientId)
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


