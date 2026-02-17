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
import { ChatMessage, exportMessageToPdf } from '../components/sessionDetail/ChatMessage'
import { QuickQuestionsStart } from '../components/sessionDetail/QuickQuestionsStart'
import { ReportPanel } from '../components/sessionDetail/ReportPanel'
import { NotesTabPanel } from '../components/sessionDetail/NotesTabPanel'
import { TranscriptTabPanel } from '../components/sessionDetail/TranscriptTabPanel'
import { ConfirmTranscriptionCancelModal } from '../components/sessionDetail/ConfirmTranscriptionCancelModal'
import { TemplatePickerModal } from '../components/sessionDetail/TemplatePickerModal'
import { EditSessieModal } from '../components/sessionDetail/EditSessieModal'
import { WebPortal } from '../components/WebPortal'
import { AnimatedDropdownPanel } from '../components/AnimatedDropdownPanel'
import { useLocalAppData } from '../local/LocalAppDataProvider'
import { completeChat, LocalChatMessage } from '../services/chat'
import { generateSummary } from '../services/summary'
import { cancelTranscriptionOperation, isTranscriptionCancelledError, transcribeAudio } from '../services/transcription'
import {
  cancelTranscriptionRun,
  finishTranscriptionRun,
  isTranscriptionRunActive,
  setSummaryAbortController,
  setTranscriptionAbortController,
  setTranscriptionOperationId,
  startTranscriptionRun,
} from '../services/transcriptionRunStore'
import { loadAudioBlobRemote } from '../services/audioBlobs'
import { useE2ee } from '../e2ee/E2eeProvider'
import { downloadAudioStream } from '../audio/downloadAudioStream'
import { ChatStateMessage, createChatMessageId } from '../utils/chatState'
import {
  clearQuickQuestionsChatForSession,
  loadQuickQuestionsChatForSession,
  saveQuickQuestionsChatForSession,
} from '../local/quickQuestionsChatStore'
import { isUnassignedCoacheeName, unassignedCoacheeLabel } from '../utils/coachee'
import { ConfirmSessieDeleteModal } from '../components/sessies/ConfirmSessieDeleteModal'
import { buildConversationTranscriptSystemMessages } from '../utils/quickQuestionsContext'
import {
  clearPendingPreviewAudio,
  clearPendingPreviewAudioIfEligible,
  getPendingPreviewAudio,
  getPendingPreviewAudioForTranscription,
  getPendingPreviewShouldSaveAudio,
  markPendingPreviewTranscriptionSucceeded,
  retainPendingPreviewAudio,
} from '../audio/pendingPreviewStore'
import { RichTextEditorModal } from '../components/editor/RichTextEditorModal'
import { normalizeTranscriptionError } from '../utils/transcriptionError'
import { ConfirmChatClearModal } from '../components/sessionDetail/ConfirmChatClearModal'

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
  const hasSavedAudio = Boolean(String(session?.audioBlobId || '').trim())

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
  const [isClearChatModalVisible, setIsClearChatModalVisible] = useState(false)
  const [pendingPreviewAudioUrl, setPendingPreviewAudioUrl] = useState<string | null>(null)
  const [pendingPreviewShouldSaveAudio, setPendingPreviewShouldSaveAudio] = useState<boolean | null>(null)
  const [currentAudioSeconds, setCurrentAudioSeconds] = useState(0)
  const [isSummaryEditorOpen, setIsSummaryEditorOpen] = useState(false)
  const [forcedTranscriptionStatus, setForcedTranscriptionStatus] = useState<'transcribing' | 'generating' | null>(null)
  const [isPdfEditorOpen, setIsPdfEditorOpen] = useState(false)
  const [pdfEditorDraft, setPdfEditorDraft] = useState('')
  const [pdfEditorTitle, setPdfEditorTitle] = useState<string | undefined>(undefined)
  const [isCancelTranscriptionModalVisible, setIsCancelTranscriptionModalVisible] = useState(false)
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false)
  const [isDeletingAudio, setIsDeletingAudio] = useState(false)

  const coacheeButtonRef = useRef<any>(null)
  const templates = data.templates ?? []
  const practiceTintColor = data.practiceSettings.tintColor || colors.selected
  const defaultTemplateId = useMemo(() => {
    const standardTemplate = templates.find((template) => template.name.toLowerCase() === 'standaard samenvatting')
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
  const effectiveTranscriptionStatus = forcedTranscriptionStatus ?? (session?.transcriptionStatus ?? 'idle')
  const shouldShowQuickStart = chatMessages.length === 0
  const shouldShowClearChat = chatMessages.length > 0
  const shouldUseTranscriptTint = hasSavedAudio || pendingPreviewShouldSaveAudio === true
  const chatOverlayOpacity = useRef(new Animated.Value(0)).current
  const chatOverlayScale = useRef(new Animated.Value(0.98)).current
  const previousMessageCountRef = useRef(chatMessages.length)
  const shouldSkipChatSaveRef = useRef(false)
  const generationRunIdRef = useRef(0)
  const generationSnapshotRef = useRef<{
    transcript: string | null
    summary: string | null
    transcriptionStatus: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
    transcriptionError: string | null
  } | null>(null)

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
    const releaseRetention = retainPendingPreviewAudio(sessionId)
    let isCancelled = false
    let nextUrl: string | null = null

    void (async () => {
      const shouldSaveAudio = await getPendingPreviewShouldSaveAudio(sessionId)
      if (isCancelled) return
      setPendingPreviewShouldSaveAudio(shouldSaveAudio)
      const pendingPreview = await getPendingPreviewAudio(sessionId)
      if (isCancelled) return
      if (!pendingPreview) {
        setPendingPreviewAudioUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous)
          return null
        })
        return
      }
      nextUrl = URL.createObjectURL(pendingPreview)
      setPendingPreviewAudioUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return nextUrl
      })
    })()

    return () => {
      isCancelled = true
      if (nextUrl) URL.revokeObjectURL(nextUrl)
      releaseRetention()
    }
  }, [sessionId])

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

  function requestResetChat() {
    setIsClearChatModalVisible(true)
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
      'Deze chatbot bevindt zich onder het kopje "Snelle vragen" binnen CoachScribe. Coaches gebruiken deze chat om korte, gerichte vragen te stellen over deze sessie op basis van het transcript. Gebruik alleen informatie uit deze sessie en uit de vraag van de gebruiker. Je antwoorden zijn altijd duidelijk en beknopt. Geef geen lange uitleg, herhaal de vraag niet en voeg geen meta-uitleg toe. Gebruik geen emoji\'s. Gebruik nooit labels zoals "speaker_3" en gebruik geen andere termen voor sprekers dan "coach" of "coachee". Maak nooit nieuwe actiepunten. Noem alleen actiepunten die expliciet in het transcript of in de vraag van de gebruiker staan. Als er geen expliciete actiepunten zijn, zeg dat duidelijk en voeg niets nieuws toe. Wanneer je verwijst naar een specifiek moment in het transcript, gebruik dan de notatie [[timestamp=MM:SS|zichtbare tekst]]. MM:SS is het tijdstip in het transcript en de tekst na de | is de klikbare tekst zoals die in de zin wordt weergegeven. Verwerk deze verwijzing vloeiend in de zin en gebruik dit actief wanneer dat helpt om het antwoord concreet en controleerbaar te maken. Als het antwoord geschikt is om als PDF te downloaden, zet dan alleen de gewenste inhoud tussen deze twee regels. Gebruik exact deze regels op een eigen regel: ' +
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
      const transcriptSystemMessages = buildConversationTranscriptSystemMessages({
        transcript: session?.transcript ?? null,
        sessionId,
      })
      const responseText = await completeChat({
        scope: 'session',
        sessionId,
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

  function handleRequestPdfEdit(params: { text: string; title?: string }) {
    setPdfEditorDraft(params.text)
    setPdfEditorTitle(params.title)
    setIsPdfEditorOpen(true)
  }

  function beginGenerationRun() {
    const runId = startTranscriptionRun(sessionId)
    generationRunIdRef.current = runId
    generationSnapshotRef.current = {
      transcript: session?.transcript ?? null,
      summary: session?.summary ?? null,
      transcriptionStatus: session?.transcriptionStatus ?? 'idle',
      transcriptionError: session?.transcriptionError ?? null,
    }
    return runId
  }

  function isGenerationRunActive(runId: number) {
    return generationRunIdRef.current === runId && isTranscriptionRunActive(sessionId, runId)
  }

  function clearGenerationTracking() {
    setForcedTranscriptionStatus(null)
    finishTranscriptionRun(sessionId, generationRunIdRef.current)
    generationSnapshotRef.current = null
  }

  async function cancelCurrentGeneration() {
    const cancelledRun = cancelTranscriptionRun(sessionId)
    generationRunIdRef.current += 1
    const operationId = cancelledRun.operationId
    if (operationId) {
      try {
        await cancelTranscriptionOperation({ operationId })
      } catch (error) {
        console.warn('[SessieDetailScreen] Failed to cancel transcription operation', { sessionId, operationId, error })
      }
    }

    const previousSnapshot = generationSnapshotRef.current
    if (previousSnapshot) {
      updateSession(sessionId, {
        transcript: previousSnapshot.transcript,
        summary: previousSnapshot.summary,
        transcriptionStatus: previousSnapshot.transcriptionStatus === 'error' ? 'idle' : previousSnapshot.transcriptionStatus,
        transcriptionError: null,
      })
    } else {
      updateSession(sessionId, {
        transcriptionStatus: hasTranscript ? 'done' : 'idle',
        transcriptionError: null,
      })
    }

    clearGenerationTracking()
  }

  async function handleCancelGeneration() {
    if (pendingPreviewShouldSaveAudio === false) {
      setIsCancelTranscriptionModalVisible(true)
      return
    }
    await cancelCurrentGeneration()
  }

  async function handleConfirmCancelTranscription() {
    setIsCancelTranscriptionModalVisible(false)
    const cancelledRun = cancelTranscriptionRun(sessionId)
    generationRunIdRef.current += 1
    const operationId = cancelledRun.operationId
    if (operationId) {
      try {
        await cancelTranscriptionOperation({ operationId })
      } catch (error) {
        console.warn('[SessieDetailScreen] Failed to cancel transcription operation', { sessionId, operationId, error })
      }
    }
    await clearPendingPreviewAudio(sessionId)
    clearQuickQuestionsChatForSession(sessionId)
    deleteSession(sessionId)
    onBack()
  }

  async function loadDecryptedSessionAudio(audioId: string): Promise<{ audioBlob: Blob; mimeType: string }> {
    try {
      const storedAudio = await loadAudioBlobRemote(audioId)
      if (!storedAudio) {
        throw new Error('Audio blob not found')
      }
      const decryptedBlob = await e2ee.decryptAudioBlobFromStorage(storedAudio.blob)
      return { audioBlob: decryptedBlob.audioBlob, mimeType: decryptedBlob.mimeType }
    } catch (blobError) {
      console.warn('[transcription] Blob load failed for session audio, trying stream fallback', {
        sessionId,
        audioId,
        error: blobError,
      })
      return downloadAudioStream({
        audioStreamId: audioId,
        decryptChunk: (encryptedChunk) => e2ee.decryptAudioChunkFromStorage({ encryptedChunk }),
      })
    }
  }

  async function loadAudioForTranscription(): Promise<{ audioBlob: Blob; mimeType: string }> {
    const audioId = String(session?.audioBlobId || '').trim()
    if (audioId) {
      return loadDecryptedSessionAudio(audioId)
    }
    const pendingPreview = await getPendingPreviewAudioForTranscription(sessionId)
    if (pendingPreview) {
      return {
        audioBlob: pendingPreview.blob,
        mimeType: pendingPreview.mimeType,
      }
    }
    throw new Error('Geen audio beschikbaar om een transcript te maken.')
  }

  function normalizeAudioExtensionFromMimeType(mimeType: string): string {
    const normalized = String(mimeType || '').toLowerCase()
    if (normalized.includes('wav')) return 'wav'
    if (normalized.includes('ogg') || normalized.includes('opus')) return 'ogg'
    if (normalized.includes('webm')) return 'webm'
    if (normalized.includes('mpeg') || normalized.includes('mp3')) return 'mp3'
    if (normalized.includes('mp4') || normalized.includes('m4a') || normalized.includes('aac')) return 'm4a'
    return 'mp3'
  }

  function buildSavedAudioDownloadFileName(mimeType: string): string {
    const extension = normalizeAudioExtensionFromMimeType(mimeType)
    const safeTitle = String(editableSessionTitle || '')
      .trim()
      .replace(/[^a-z0-9_-]+/gi, '_')
      .replace(/^_+|_+$/g, '')
    return `${safeTitle || 'sessie-audio'}.${extension}`
  }

  async function handleDownloadSavedAudio() {
    const audioId = String(session?.audioBlobId || '').trim()
    if (!audioId) return
    if (isDownloadingAudio) return
    setIsDownloadingAudio(true)
    try {
      const decryptedAudio = await loadDecryptedSessionAudio(audioId)
      if (typeof window === 'undefined') return
      const objectUrl = URL.createObjectURL(decryptedAudio.audioBlob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = buildSavedAudioDownloadFileName(decryptedAudio.mimeType)
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (error) {
      console.error('[SessieDetailScreen] Failed to download saved audio', { sessionId, error })
    } finally {
      setIsDownloadingAudio(false)
    }
  }

  async function handleDeleteSavedAudio() {
    const audioId = String(session?.audioBlobId || '').trim()
    if (!audioId) return
    if (isDeletingAudio) return
    if (effectiveTranscriptionStatus === 'transcribing' || effectiveTranscriptionStatus === 'generating') return
    setIsDeletingAudio(true)
    try {
      updateSession(sessionId, {
        audioBlobId: null,
        audioDurationSeconds: null,
      })
      await clearPendingPreviewAudio(sessionId)
    } catch (error) {
      console.error('[SessieDetailScreen] Failed to remove saved audio', { sessionId, error })
    } finally {
      setIsDeletingAudio(false)
    }
  }

  async function retryTranscription() {
    if (session?.transcriptionStatus === 'transcribing' || session?.transcriptionStatus === 'generating') return

    const runId = beginGenerationRun()
    const transcriptionAbortController = new AbortController()
    setTranscriptionAbortController(sessionId, runId, transcriptionAbortController)
    setForcedTranscriptionStatus('transcribing')

    try {
      updateSession(sessionId, { transcriptionStatus: 'transcribing', transcriptionError: null, summary: null })
      console.log('[transcription][retry] audio-download-start', { sessionId, audioId: session?.audioBlobId ?? null })
      const decrypted = await loadAudioForTranscription()
      if (!isGenerationRunActive(runId)) return
      console.log('[transcription][retry] audio-download-done', {
        sessionId,
        mimeType: decrypted.mimeType,
        audioBytes: decrypted.audioBlob.size,
      })

      console.log('[transcription][retry] transcribe-start', { sessionId })
      const { transcript, summary } = await transcribeAudio({
        audioBlob: decrypted.audioBlob,
        mimeType: decrypted.mimeType,
        languageCode: 'nl',
        signal: transcriptionAbortController.signal,
        progress: {
          onOperationPrepared: (operationId) => {
            if (!isGenerationRunActive(runId)) return
            setTranscriptionOperationId(sessionId, runId, operationId)
          },
        },
      })
      if (!isGenerationRunActive(runId)) return
      setTranscriptionAbortController(sessionId, runId, null)
      console.log('[transcription][retry] transcript-received', {
        sessionId,
        transcriptLength: transcript.length,
        hasSummary: Boolean(String(summary || '').trim()),
      })
      const cleanedSummary = String(summary || '').trim()
      if (cleanedSummary) {
        updateSession(sessionId, {
          transcript,
          summary: cleanedSummary,
          transcriptionStatus: 'done',
          transcriptionError: null,
        })
        await markPendingPreviewTranscriptionSucceeded(sessionId)
        await clearPendingPreviewAudioIfEligible(sessionId)
        clearGenerationTracking()
      } else {
        const summaryAbortController = new AbortController()
        setSummaryAbortController(sessionId, runId, summaryAbortController)
        setForcedTranscriptionStatus('generating')
        console.log('[transcription][retry] summary-generate-start', { sessionId })
        updateSession(sessionId, {
          transcript,
          transcriptionStatus: 'generating',
          transcriptionError: null,
          summary: null,
        })
        const generatedSummary = await generateSummary({ transcript, template: summaryTemplate, signal: summaryAbortController.signal })
        if (!isGenerationRunActive(runId)) return
        updateSession(sessionId, {
          summary: generatedSummary,
          transcriptionStatus: 'done',
          transcriptionError: null,
        })
        await markPendingPreviewTranscriptionSucceeded(sessionId)
        await clearPendingPreviewAudioIfEligible(sessionId)
        console.log('[transcription][retry] summary-generate-done', { sessionId, summaryLength: generatedSummary.length })
        clearGenerationTracking()
      }
    } catch (error) {
      if (!isGenerationRunActive(runId)) return
      if (isTranscriptionCancelledError(error)) {
        return
      }
      console.error('[SessieDetailScreen] Transcription retry failed:', error)
      updateSession(sessionId, {
        transcriptionStatus: 'error',
        transcriptionError: normalizeTranscriptionError(error),
      })
      clearGenerationTracking()
    }
  }

  async function generateReportForTemplate(templateId: string) {
    if (session?.transcriptionStatus === 'transcribing' || session?.transcriptionStatus === 'generating') return
    const runId = beginGenerationRun()
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
      const transcriptionAbortController = new AbortController()
      setTranscriptionAbortController(sessionId, runId, transcriptionAbortController)
      let transcript = String(session?.transcript || '').trim()
      if (!transcript) {
        setForcedTranscriptionStatus('transcribing')
        console.log('[transcription][report] audio-download-start', { sessionId, audioId: session?.audioBlobId ?? null })
        const decrypted = await loadAudioForTranscription()
        if (!isGenerationRunActive(runId)) return
        updateSession(sessionId, { transcriptionStatus: 'transcribing', transcriptionError: null, summary: null })
        console.log('[transcription][report] audio-download-done', {
          sessionId,
          mimeType: decrypted.mimeType,
          audioBytes: decrypted.audioBlob.size,
        })
        console.log('[transcription][report] transcribe-start', { sessionId })
        const transcription = await transcribeAudio({
          audioBlob: decrypted.audioBlob,
          mimeType: decrypted.mimeType,
          languageCode: 'nl',
          signal: transcriptionAbortController.signal,
          progress: {
            onOperationPrepared: (operationId) => {
              if (!isGenerationRunActive(runId)) return
              setTranscriptionOperationId(sessionId, runId, operationId)
            },
          },
        })
        if (!isGenerationRunActive(runId)) return
        setTranscriptionAbortController(sessionId, runId, null)
        transcript = String(transcription.transcript || '').trim()
        console.log('[transcription][report] transcript-received', { sessionId, transcriptLength: transcript.length })
        if (!transcript) {
          throw new Error('No transcript returned')
        }
        updateSession(sessionId, { transcript })
        await markPendingPreviewTranscriptionSucceeded(sessionId)
        await clearPendingPreviewAudioIfEligible(sessionId)
      }

      const summaryAbortController = new AbortController()
      setSummaryAbortController(sessionId, runId, summaryAbortController)
      setForcedTranscriptionStatus('generating')
      updateSession(sessionId, { transcriptionStatus: 'generating', transcriptionError: null, summary: null })
      console.log('[transcription][report] summary-generate-start', { sessionId })
      const summary = await generateSummary({
        transcript,
        template: templateForSummary && templateForSummary.sections.length > 0 ? templateForSummary : undefined,
        signal: summaryAbortController.signal,
      })
      if (!isGenerationRunActive(runId)) return
      updateSession(sessionId, {
        summary,
        transcriptionStatus: 'done',
        transcriptionError: null,
      })
      console.log('[transcription][report] summary-generate-done', { sessionId, summaryLength: summary.length })
      clearGenerationTracking()
    } catch (error) {
      if (!isGenerationRunActive(runId)) return
      if (isTranscriptionCancelledError(error)) {
        return
      }
      console.error('[SessieDetailScreen] Report generation failed', error)
      updateSession(sessionId, {
        transcriptionStatus: 'error',
        transcriptionError: normalizeTranscriptionError(error),
      })
      clearGenerationTracking()
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
              {hasSavedAudio || pendingPreviewAudioUrl ? (
                <View style={styles.audioCardSection}>
                  <AudioPlayerCard
                    ref={audioPlayerRef}
                    audioBlobId={session?.audioBlobId ?? null}
                    audioDurationSeconds={session?.audioDurationSeconds ?? null}
                    audioUrlOverride={pendingPreviewAudioUrl}
                    onCurrentSecondsChange={setCurrentAudioSeconds}
                    onDownloadAudio={() => {
                      void handleDownloadSavedAudio()
                    }}
                    onDeleteAudio={() => {
                      void handleDeleteSavedAudio()
                    }}
                    isDownloadAudioBusy={isDownloadingAudio}
                    isDownloadAudioDisabled={!hasSavedAudio}
                    isDeleteAudioBusy={isDeletingAudio}
                    isDeleteAudioDisabled={!hasSavedAudio || effectiveTranscriptionStatus === 'transcribing' || effectiveTranscriptionStatus === 'generating'}
                  />
                </View>
              ) : null}
              {/* Report */}
                <View style={styles.reportCard}>
                  <ReportPanel
                    templateLabel={selectedTemplateLabel}
                    onPressTemplate={hasTranscript ? () => setIsTemplatePickerModalVisible(true) : undefined}
                    isCompact
                    summary={session?.summary ?? null}
                    hasTranscript={hasTranscript}
                    transcriptionStatus={effectiveTranscriptionStatus}
                    transcriptionError={session?.transcriptionError ?? null}
                    onEditSummary={() => setIsSummaryEditorOpen(true)}
                    onRetryTranscription={() => (selectedTemplateId ? generateReportForTemplate(selectedTemplateId) : null)}
                    onCancelGeneration={handleCancelGeneration}
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
                      onPress={requestResetChat}
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
                                exportTitle={editableSessionTitle}
                                onRequestPdfEdit={({ text, title }) => handleRequestPdfEdit({ text, title })}
                              />
                            ))}
                            {isChatSending ? (
                              <ChatMessage role="assistant" text="" isLoading onTranscriptMentionPress={handleTranscriptMentionPress} exportTitle={editableSessionTitle} />
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
                    <NotesTabPanel sessionId={sessionId} shouldFillAvailableHeight={false} />
                  ) : null}
                  {activeTabKey === 'volledigeSessie' ? (
                    <TranscriptTabPanel
                      searchValue={transcriptSearchText}
                      onChangeSearchValue={setTranscriptSearchText}
                      shouldFillAvailableHeight={false}
                      transcript={session?.transcript ?? null}
                      transcriptionStatus={effectiveTranscriptionStatus}
                      transcriptionError={session?.transcriptionError ?? null}
                      onSeekToSeconds={(seconds) => audioPlayerRef.current?.seekToSeconds(seconds)}
                      onRetryTranscription={retryTranscription}
                      onCancelGeneration={handleCancelGeneration}
                      currentAudioSeconds={currentAudioSeconds}
                      highlightTintColor={practiceTintColor}
                      useTintColors={shouldUseTranscriptTint}
                      audioDurationSeconds={session?.audioDurationSeconds ?? null}
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
                {hasSavedAudio || pendingPreviewAudioUrl ? (
                  <View style={styles.audioCardSection}>
                    <AudioPlayerCard
                      ref={audioPlayerRef}
                      audioBlobId={session?.audioBlobId ?? null}
                      audioDurationSeconds={session?.audioDurationSeconds ?? null}
                      audioUrlOverride={pendingPreviewAudioUrl}
                      onCurrentSecondsChange={setCurrentAudioSeconds}
                      onDownloadAudio={() => {
                        void handleDownloadSavedAudio()
                      }}
                      onDeleteAudio={() => {
                        void handleDeleteSavedAudio()
                      }}
                      isDownloadAudioBusy={isDownloadingAudio}
                      isDownloadAudioDisabled={!hasSavedAudio}
                      isDeleteAudioBusy={isDeletingAudio}
                      isDeleteAudioDisabled={!hasSavedAudio || effectiveTranscriptionStatus === 'transcribing' || effectiveTranscriptionStatus === 'generating'}
                    />
                  </View>
                ) : null}
                {/* Report card */}
                <View style={styles.reportCard}>
                  <ReportPanel
                    templateLabel={selectedTemplateLabel}
                    onPressTemplate={hasTranscript ? () => setIsTemplatePickerModalVisible(true) : undefined}
                    isCompact={isCompactLayout}
                    summary={session?.summary ?? null}
                    hasTranscript={hasTranscript}
                    transcriptionStatus={effectiveTranscriptionStatus}
                    transcriptionError={session?.transcriptionError ?? null}
                    onEditSummary={() => setIsSummaryEditorOpen(true)}
                    onRetryTranscription={() => (selectedTemplateId ? generateReportForTemplate(selectedTemplateId) : null)}
                    onCancelGeneration={handleCancelGeneration}
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
                                exportTitle={editableSessionTitle}
                                onRequestPdfEdit={({ text, title }) => handleRequestPdfEdit({ text, title })}
                              />
                            ))}
                            {isChatSending ? (
                              <ChatMessage role="assistant" text="" isLoading onTranscriptMentionPress={handleTranscriptMentionPress} exportTitle={editableSessionTitle} />
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

                  {activeTabKey === 'notities' ? <NotesTabPanel sessionId={sessionId} /> : null}

                  {activeTabKey === 'volledigeSessie' ? (
                    <TranscriptTabPanel
                      searchValue={transcriptSearchText}
                      onChangeSearchValue={setTranscriptSearchText}
                      transcript={session?.transcript ?? null}
                      transcriptionStatus={effectiveTranscriptionStatus}
                      transcriptionError={session?.transcriptionError ?? null}
                      onSeekToSeconds={(seconds) => audioPlayerRef.current?.seekToSeconds(seconds)}
                      onRetryTranscription={retryTranscription}
                      onCancelGeneration={handleCancelGeneration}
                      currentAudioSeconds={currentAudioSeconds}
                      highlightTintColor={practiceTintColor}
                      useTintColors={shouldUseTranscriptTint}
                      audioDurationSeconds={session?.audioDurationSeconds ?? null}
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

      <RichTextEditorModal
        visible={isSummaryEditorOpen}
        title="Samenvatting bewerken"
        initialValue={session?.summary ?? ''}
        onClose={() => setIsSummaryEditorOpen(false)}
        onSave={(value) => {
          updateSession(sessionId, {
            summary: value,
            transcriptionStatus: value ? 'done' : session?.transcriptionStatus ?? 'done',
            transcriptionError: null,
          })
          setIsSummaryEditorOpen(false)
        }}
      />

      <RichTextEditorModal
        visible={isPdfEditorOpen}
        title="PDF bewerken"
        initialValue={pdfEditorDraft}
        saveLabel="Exporteer PDF"
        onClose={() => setIsPdfEditorOpen(false)}
        onSave={(value) => {
          void exportMessageToPdf(value, pdfEditorTitle, {
            practiceName: data.practiceSettings.practiceName,
            website: data.practiceSettings.website,
            tintColor: data.practiceSettings.tintColor,
            logoDataUrl: data.practiceSettings.logoDataUrl,
          })
          setIsPdfEditorOpen(false)
        }}
      />

      <ConfirmTranscriptionCancelModal
        visible={isCancelTranscriptionModalVisible}
        onClose={() => setIsCancelTranscriptionModalVisible(false)}
        onConfirm={() => {
          void handleConfirmCancelTranscription()
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
                          exportTitle={editableSessionTitle}
                          onRequestPdfEdit={({ text, title }) => handleRequestPdfEdit({ text, title })}
                        />
                      ))}
                      {isChatSending ? (
                        <ChatMessage role="assistant" text="" isLoading onTranscriptMentionPress={handleTranscriptMentionPress} exportTitle={editableSessionTitle} />
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
            <ScrollView style={styles.coacheeMenuScroll} contentContainerStyle={styles.coacheeMenuScrollContent} showsVerticalScrollIndicator={false}>
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
            </ScrollView>
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
  coacheeMenuScroll: {
    maxHeight: 48 * 7,
  },
  coacheeMenuScrollContent: {
    paddingVertical: 0,
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
  audioCardSection: {
    width: '100%',
    gap: 8,
  },
  audioActionsRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  audioActionButton: {
    height: 34,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  audioActionButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  audioActionButtonDisabled: {
    opacity: 0.55,
  },
  audioActionButtonText: {
    fontSize: 13,
    lineHeight: 16,
    color: colors.textStrong,
  },
  audioDangerButton: {
    height: 34,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4EE',
    borderWidth: 1,
    borderColor: '#E8C2AE',
  },
  audioDangerButtonHovered: {
    backgroundColor: '#FFE7DB',
  },
  audioDangerButtonText: {
    fontSize: 13,
    lineHeight: 16,
    color: '#B85C2A',
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

