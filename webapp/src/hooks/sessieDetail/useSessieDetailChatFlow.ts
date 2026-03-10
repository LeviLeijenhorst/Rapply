import { useEffect, useRef, useState } from 'react'
import { Animated } from 'react-native'

import type { Template } from '../../storage/types'
import { fetchBillingStatus } from '../../api/billing/billingApi'
import { sendSessionChatMessage } from '../../api/chat/sendSessionChatPromptMessage'
import type { LocalChatMessage } from '../../api/chat/types'
import { generateSessionSummary } from '../../api/summaries/generateSessionSummaryFromTranscript'
import { clearQuickQuestionsChatForSession, loadQuickQuestionsChatForSession, saveQuickQuestionsChatForSession } from '../../storage/quickQuestionsChatStore'
import { buildConversationTranscriptSystemMessages } from '../../content/assistantContext'
import { type ChatStateMessage, createChatMessageId } from '../../types/chatState'

type QuickQuestionMessageInput = string | { text: string; promptText?: string; templateId?: string }

type Params = {
  buildSummaryInputWithContext: (sourceText: string) => string
  chatScrollRef: React.RefObject<any>
  noMinutesCtaOpacity: Animated.Value
  noMinutesCtaTranslateY: Animated.Value
  readRemainingTranscriptionSeconds: (status: {
    includedSeconds: number
    cycleUsedSeconds: number
    nonExpiringTotalSeconds: number
    nonExpiringUsedSeconds: number
  } | null) => number
  sessionId: string
  templatesForSession: Template[]
  transcript: string | null
  writtenReportText: string
}

function formatQuickQuestionSelectionText(text: string): string {
  const trimmed = String(text || '').trim()
  if (!trimmed) return ''
  if (trimmed.toLowerCase().startsWith('ik wil')) return trimmed
  return `Ik wil ${trimmed}`
}

function scrollChatToEnd(chatScrollRef: React.RefObject<any>) {
  const scrollView = chatScrollRef.current
  if (!scrollView) return
  setTimeout(() => {
    scrollView.scrollToEnd({ animated: true })
  }, 0)
}

export function useSessieDetailChatFlow({
  buildSummaryInputWithContext,
  chatScrollRef,
  noMinutesCtaOpacity,
  noMinutesCtaTranslateY,
  readRemainingTranscriptionSeconds,
  sessionId,
  templatesForSession,
  transcript,
  writtenReportText,
}: Params) {
  const [composerText, setComposerText] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatStateMessage[]>([])
  const [isChatSending, setIsChatSending] = useState(false)
  const [isChatMinutesBlocked, setIsChatMinutesBlocked] = useState(false)
  const [isCheckingChatMinutes, setIsCheckingChatMinutes] = useState(false)
  const [isNoMinutesCtaDismissed, setIsNoMinutesCtaDismissed] = useState(false)
  const [isClearChatModalVisible, setIsClearChatModalVisible] = useState(false)
  const previousMessageCountRef = useRef(chatMessages.length)
  const shouldSkipChatSaveRef = useRef(false)

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
    if (!isChatMinutesBlocked || isNoMinutesCtaDismissed) {
      noMinutesCtaOpacity.setValue(0)
      noMinutesCtaTranslateY.setValue(8)
      return
    }
    noMinutesCtaOpacity.setValue(0)
    noMinutesCtaTranslateY.setValue(8)
    Animated.parallel([
      Animated.timing(noMinutesCtaOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(noMinutesCtaTranslateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start()
  }, [isChatMinutesBlocked, isNoMinutesCtaDismissed, noMinutesCtaOpacity, noMinutesCtaTranslateY])

  useEffect(() => {
    if (isChatMinutesBlocked) return
    setIsNoMinutesCtaDismissed(false)
  }, [isChatMinutesBlocked])

  function resetChat() {
    setChatMessages([])
    setComposerText('')
    setIsChatSending(false)
    clearQuickQuestionsChatForSession(sessionId)
    scrollChatToEnd(chatScrollRef)
  }

  function requestResetChat() {
    setIsClearChatModalVisible(true)
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
      }
      return hasMinutes
    } catch (error) {
      console.error('[SessieDetailScreen] Failed to read billing status before chat send', error)
      return true
    } finally {
      setIsCheckingChatMinutes(false)
    }
  }

  async function sendChatMessage(messageInput: QuickQuestionMessageInput) {
    const visibleText = typeof messageInput === 'string' ? messageInput : formatQuickQuestionSelectionText(messageInput.text)
    const promptText = typeof messageInput === 'string' ? messageInput : messageInput.promptText
    const templateId = typeof messageInput === 'string' ? undefined : messageInput.templateId
    const isTemplatePrompt = typeof messageInput !== 'string' && Boolean(String(messageInput.promptText || '').trim())
    const trimmedText = visibleText.trim()
    const trimmedPromptText = String(promptText || '').trim() || trimmedText
    if (!trimmedText || !trimmedPromptText || isChatSending) return

    const pdfStartToken = '[[PDF_START]]'
    const pdfEndToken = '[[PDF_END]]'
    const systemMessage: LocalChatMessage = {
      role: 'system',
      text:
        'Deze chatbot bevindt zich onder het kopje "Snelle vragen". Loopbaan- en re-integratiecoaches gebruiken deze chat om korte, gerichte vragen te stellen over dit verslag op basis van de verslagcontext (zoals transcript en/of geschreven verslag). Gebruik alleen informatie uit dit verslag en uit de vraag van de gebruiker. Formuleer altijd in formeel en zakelijk Nederlands en spreek de gebruiker aan met "u". Uw antwoorden zijn duidelijk en beknopt. Geef geen lange uitleg, herhaal de vraag niet en voeg geen meta-uitleg toe. Gebruik geen emoji\'s. Gebruik nooit labels zoals "speaker_3" en gebruik geen andere termen voor sprekers dan "coach" of "cliënt". Maak nooit nieuwe actiepunten. Noem alleen actiepunten die expliciet in de verslagcontext of in de vraag van de gebruiker staan. Als er geen expliciete actiepunten zijn, zeg dat duidelijk en voeg niets nieuws toe. Wanneer u verwijst naar een specifiek moment in het transcript, gebruik dan de notatie [[timestamp=MM:SS|zichtbare tekst]]. MM:SS is het tijdstip in het transcript en de tekst na de | is de klikbare tekst zoals die in de zin wordt weergegeven. Verwerk deze verwijzing vloeiend in de zin en gebruik dit actief wanneer dat helpt om het antwoord concreet en controleerbaar te maken. Als het antwoord geschikt is om als PDF te downloaden, zet dan alleen de gewenste inhoud tussen deze twee regels. Gebruik exact deze regels op een eigen regel: ' +
        `${pdfStartToken} en ${pdfEndToken}. ` +
        'Plaats geen andere tekst tussen die regels dan de inhoud die in de PDF hoort. Zet alle overige uitleg buiten die blokken.',
    }
    const nextUserMessage: ChatStateMessage = {
      id: createChatMessageId(),
      role: 'user',
      text: trimmedText,
      promptText: trimmedPromptText,
    }

    const nextChatMessages = [...chatMessages, nextUserMessage]
    setChatMessages(nextChatMessages)
    setComposerText('')
    setIsChatSending(true)
    if (!(await ensureSufficientChatMinutes())) {
      setChatMessages((previousMessages) => previousMessages.filter((message) => message.id !== nextUserMessage.id))
      if (typeof messageInput === 'string') {
        setComposerText(trimmedText)
      }
      setIsChatSending(false)
      return
    }

    try {
      const transcriptSystemMessages = buildConversationTranscriptSystemMessages({
        transcript,
        writtenReportText,
        sessionId,
      })
      const selectedTemplateForChat = templateId ? templatesForSession.find((template) => template.id === templateId) ?? null : null
      if (isTemplatePrompt && selectedTemplateForChat) {
        const templateSections = selectedTemplateForChat.sections
          .map((section, index) => {
            const title = section.title.trim()
            const description = section.description.trim()
            if (!title && !description) return null
            return { title: title || `Onderdeel ${index + 1}`, description }
          })
          .filter((section): section is { title: string; description: string } => Boolean(section))
        const transcriptForTemplate = String(transcript || '').trim() || String(writtenReportText || '').trim()
        if (transcriptForTemplate) {
          const responseText = await generateSessionSummary({
            transcript: buildSummaryInputWithContext(transcriptForTemplate),
            template: templateSections.length > 0 ? { name: selectedTemplateForChat.name, sections: templateSections } : undefined,
          })
          setChatMessages((previousMessages) => [
            ...previousMessages,
            { id: createChatMessageId(), role: 'assistant', text: responseText },
          ])
          return
        }
      }
      const chatHistoryForModel = isTemplatePrompt ? [nextUserMessage] : nextChatMessages
      const responseText = await sendSessionChatMessage(
        chatHistoryForModel.map<LocalChatMessage>((message) => ({
          role: message.role,
          text: message.role === 'user' ? String(message.promptText || '').trim() || message.text : message.text,
        })),
        sessionId,
        [...transcriptSystemMessages, systemMessage],
      )
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

  async function handleSendChatMessage() {
    const trimmedText = composerText.trim()
    if (!trimmedText) return
    await sendChatMessage(trimmedText)
  }

  return {
    chatMessages,
    composerText,
    handleSendChatMessage,
    isChatMinutesBlocked,
    isChatSending,
    isCheckingChatMinutes,
    isClearChatModalVisible,
    isNoMinutesCtaDismissed,
    requestResetChat,
    resetChat,
    sendChatMessage,
    setComposerText,
    setIsClearChatModalVisible,
    setIsNoMinutesCtaDismissed,
  }
}




