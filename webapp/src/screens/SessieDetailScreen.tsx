import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'

import { AnimatedMainContent } from '../components/AnimatedMainContent'
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon'
import { AanpassenIcon } from '../components/icons/AanpassenIcon'
import { CoacheeAvatarIcon } from '../components/icons/CoacheeAvatarIcon'
import { CalendarCircleIcon } from '../components/icons/CalendarCircleIcon'
import { FullScreenOpenIcon } from '../components/icons/FullScreenOpenIcon'
import { FullScreenCloseIcon } from '../components/icons/FullScreenCloseIcon'
import { CircleCloseIcon } from '../components/icons/CircleCloseIcon'
import { Text } from '../components/Text'
import { colors } from '../theme/colors'
import { ConversationTabs, ConversationTabKey } from '../components/sessionDetail/ConversationTabs'
import { AudioPlayerCard, type AudioPlayerHandle } from '../components/sessionDetail/AudioPlayerCard'
import { ChatComposer } from '../components/sessionDetail/ChatComposer'
import { ChatMessage, exportMessageToPdf, exportMessageToWord } from '../components/sessionDetail/ChatMessage'
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
import { isGespreksverslagTemplate } from '../utils/templateCategories'
import { ConfirmChatClearModal } from '../components/sessionDetail/ConfirmChatClearModal'
import { AnimatedOverlayModal } from '../components/AnimatedOverlayModal'
import { fetchBillingStatus, type BillingStatus } from '../services/billing'
import { ReportContextModal } from '../components/sessionDetail/ReportContextModal'
import { useToast } from '../toast/ToastProvider'

type Props = {
  sessionId: string
  title: string
  coacheeName: string
  dateLabel: string
  onBack: () => void
  onOpenNewCoachee: () => void
  onOpenMySubscription: () => void
  onChangeCoachee: (coacheeId: string | null) => void
  newlyCreatedCoacheeName?: string | null
  onNewlyCreatedCoacheeHandled?: () => void
}

function normalizeTemplateMatchValue(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function getTemplateDisplayName(name: string): string {
  const normalizedName = String(name || '').trim().toLowerCase()
  if (normalizedName === 'intake' || normalizedName === 'intakeverslag') return 'Intake'
  return name
}

function inferTemplateIdFromSessionTitle(
  title: string | null | undefined,
  templates: { id: string; name: string }[],
): string | null {
  const normalizedTitle = normalizeTemplateMatchValue(title || '')
  if (!normalizedTitle) return null
  let bestMatch: { id: string; score: number } | null = null
  for (const template of templates) {
    const normalizedTemplateName = normalizeTemplateMatchValue(template.name)
    if (!normalizedTemplateName) continue
    let score = 0
    if (normalizedTitle === normalizedTemplateName) score = 2000 + normalizedTemplateName.length
    else if (normalizedTitle.includes(normalizedTemplateName)) score = 1000 + normalizedTemplateName.length
    else if (normalizedTemplateName.includes(normalizedTitle)) score = 500 + normalizedTitle.length
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { id: template.id, score }
    }
  }
  return bestMatch?.score ? bestMatch.id : null
}

type TemplatePickerIntent = 'generate' | 'write'
type CalendarCell = {
  isoDate: string
  dayOfMonth: number
  inCurrentMonth: boolean
}

const emptyTemplateOptionId = '__empty_template__'
const dayLabels = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
const missingCoacheeGenerateError = 'Wijs dit verslag eerst aan een cliënt toe om het te genereren.'

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function toIsoDate(value: Date): string {
  return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`
}

function formatDateToInput(value: Date): string {
  return `${pad2(value.getDate())}/${pad2(value.getMonth() + 1)}/${value.getFullYear()}`
}

function parseDateInput(value: string): Date | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null
  const candidate = new Date(year, month - 1, day)
  if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return null
  return candidate
}

function clampDateDigits(digits: string, fallbackYear: number): string {
  if (digits.length === 0) return digits
  const rawDay = digits.slice(0, Math.min(2, digits.length))
  const rawMonth = digits.length > 2 ? digits.slice(2, Math.min(4, digits.length)) : ''
  const rawYear = digits.length > 4 ? digits.slice(4) : ''

  let day = rawDay
  if (rawDay.length === 2) {
    const dayNumber = Number(rawDay)
    if (Number.isFinite(dayNumber)) {
      let maxDay = 31
      if (rawMonth.length === 2) {
        const monthNumber = Number(rawMonth)
        if (monthNumber >= 1 && monthNumber <= 12) {
          const yearForCalc = rawYear.length === 4 ? Number(rawYear) : fallbackYear
          maxDay = new Date(yearForCalc, monthNumber, 0).getDate()
        }
      }
      day = pad2(Math.max(1, Math.min(dayNumber, maxDay)))
    }
  }

  let month = rawMonth
  if (rawMonth.length === 2) {
    const monthNumber = Number(rawMonth)
    if (Number.isFinite(monthNumber)) {
      month = pad2(Math.max(1, Math.min(monthNumber, 12)))
    }
  }

  if (day.length === 2 && month.length === 2) {
    const dayNumber = Number(day)
    const monthNumber = Number(month)
    if (Number.isFinite(dayNumber) && Number.isFinite(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
      const yearForCalc = rawYear.length === 4 ? Number(rawYear) : fallbackYear
      const maxDay = new Date(yearForCalc, monthNumber, 0).getDate()
      day = pad2(Math.max(1, Math.min(dayNumber, maxDay)))
    }
  }

  return `${day}${month}${rawYear}`.slice(0, 8)
}

function formatTypingDateInput(raw: string, previousValue: string): string {
  const fallbackYear = new Date().getFullYear()
  const previousDigits = previousValue.replace(/\D/g, '').slice(0, 8)
  const rawDigits = raw.replace(/\D/g, '').slice(0, 8)
  const digits = clampDateDigits(rawDigits, fallbackYear)
  const isDeleting = rawDigits.length < previousDigits.length
  const endsAtSecondSeparator = previousValue.endsWith('/') && rawDigits.length === previousDigits.length

  if (isDeleting && endsAtSecondSeparator) {
    const digitsWithoutMonth = digits.slice(0, 2)
    return digitsWithoutMonth.length === 2 ? `${digitsWithoutMonth}/` : digitsWithoutMonth
  }

  if (isDeleting && previousValue.endsWith('/') && previousDigits.length === 2 && rawDigits.length === 2) {
    return digits
  }

  if (digits.length <= 2) return digits.length === 2 ? `${digits}/` : digits
  if (digits.length <= 4) {
    const monthPart = digits.slice(2)
    return digits.length === 4 ? `${digits.slice(0, 2)}/${monthPart}/` : `${digits.slice(0, 2)}/${monthPart}`
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function getCalendarCells(monthDate: Date): CalendarCell[] {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const startWeekday = (firstDayOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPreviousMonth = new Date(year, month, 0).getDate()
  const cells: CalendarCell[] = []

  for (let index = 0; index < 42; index += 1) {
    const dayOffset = index - startWeekday + 1
    let currentDate: Date
    let inCurrentMonth = true
    if (dayOffset <= 0) {
      currentDate = new Date(year, month - 1, daysInPreviousMonth + dayOffset)
      inCurrentMonth = false
    } else if (dayOffset > daysInMonth) {
      currentDate = new Date(year, month + 1, dayOffset - daysInMonth)
      inCurrentMonth = false
    } else {
      currentDate = new Date(year, month, dayOffset)
    }
    cells.push({ isoDate: toIsoDate(currentDate), dayOfMonth: currentDate.getDate(), inCurrentMonth })
  }

  return cells
}

function formatSessionDate(createdAtUnixMs: number): string {
  const date = new Date(createdAtUnixMs)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('nl-NL')
}

export function SessieDetailScreen({
  sessionId,
  title,
  coacheeName,
  dateLabel,
  onBack,
  onOpenNewCoachee,
  onOpenMySubscription,
  onChangeCoachee,
  newlyCreatedCoacheeName,
  onNewlyCreatedCoacheeHandled,
}: Props) {
  const { width } = useWindowDimensions()
  const isVerySmallLayout = width < 860
  const isMobileLayout = width < 760
  const isHeaderActionButtonsCompact = width < 990
  const hideDate = width < 930
  const { data, deleteSession, setWrittenReport, updateSession } = useLocalAppData()
  const { showErrorToast } = useToast()
  const e2ee = useE2ee()
  const session = data.sessions.find((item) => item.id === sessionId) ?? null
  const isWrittenSession = session?.kind === 'written'
  const writtenReportText = data.writtenReports.find((report) => report.sessionId === sessionId)?.text ?? ''
  const reportText = isWrittenSession ? writtenReportText : (session?.summary ?? '')
  const hasTranscript = Boolean(session?.transcript && session.transcript.trim())
  const hasSavedAudio = Boolean(String(session?.audioBlobId || '').trim())

  const [activeTabKey, setActiveTabKey] = useState<ConversationTabKey>('snelleVragen')
  const [composerText, setComposerText] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatStateMessage[]>([])
  const [isChatSending, setIsChatSending] = useState(false)
  const [transcriptSearchText, setTranscriptSearchText] = useState('')
  const [editableCoacheeName, setEditableCoacheeName] = useState(coacheeName)
  const [editableSessionTitle, setEditableSessionTitle] = useState(title)
  const [isTitleEditorOpen, setIsTitleEditorOpen] = useState(false)
  const [titleMenuAnchor, setTitleMenuAnchor] = useState<{ left: number; top: number; width: number } | null>(null)
  const [editableSessionDateInput, setEditableSessionDateInput] = useState(
    formatDateToInput(new Date(session?.createdAtUnixMs ?? Date.now())),
  )
  const [isDateCalendarOpen, setIsDateCalendarOpen] = useState(false)
  const [dateMenuAnchor, setDateMenuAnchor] = useState<{ left: number; top: number; width: number } | null>(null)
  const [visibleDateMonth, setVisibleDateMonth] = useState<Date>(new Date(session?.createdAtUnixMs ?? Date.now()))
  const [isEditSessieModalVisible, setIsEditSessieModalVisible] = useState(false)
  const [isTemplatePickerModalVisible, setIsTemplatePickerModalVisible] = useState(false)
  const [templatePickerIntent, setTemplatePickerIntent] = useState<TemplatePickerIntent>('generate')
  const [templatePickerSelectedTemplateId, setTemplatePickerSelectedTemplateId] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [isChatMaximized, setIsChatMaximized] = useState(false)
  const [isChatMaximizedRendered, setIsChatMaximizedRendered] = useState(false)
  const [isDeleteSessieModalVisible, setIsDeleteSessieModalVisible] = useState(false)
  const [isClearChatModalVisible, setIsClearChatModalVisible] = useState(false)
  const [pendingPreviewAudioUrl, setPendingPreviewAudioUrl] = useState<string | null>(null)
  const [pendingPreviewShouldSaveAudio, setPendingPreviewShouldSaveAudio] = useState<boolean | null>(null)
  const [currentAudioSeconds, setCurrentAudioSeconds] = useState(0)
  const [currentAudioDurationSeconds, setCurrentAudioDurationSeconds] = useState<number | null>(session?.audioDurationSeconds ?? null)
  const [isSummaryEditorOpen, setIsSummaryEditorOpen] = useState(false)
  const [summaryEditorInitialValue, setSummaryEditorInitialValue] = useState(reportText)
  const [forcedTranscriptionStatus, setForcedTranscriptionStatus] = useState<'transcribing' | 'generating' | null>(null)
  const [isPdfEditorOpen, setIsPdfEditorOpen] = useState(false)
  const [pdfEditorDraft, setPdfEditorDraft] = useState('')
  const [pdfEditorTitle, setPdfEditorTitle] = useState<string | undefined>(undefined)
  const [isWordEditorOpen, setIsWordEditorOpen] = useState(false)
  const [wordEditorDraft, setWordEditorDraft] = useState('')
  const [wordEditorTitle, setWordEditorTitle] = useState<string | undefined>(undefined)
  const [isReportContextModalVisible, setIsReportContextModalVisible] = useState(false)
  const [isCancelTranscriptionModalVisible, setIsCancelTranscriptionModalVisible] = useState(false)
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false)
  const [isDeletingAudio, setIsDeletingAudio] = useState(false)
  const [isNoMinutesModalVisible, setIsNoMinutesModalVisible] = useState(false)
  const [isChatMinutesBlocked, setIsChatMinutesBlocked] = useState(false)
  const [isCheckingChatMinutes, setIsCheckingChatMinutes] = useState(false)
  const [isNoMinutesCtaDismissed, setIsNoMinutesCtaDismissed] = useState(false)
  const [requiredTranscriptionSeconds, setRequiredTranscriptionSeconds] = useState(0)
  const [remainingTranscriptionSeconds, setRemainingTranscriptionSeconds] = useState(0)
  const hasDownloadableAudio = hasSavedAudio || Boolean(pendingPreviewAudioUrl)

  const coacheeButtonRef = useRef<any>(null)
  const backTitleButtonRef = useRef<any>(null)
  const sessionTitleInputRef = useRef<TextInput | null>(null)
  const titleEditorPanelRef = useRef<any>(null)
  const dateHoverTargetRef = useRef<any>(null)
  const dateCalendarPanelRef = useRef<any>(null)
  const templates = data.templates ?? []
  const templatePickerTemplates = useMemo(
    () => templates.map((template) => ({ id: template.id, name: getTemplateDisplayName(template.name) })),
    [templates],
  )
  const templatePickerDefaultTemplateId = useMemo(() => templatePickerTemplates[0]?.id ?? null, [templatePickerTemplates])
  const isConversationSession = session?.kind === 'recording' || session?.kind === 'upload'
  const templatesForSession = useMemo(() => {
    if (!isConversationSession) return templates
    return templates.filter((template) => isGespreksverslagTemplate(template))
  }, [isConversationSession, templates])
  const quickQuestionTemplates = useMemo(
    () =>
      templatesForSession.map((template) => {
        const sectionLines = template.sections
          .map((section, index) => {
            const title = section.title.trim() || `Onderdeel ${index + 1}`
            const description = section.description.trim()
            return description ? `${index + 1}. ${title}: ${description}` : `${index + 1}. ${title}`
          })
          .join('\n')
        const sectionStructure = template.sections
          .map((section, index) => {
            const title = section.title.trim() || `Onderdeel ${index + 1}`
            return `### ${title}\n-`
          })
          .join('\n\n')
        const promptText = sectionLines
          ? [
              `Maak nu een volledig verslag op basis van dit verslagtype: ${template.name}.`,
              'Gebruik exact de onderstaande koppen en volgorde.',
              'Voeg geen extra koppen toe en laat geen kop weg.',
              '',
              'Onderdelen met uitleg:',
              sectionLines,
              '',
              'Te gebruiken structuur:',
              sectionStructure || '### Verslag\n-',
            ].join('\n')
          : `Maak nu een volledig verslag op basis van dit verslagtype: ${template.name}.`
        return { id: template.id, name: template.name, promptText, templateId: template.id }
      }),
    [templatesForSession],
  )
  const practiceTintColor = data.practiceSettings.tintColor || colors.selected
  const defaultTemplateId = useMemo(() => {
    const standardTemplate = templatesForSession.find((template) => {
      const normalizedName = template.name.trim().toLowerCase()
      return normalizedName === 'intake' || normalizedName === 'intakeverslag'
    })
    return (standardTemplate ?? templatesForSession[0])?.id ?? null
  }, [templatesForSession])
  const selectedTemplate = useMemo(
    () => templatesForSession.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templatesForSession],
  )
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
  const selectedTemplateLabel = selectedTemplate ? getTemplateDisplayName(selectedTemplate.name) : 'Template'
  const hasTrajectoryReportGenerationSource = useMemo(() => {
    if (!session) return false
    const writtenReportsBySessionId = new Map(data.writtenReports.map((report) => [report.sessionId, report.text]))
    const notesBySessionId = new Map<string, string[]>()
    data.notes.forEach((note) => {
      const text = `${String(note.title || '').trim()}\n${String(note.text || '').trim()}`.trim()
      if (!text) return
      const previous = notesBySessionId.get(note.sessionId) ?? []
      notesBySessionId.set(note.sessionId, [...previous, text])
    })
    const relatedSessions = (session.coacheeId
      ? data.sessions.filter((item) => item.coacheeId === session.coacheeId)
      : [session]
    ).sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs)
    return relatedSessions.some((relatedSession) => {
      const transcript = String(relatedSession.transcript || '').trim()
      const isCurrentSession = relatedSession.id === session.id
      const summary = isWrittenSession && isCurrentSession ? '' : String(relatedSession.summary || '').trim()
      const written = isWrittenSession && isCurrentSession ? '' : String(writtenReportsBySessionId.get(relatedSession.id) || '').trim()
      const notes = notesBySessionId.get(relatedSession.id) ?? []
      return Boolean(transcript || summary || written || notes.length > 0)
    })
  }, [data.notes, data.sessions, data.writtenReports, isWrittenSession, session])
  const trajectoryReportSourceText = useMemo(() => {
    if (!session) return ''
    const writtenReportsBySessionId = new Map(data.writtenReports.map((report) => [report.sessionId, report.text]))
    const notesBySessionId = new Map<string, string[]>()
    data.notes.forEach((note) => {
      const title = String(note.title || '').trim()
      const text = String(note.text || '').trim()
      const combined = `${title}\n${text}`.trim()
      if (!combined) return
      const previous = notesBySessionId.get(note.sessionId) ?? []
      notesBySessionId.set(note.sessionId, [...previous, combined])
    })
    const relatedSessions = (session.coacheeId
      ? data.sessions.filter((item) => item.coacheeId === session.coacheeId)
      : [session]
    ).sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs)
    const blocks: string[] = []

    relatedSessions.forEach((relatedSession) => {
      const transcript = String(relatedSession.transcript || '').trim()
      const isCurrentSession = relatedSession.id === session.id
      const summary = isWrittenSession && isCurrentSession ? '' : String(relatedSession.summary || '').trim()
      const written = isWrittenSession && isCurrentSession ? '' : String(writtenReportsBySessionId.get(relatedSession.id) || '').trim()
      const notes = notesBySessionId.get(relatedSession.id) ?? []
      if (!transcript && !summary && !written && notes.length === 0) return

      const blockLines: string[] = [
        `Sessie: ${String(relatedSession.title || 'Onbenoemde sessie').trim() || 'Onbenoemde sessie'}`,
        `Datum: ${formatSessionDate(relatedSession.createdAtUnixMs) || '-'}`,
      ]
      if (transcript) {
        blockLines.push('', 'Volledige sessie:', transcript)
      }
      if (summary) {
        blockLines.push('', 'Verslag:', summary)
      }
      if (written) {
        blockLines.push('', 'Geschreven verslag:', written)
      }
      if (notes.length > 0) {
        blockLines.push('', 'Notities:', notes.map((entry) => `- ${entry}`).join('\n'))
      }
      blocks.push(blockLines.join('\n'))
    })

    return blocks.join('\n\n---\n\n').trim()
  }, [data.notes, data.sessions, data.writtenReports, isWrittenSession, session])
  const audioPlayerRef = useRef<AudioPlayerHandle | null>(null)
  const chatScrollRef = useRef<ScrollView | null>(null)
  const [isCoacheeMenuOpen, setIsCoacheeMenuOpen] = useState(false)
  const [coacheeMenuAnchor, setCoacheeMenuAnchor] = useState<{ left: number; top: number; width: number } | null>(null)

  const activeCoacheeNames = useMemo(() => {
    const names = data.coachees.filter((coachee) => !coachee.isArchived).map((coachee) => coachee.name)
    return [unassignedCoacheeLabel, ...names]
  }, [data.coachees])
  const isCoacheeMenuVisible = isCoacheeMenuOpen
  const effectiveTranscriptionStatus = forcedTranscriptionStatus ?? (session?.transcriptionStatus ?? 'idle')
  const shouldShowQuickStart = chatMessages.length === 0
  const shouldShowClearChat = chatMessages.length > 0
  const shouldUseTranscriptTint = hasSavedAudio || pendingPreviewShouldSaveAudio === true
  const chatOverlayOpacity = useRef(new Animated.Value(0)).current
  const chatOverlayScale = useRef(new Animated.Value(0.98)).current
  const noMinutesCtaOpacity = useRef(new Animated.Value(0)).current
  const noMinutesCtaTranslateY = useRef(new Animated.Value(8)).current
  const selectedTemplateIdBySessionRef = useRef<Record<string, string>>({})
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
  const selectedDate = useMemo(() => parseDateInput(editableSessionDateInput), [editableSessionDateInput])
  const selectedDateIso = selectedDate ? toIsoDate(selectedDate) : ''
  const dateMonthTitle = useMemo(
    () => new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(visibleDateMonth),
    [visibleDateMonth],
  )
  const dateCalendarCells = useMemo(() => getCalendarCells(visibleDateMonth), [visibleDateMonth])
  const sessionDateLabel = useMemo(() => {
    if (session?.createdAtUnixMs) return formatSessionDate(session.createdAtUnixMs)
    return dateLabel
  }, [dateLabel, session?.createdAtUnixMs])
  const dateMenuPosition = useMemo(() => {
    if (!dateMenuAnchor) return null
    const padding = 12
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800
    const width = 320
    const estimatedHeight = 336
    const left = Math.min(Math.max(padding, dateMenuAnchor.left), Math.max(padding, viewportWidth - width - padding))
    const top = Math.min(Math.max(padding, dateMenuAnchor.top), Math.max(padding, viewportHeight - estimatedHeight - padding))
    return { left, top, width }
  }, [dateMenuAnchor])
  const titleMenuPosition = useMemo(() => {
    if (!titleMenuAnchor) return null
    const padding = 12
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800
    const width = Math.max(260, titleMenuAnchor.width)
    const estimatedHeight = 76
    const left = Math.min(Math.max(padding, titleMenuAnchor.left), Math.max(padding, viewportWidth - width - padding))
    const top = Math.min(Math.max(padding, titleMenuAnchor.top), Math.max(padding, viewportHeight - estimatedHeight - padding))
    return { left, top, width }
  }, [titleMenuAnchor])

  function updateCoacheeMenuAnchor() {
    const rect = coacheeButtonRef.current?.getBoundingClientRect?.()
    if (!rect) return
    setCoacheeMenuAnchor({ left: rect.left, top: rect.bottom + 8, width: rect.width })
  }

  function updateTitleMenuAnchor() {
    const rect = backTitleButtonRef.current?.getBoundingClientRect?.()
    if (!rect) return
    setTitleMenuAnchor({ left: rect.left, top: rect.bottom + 8, width: rect.width })
  }

  function updateDateMenuAnchor() {
    const rect = dateHoverTargetRef.current?.getBoundingClientRect?.()
    if (!rect) return
    setDateMenuAnchor({ left: rect.left, top: rect.bottom + 8, width: 320 })
  }

  function applySessionTitle(nextTitle: string) {
    const trimmed = nextTitle.trim()
    const fallbackTitle = String(session?.title || title).trim()
    const safeNextTitle = trimmed || fallbackTitle
    setEditableSessionTitle(safeNextTitle)
    if (safeNextTitle && safeNextTitle !== String(session?.title || '').trim()) {
      updateSession(sessionId, { title: safeNextTitle })
    }
  }

  function applySessionDate(inputValue: string) {
    const parsed = parseDateInput(inputValue)
    if (!parsed || !session) {
      setEditableSessionDateInput(formatDateToInput(new Date(session?.createdAtUnixMs ?? Date.now())))
      return
    }
    const currentDate = new Date(session.createdAtUnixMs)
    const merged = new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate(),
      currentDate.getHours(),
      currentDate.getMinutes(),
      currentDate.getSeconds(),
      currentDate.getMilliseconds(),
    )
    const nextUnixMs = merged.getTime()
    setEditableSessionDateInput(formatDateToInput(merged))
    if (nextUnixMs !== session.createdAtUnixMs) {
      updateSession(sessionId, { createdAtUnixMs: nextUnixMs })
    }
  }

  function selectTemplateForCurrentSession(nextTemplateId: string | null) {
    const normalizedTemplateId = String(nextTemplateId || '').trim() || null
    setSelectedTemplateId(normalizedTemplateId)
    if (normalizedTemplateId) {
      selectedTemplateIdBySessionRef.current[sessionId] = normalizedTemplateId
      return
    }
    delete selectedTemplateIdBySessionRef.current[sessionId]
  }

  function openTemplatePickerForGenerate() {
    if (!session?.coacheeId) {
      showErrorToast(missingCoacheeGenerateError, missingCoacheeGenerateError)
      return
    }
    if (templatePickerTemplates.length === 0) return
    const nextSelectedTemplateId =
      (selectedTemplateId && templatePickerTemplates.some((template) => template.id === selectedTemplateId) ? selectedTemplateId : null) ??
      templatePickerDefaultTemplateId
    setTemplatePickerIntent('generate')
    setTemplatePickerSelectedTemplateId(nextSelectedTemplateId ?? null)
    setIsTemplatePickerModalVisible(true)
  }

  function openTemplatePickerForWrite() {
    if (templatePickerTemplates.length === 0) {
      setSummaryEditorInitialValue('')
      setIsSummaryEditorOpen(true)
      return
    }
    setTemplatePickerIntent('write')
    setTemplatePickerSelectedTemplateId(emptyTemplateOptionId)
    setIsTemplatePickerModalVisible(true)
  }

  function buildSummaryTemplateDraft(templateId: string): string {
    if (templateId === emptyTemplateOptionId) return ''
    const template = templates.find((item) => item.id === templateId)
    if (!template) return ''
    const headings = template.sections
      .map((section, index) => {
        const title = section.title.trim() || `Onderdeel ${index + 1}`
        return `### ${title}`
      })
      .filter(Boolean)
    return headings.join('\n\n')
  }

  function handleTemplatePickerContinue(templateId: string) {
    setTemplatePickerSelectedTemplateId(templateId)
    setIsTemplatePickerModalVisible(false)
    if (templatePickerIntent === 'write') {
      setSummaryEditorInitialValue(buildSummaryTemplateDraft(templateId))
      setIsSummaryEditorOpen(true)
      return
    }
    selectTemplateForCurrentSession(templateId)
    void generateReportForTemplate(templateId)
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
    if (!isWrittenSession) return
    if (activeTabKey !== 'volledigeSessie') return
    setActiveTabKey('snelleVragen')
  }, [activeTabKey, isWrittenSession])

  useEffect(() => {
    if (isSummaryEditorOpen) return
    setSummaryEditorInitialValue(reportText)
  }, [isSummaryEditorOpen, reportText])

  useEffect(() => {
    setCurrentAudioDurationSeconds(session?.audioDurationSeconds ?? null)
  }, [session?.audioDurationSeconds, sessionId])

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
    setEditableSessionTitle(String(session?.title || title))
    setEditableCoacheeName(String(coacheeName || ''))
    setEditableSessionDateInput(formatDateToInput(new Date(session?.createdAtUnixMs ?? Date.now())))
    setVisibleDateMonth(new Date(session?.createdAtUnixMs ?? Date.now()))
    setIsDateCalendarOpen(false)
    setIsTitleEditorOpen(false)
  }, [coacheeName, session?.createdAtUnixMs, session?.title, title])

  useEffect(() => {
    if (templatesForSession.length === 0) {
      setSelectedTemplateId(null)
      return
    }
    const validTemplateIds = new Set(templatesForSession.map((template) => template.id))
    const rememberedTemplateId = selectedTemplateIdBySessionRef.current[sessionId]
    if (rememberedTemplateId && validTemplateIds.has(rememberedTemplateId)) {
      setSelectedTemplateId(rememberedTemplateId)
      return
    }
    const inferredTemplateId = inferTemplateIdFromSessionTitle(session?.title, templatesForSession)
    const fallbackTemplateId = defaultTemplateId ?? templatesForSession[0]?.id ?? null
    const nextTemplateId = inferredTemplateId && validTemplateIds.has(inferredTemplateId) ? inferredTemplateId : fallbackTemplateId
    if (nextTemplateId) {
      selectedTemplateIdBySessionRef.current[sessionId] = nextTemplateId
      setSelectedTemplateId(nextTemplateId)
      return
    }
    setSelectedTemplateId(null)
  }, [defaultTemplateId, session?.title, sessionId, templatesForSession])

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
    if (!isDateCalendarOpen) return
    if (typeof window === 'undefined') return

    const pointInRect = (x: number, y: number, rect: DOMRect | null | undefined) => {
      if (!rect) return false
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    }

    const closeIfOutside = (clientX: number, clientY: number) => {
      const panelRect = dateCalendarPanelRef.current?.getBoundingClientRect?.() as DOMRect | undefined
      const targetRect = dateHoverTargetRef.current?.getBoundingClientRect?.() as DOMRect | undefined
      const connectorRect = panelRect && targetRect
        ? {
            left: Math.min(targetRect.left, panelRect.left),
            right: Math.max(targetRect.right, panelRect.right),
            top: Math.min(targetRect.bottom, panelRect.top),
            bottom: Math.max(targetRect.bottom, panelRect.top),
          }
        : null
      if (pointInRect(clientX, clientY, panelRect) || pointInRect(clientX, clientY, targetRect) || pointInRect(clientX, clientY, connectorRect as any)) return
      setIsDateCalendarOpen(false)
    }

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const touch = 'touches' in event ? event.touches[0] ?? event.changedTouches[0] : null
      const clientX = touch ? touch.clientX : (event as MouseEvent).clientX
      const clientY = touch ? touch.clientY : (event as MouseEvent).clientY
      if (typeof clientX !== 'number' || typeof clientY !== 'number') return
      closeIfOutside(clientX, clientY)
    }
    const onMouseMove = (event: MouseEvent) => closeIfOutside(event.clientX, event.clientY)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('touchstart', onPointerDown, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('touchstart', onPointerDown)
    }
  }, [isDateCalendarOpen])

  useEffect(() => {
    if (!isTitleEditorOpen) return
    if (typeof window === 'undefined') return

    const pointInRect = (x: number, y: number, rect: DOMRect | null | undefined) => {
      if (!rect) return false
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    }

    const closeIfOutside = (clientX: number, clientY: number) => {
      const panelRect = titleEditorPanelRef.current?.getBoundingClientRect?.() as DOMRect | undefined
      const targetRect = backTitleButtonRef.current?.getBoundingClientRect?.() as DOMRect | undefined
      const connectorRect = panelRect && targetRect
        ? {
            left: Math.min(targetRect.left, panelRect.left),
            right: Math.max(targetRect.right, panelRect.right),
            top: Math.min(targetRect.bottom, panelRect.top),
            bottom: Math.max(targetRect.bottom, panelRect.top),
          }
        : null
      if (pointInRect(clientX, clientY, panelRect) || pointInRect(clientX, clientY, targetRect) || pointInRect(clientX, clientY, connectorRect as any)) return
      applySessionTitle(editableSessionTitle)
      setIsTitleEditorOpen(false)
    }

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const touch = 'touches' in event ? event.touches[0] ?? event.changedTouches[0] : null
      const clientX = touch ? touch.clientX : (event as MouseEvent).clientX
      const clientY = touch ? touch.clientY : (event as MouseEvent).clientY
      if (typeof clientX !== 'number' || typeof clientY !== 'number') return
      closeIfOutside(clientX, clientY)
    }
    const onMouseMove = (event: MouseEvent) => closeIfOutside(event.clientX, event.clientY)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('touchstart', onPointerDown, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('touchstart', onPointerDown)
    }
  }, [editableSessionTitle, isTitleEditorOpen])

  useEffect(() => {
    if (!isTitleEditorOpen) return
    const id = setTimeout(() => sessionTitleInputRef.current?.focus(), 20)
    return () => clearTimeout(id)
  }, [isTitleEditorOpen])

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

  function handleTranscriptMentionPress(seconds: number) {
    audioPlayerRef.current?.seekToSeconds(seconds)
  }

  async function sendChatMessage(messageInput: string | { text: string; promptText?: string; templateId?: string }) {
    const visibleText = typeof messageInput === 'string' ? messageInput : messageInput.text
    const promptText = typeof messageInput === 'string' ? messageInput : messageInput.promptText
    const templateId = typeof messageInput === 'string' ? undefined : messageInput.templateId
    const isTemplatePrompt = typeof messageInput !== 'string' && Boolean(String(messageInput.promptText || '').trim())
    const trimmedText = visibleText.trim()
    const trimmedPromptText = String(promptText || '').trim() || trimmedText
    if (!trimmedText || !trimmedPromptText || isChatSending) return
    if (!(await ensureSufficientChatMinutes())) return

    const pdfStartToken = '[[PDF_START]]'
    const pdfEndToken = '[[PDF_END]]'
    const systemMessage: LocalChatMessage = {
      role: 'system',
      text:
      'Deze chatbot bevindt zich onder het kopje "Snelle vragen" binnen CoachScribe. Loopbaan- en re-integratiecoaches gebruiken deze chat om korte, gerichte vragen te stellen over dit verslag op basis van de verslagcontext (zoals transcript en/of geschreven verslag). Gebruik alleen informatie uit dit verslag en uit de vraag van de gebruiker. Formuleer altijd in formeel en zakelijk Nederlands en spreek de gebruiker aan met "u". Uw antwoorden zijn duidelijk en beknopt. Geef geen lange uitleg, herhaal de vraag niet en voeg geen meta-uitleg toe. Gebruik geen emoji\'s. Gebruik nooit labels zoals "speaker_3" en gebruik geen andere termen voor sprekers dan "coach" of "cliënt". Maak nooit nieuwe actiepunten. Noem alleen actiepunten die expliciet in de verslagcontext of in de vraag van de gebruiker staan. Als er geen expliciete actiepunten zijn, zeg dat duidelijk en voeg niets nieuws toe. Wanneer u verwijst naar een specifiek moment in het transcript, gebruik dan de notatie [[timestamp=MM:SS|zichtbare tekst]]. MM:SS is het tijdstip in het transcript en de tekst na de | is de klikbare tekst zoals die in de zin wordt weergegeven. Verwerk deze verwijzing vloeiend in de zin en gebruik dit actief wanneer dat helpt om het antwoord concreet en controleerbaar te maken. Als het antwoord geschikt is om als PDF te downloaden, zet dan alleen de gewenste inhoud tussen deze twee regels. Gebruik exact deze regels op een eigen regel: ' +
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

    try {
      const transcriptSystemMessages = buildConversationTranscriptSystemMessages({
        transcript: session?.transcript ?? null,
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
        const transcriptForTemplate = String(session?.transcript || '').trim() || String(writtenReportText || '').trim()
        if (transcriptForTemplate) {
          const responseText = await generateSummary({
            transcript: transcriptForTemplate,
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
      const responseText = await completeChat({
        scope: 'session',
        sessionId,
        messages: [
          ...transcriptSystemMessages,
          systemMessage,
          ...chatHistoryForModel.map<LocalChatMessage>((message) => ({
            role: message.role,
            text: message.role === 'user' ? String(message.promptText || '').trim() || message.text : message.text,
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
    await sendChatMessage(trimmedText)
  }

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

  function handleRequestPdfEdit(params: { text: string; title?: string }) {
    setPdfEditorDraft(params.text)
    setPdfEditorTitle(params.title)
    setIsPdfEditorOpen(true)
  }

  function handleRequestWordEdit(params: { text: string; title?: string }) {
    setWordEditorDraft(params.text)
    setWordEditorTitle(params.title)
    setIsWordEditorOpen(true)
  }

  function handleEditSummaryAction() {
    if (String(reportText || '').trim()) {
      setSummaryEditorInitialValue(reportText)
      setIsSummaryEditorOpen(true)
      return
    }
    openTemplatePickerForWrite()
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
    if (isDownloadingAudio) return
    setIsDownloadingAudio(true)
    try {
      const audioId = String(session?.audioBlobId || '').trim()
      let downloadableAudio: { audioBlob: Blob; mimeType: string } | null = null
      if (audioId) {
        try {
          downloadableAudio = await loadDecryptedSessionAudio(audioId)
        } catch (downloadError) {
          console.warn('[SessieDetailScreen] Saved audio download failed, trying pending preview fallback', { sessionId, error: downloadError })
        }
      }
      if (!downloadableAudio) {
        const pendingPreview = await getPendingPreviewAudioForTranscription(sessionId)
        if (pendingPreview) {
          downloadableAudio = { audioBlob: pendingPreview.blob, mimeType: pendingPreview.mimeType }
        }
      }
      if (!downloadableAudio) return
      if (typeof window === 'undefined') return
      const objectUrl = URL.createObjectURL(downloadableAudio.audioBlob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = buildSavedAudioDownloadFileName(downloadableAudio.mimeType)
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

  function readRemainingTranscriptionSeconds(status: BillingStatus | null): number {
    if (!status) return 0
    const includedRemainingSeconds = Math.max(0, Math.floor(status.includedSeconds - status.cycleUsedSeconds))
    const nonExpiringRemainingSeconds = Math.max(0, Math.floor(status.nonExpiringTotalSeconds - status.nonExpiringUsedSeconds))
    return includedRemainingSeconds + nonExpiringRemainingSeconds
  }

  function handleSaveSummary(value: string) {
    if (isWrittenSession) {
      setWrittenReport(sessionId, value)
      setIsSummaryEditorOpen(false)
      return
    }
    updateSession(sessionId, {
      summary: value,
      transcriptionStatus: value ? 'done' : session?.transcriptionStatus ?? 'done',
      transcriptionError: null,
    })
    setIsSummaryEditorOpen(false)
    if (session?.kind === 'recording' || session?.kind === 'upload') {
      setIsReportContextModalVisible(true)
    }
  }

  function formatMinutesLabel(totalSeconds: number): string {
    const minutes = Math.ceil(Math.max(0, Number(totalSeconds) || 0) / 60)
    if (minutes <= 0) return 'minder dan 1 minuut'
    if (minutes === 1) return '1 minuut'
    return `${minutes} minuten`
  }

  function parseRemainingSecondsFromErrorMessage(message: string): number | null {
    const match = String(message || '').match(/remaining\s+(\d+(?:[.,]\d+)?)\s*s/i)
    if (!match?.[1]) return null
    const parsed = Number.parseFloat(match[1].replace(',', '.'))
    if (!Number.isFinite(parsed)) return null
    return Math.max(0, Math.floor(parsed))
  }

  function isInsufficientMinutesError(error: unknown): boolean {
    const rawMessage = String(error instanceof Error ? error.message : error || '')
    const normalizedMessage = normalizeTranscriptionError(error)
    const loweredRaw = rawMessage.toLowerCase()
    const loweredNormalized = normalizedMessage.toLowerCase()
    return (
      loweredRaw.includes('not enough seconds remaining') ||
      loweredRaw.includes('insufficient') ||
      loweredNormalized.includes('niet genoeg minuten over voor transcriptie')
    )
  }

  function restoreSessionAfterGenerationFailure() {
    const previousSnapshot = generationSnapshotRef.current
    if (previousSnapshot) {
      updateSession(sessionId, {
        transcript: previousSnapshot.transcript,
        summary: previousSnapshot.summary,
        transcriptionStatus: previousSnapshot.transcriptionStatus === 'error' ? 'idle' : previousSnapshot.transcriptionStatus,
        transcriptionError: null,
      })
      return
    }
    updateSession(sessionId, {
      transcriptionStatus: hasTranscript ? 'done' : 'idle',
      transcriptionError: null,
    })
  }

  async function ensureSufficientTranscriptionMinutes(): Promise<boolean> {
    const requiredSeconds = Math.max(1, Math.ceil(currentAudioDurationSeconds ?? session?.audioDurationSeconds ?? 1))
    try {
      const response = await fetchBillingStatus()
      const remainingSeconds = readRemainingTranscriptionSeconds(response?.billingStatus ?? null)
      if (remainingSeconds < requiredSeconds) {
        setRequiredTranscriptionSeconds(requiredSeconds)
        setRemainingTranscriptionSeconds(remainingSeconds)
        setIsNoMinutesModalVisible(true)
        return false
      }
    } catch (error) {
      console.error('[SessieDetailScreen] Failed to read billing status before transcription start', error)
    }
    return true
  }

  async function retryTranscription() {
    if (session?.transcriptionStatus === 'transcribing' || session?.transcriptionStatus === 'generating') return
    setForcedTranscriptionStatus('transcribing')
    if (!(await ensureSufficientTranscriptionMinutes())) {
      setForcedTranscriptionStatus(null)
      return
    }

    const runId = beginGenerationRun()
    const transcriptionAbortController = new AbortController()
    setTranscriptionAbortController(sessionId, runId, transcriptionAbortController)

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
      if (isInsufficientMinutesError(error)) {
        const requiredSeconds = Math.max(1, Math.ceil(currentAudioDurationSeconds ?? session?.audioDurationSeconds ?? 1))
        const rawMessage = String(error instanceof Error ? error.message : error || '')
        const remainingSeconds = parseRemainingSecondsFromErrorMessage(rawMessage) ?? 0
        setRequiredTranscriptionSeconds(requiredSeconds)
        setRemainingTranscriptionSeconds(remainingSeconds)
        setIsNoMinutesModalVisible(true)
        restoreSessionAfterGenerationFailure()
        clearGenerationTracking()
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
    if (!session?.coacheeId) {
      showErrorToast(missingCoacheeGenerateError, missingCoacheeGenerateError)
      return
    }
    const generationSource = String(trajectoryReportSourceText || '').trim()
    setForcedTranscriptionStatus(generationSource ? 'generating' : 'transcribing')
    if (isWrittenSession && !generationSource) {
      setForcedTranscriptionStatus(null)
      updateSession(sessionId, {
        transcriptionStatus: 'error',
        transcriptionError: 'Geen geschreven verslag beschikbaar om te genereren.',
      })
      return
    }
    if (!generationSource && !(await ensureSufficientTranscriptionMinutes())) {
      setForcedTranscriptionStatus(null)
      return
    }
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
      let transcript = generationSource
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
      if (isWrittenSession) {
        setWrittenReport(sessionId, summary)
        updateSession(sessionId, {
          transcriptionStatus: 'done',
          transcriptionError: null,
        })
      } else {
        updateSession(sessionId, {
          summary,
          transcriptionStatus: 'done',
          transcriptionError: null,
        })
      }
      console.log('[transcription][report] summary-generate-done', { sessionId, summaryLength: summary.length })
      clearGenerationTracking()
    } catch (error) {
      if (!isGenerationRunActive(runId)) return
      if (isTranscriptionCancelledError(error)) {
        return
      }
      if (isInsufficientMinutesError(error)) {
        const requiredSeconds = Math.max(1, Math.ceil(currentAudioDurationSeconds ?? session?.audioDurationSeconds ?? 1))
        const rawMessage = String(error instanceof Error ? error.message : error || '')
        const remainingSeconds = parseRemainingSecondsFromErrorMessage(rawMessage) ?? 0
        setRequiredTranscriptionSeconds(requiredSeconds)
        setRemainingTranscriptionSeconds(remainingSeconds)
        setIsNoMinutesModalVisible(true)
        restoreSessionAfterGenerationFailure()
        clearGenerationTracking()
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

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

  if (isMobileLayout) {
    return (
      <View style={styles.container}>
        {/* Detail header */}
        <View style={styles.headerRow}>
          <View pointerEvents="none" style={styles.headerGradient} />
          <View style={styles.leftHeader}>
            <Pressable
              ref={backTitleButtonRef}
              onPress={onBack}
              onHoverIn={() => {
                updateTitleMenuAnchor()
                setIsTitleEditorOpen(true)
              }}
              style={({ hovered }) => [styles.backTitleButton, hovered ? styles.backTitleButtonHovered : undefined]}
            >
              <ChevronLeftIcon color={colors.text} size={24} />
              <Text numberOfLines={1} isSemibold style={styles.sessionTitle}>
                {editableSessionTitle}
              </Text>
            </Pressable>
          </View>

          <View style={styles.rightHeader}>
            <View style={styles.headerActionsMenuAnchor}>
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
                    onDurationSecondsChange={setCurrentAudioDurationSeconds}
                    onDownloadAudio={() => {
                      void handleDownloadSavedAudio()
                    }}
                    onDeleteAudio={() => {
                      void handleDeleteSavedAudio()
                    }}
                    isDownloadAudioBusy={isDownloadingAudio}
                    isDownloadAudioDisabled={!hasDownloadableAudio}
                    isDeleteAudioBusy={isDeletingAudio}
                    isDeleteAudioDisabled={!hasSavedAudio || effectiveTranscriptionStatus === 'transcribing' || effectiveTranscriptionStatus === 'generating'}
                  />
                </View>
              ) : null}
              {/* Report */}
                <View style={styles.reportCard}>
                  <ReportPanel
                    onPressTemplate={templatePickerTemplates.length > 0 ? openTemplatePickerForGenerate : undefined}
                    summary={reportText || null}
                    hasTranscript={hasTrajectoryReportGenerationSource}
                    transcriptionStatus={effectiveTranscriptionStatus}
                    transcriptionError={session?.transcriptionError ?? null}
                    onEditSummary={handleEditSummaryAction}
                    onShareSummary={() => handleRequestPdfEdit({ text: reportText, title: editableSessionTitle })}
                    onExportSummaryAsWord={() => handleRequestWordEdit({ text: reportText, title: editableSessionTitle })}
                    onRetryTranscription={() => {
                      openTemplatePickerForGenerate()
                    }}
                    onCancelGeneration={handleCancelGeneration}
                    suppressErrorToast={isNoMinutesModalVisible}
                  />
                </View>
              {/* Active tab content */}
                <View style={styles.mobileTabContentCard}>
                  <View style={styles.tabsRow}>
                    <View style={styles.tabsLeft}>
                      <ConversationTabs activeTabKey={activeTabKey} onSelectTab={setActiveTabKey} showFullConversationTab={!isWrittenSession} />
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
                            templates={quickQuestionTemplates}
                            onSelectOption={(option) => sendChatMessage(option)}
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
                      {isChatMinutesBlocked && !isNoMinutesCtaDismissed ? (
                        <Animated.View
                          style={[
                            styles.noMinutesChatCtaContainer,
                            { opacity: noMinutesCtaOpacity, transform: [{ translateY: noMinutesCtaTranslateY }] },
                          ]}
                        >
                          <Pressable
                            onPress={() => setIsNoMinutesCtaDismissed(true)}
                            style={({ hovered }) => [styles.noMinutesChatCtaCloseButton, hovered ? styles.noMinutesChatCtaCloseButtonHovered : undefined]}
                            accessibilityRole="button"
                            accessibilityLabel="Melding sluiten"
                          >
                            <CircleCloseIcon size={18} color={colors.textSecondary} />
                          </Pressable>
                          <Text style={styles.noMinutesChatCtaText}>U heeft geen minuten meer.</Text>
                          <Pressable
                            onPress={onOpenMySubscription}
                            style={({ hovered }) => [
                              styles.noMinutesChatCtaButton,
                              hovered ? styles.noMinutesChatCtaButtonHovered : undefined,
                            ]}
                          >
                            <Text isBold style={styles.noMinutesChatCtaButtonText}>
                              Mijn abonnement
                            </Text>
                          </Pressable>
                        </Animated.View>
                      ) : null}
                      <View style={styles.chatBottom}>
                        <ChatComposer
                          value={composerText}
                          onChangeValue={setComposerText}
                          onSend={handleSendChatMessage}
                          isSendDisabled={isChatSending || isCheckingChatMinutes || composerText.trim().length === 0}
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
                  {!isWrittenSession && activeTabKey === 'volledigeSessie' ? (
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
                      audioDurationSeconds={currentAudioDurationSeconds ?? session?.audioDurationSeconds ?? null}
                      showRetryButton={false}
                      suppressErrorToast={isNoMinutesModalVisible}
                    />
                  ) : null}
                </AnimatedMainContent>
              </View>
          </>
        </ScrollView>

        <EditSessieModal
          visible={isEditSessieModalVisible}
          initialSessionTitle={editableSessionTitle}
          initialCoacheeName={editableCoacheeName}
          initialTemplateKey={selectedTemplateId ?? ''}
          initialTemplateLabel={selectedTemplateLabel}
          coacheeOptions={activeCoacheeNames}
          templateOptions={templatesForSession.map((template) => ({ key: template.id, label: getTemplateDisplayName(template.name) }))}
          isTemplateChangeAllowed
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
            selectTemplateForCurrentSession(values.templateKey)
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
          templates={templatePickerTemplates}
          selectedTemplateId={templatePickerSelectedTemplateId}
          emptyOption={templatePickerIntent === 'write' ? { id: emptyTemplateOptionId, name: 'Leeg template' } : null}
          confirmLabel={templatePickerIntent === 'write' ? 'Schrijven' : 'Genereren'}
          onClose={() => setIsTemplatePickerModalVisible(false)}
          onContinue={handleTemplatePickerContinue}
        />

        <AnimatedOverlayModal
          visible={isNoMinutesModalVisible}
          onClose={() => setIsNoMinutesModalVisible(false)}
          contentContainerStyle={styles.noMinutesModalContainer}
        >
          <View style={styles.noMinutesModalContent}>
            <Text isBold style={styles.noMinutesModalTitle}>
              Onvoldoende minuten voor transcriptie
            </Text>
          <Text style={styles.noMinutesModalText}>
            U heeft nog {formatMinutesLabel(remainingTranscriptionSeconds)} en dit verslag heeft ongeveer {formatMinutesLabel(requiredTranscriptionSeconds)} nodig. Bekijk uw abonnement om extra minuten te regelen.
          </Text>
        </View>
        <View style={styles.noMinutesModalFooter}>
            <Pressable
              onPress={() => setIsNoMinutesModalVisible(false)}
              style={({ hovered }) => [
                styles.noMinutesFooterSecondaryButton,
                hovered ? styles.noMinutesFooterSecondaryButtonHovered : undefined,
              ]}
            >
              <Text isBold style={styles.noMinutesFooterSecondaryButtonText}>
                Sluiten
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setIsNoMinutesModalVisible(false)
                onOpenMySubscription()
              }}
              style={({ hovered }) => [
                styles.noMinutesFooterPrimaryButton,
                hovered ? styles.noMinutesFooterPrimaryButtonHovered : undefined,
              ]}
            >
              <Text isBold style={styles.noMinutesFooterPrimaryButtonText}>
                Mijn abonnement
              </Text>
            </Pressable>
          </View>
      </AnimatedOverlayModal>

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
            ref={backTitleButtonRef}
            onPress={onBack}
            onHoverIn={() => {
              updateTitleMenuAnchor()
              setIsTitleEditorOpen(true)
            }}
            style={({ hovered }) => [styles.backTitleButton, hovered ? styles.backTitleButtonHovered : undefined]}
          >
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

          {!isVerySmallLayout && !hideDate && sessionDateLabel.length > 0 ? (
            <Pressable
              ref={dateHoverTargetRef}
              onHoverIn={() => {
                const parsed = parseDateInput(editableSessionDateInput)
                if (parsed) setVisibleDateMonth(parsed)
                updateDateMenuAnchor()
                setIsDateCalendarOpen(true)
              }}
              style={styles.dateContainer}
            >
              <CalendarCircleIcon size={24} />
              <Text isSemibold style={styles.dateText}>
                {sessionDateLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.rightHeader}>
          <View style={styles.headerActionsMenuAnchor}>
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
            <ScrollView
              style={[styles.leftScroll, styles.leftScrollGapAligned]}
              contentContainerStyle={styles.leftScrollContent}
              showsVerticalScrollIndicator
            >
              {hasSavedAudio || pendingPreviewAudioUrl ? (
                <View style={styles.audioCardSection}>
                  <AudioPlayerCard
                    ref={audioPlayerRef}
                    audioBlobId={session?.audioBlobId ?? null}
                    audioDurationSeconds={session?.audioDurationSeconds ?? null}
                    audioUrlOverride={pendingPreviewAudioUrl}
                    onCurrentSecondsChange={setCurrentAudioSeconds}
                    onDurationSecondsChange={setCurrentAudioDurationSeconds}
                    onDownloadAudio={() => {
                      void handleDownloadSavedAudio()
                    }}
                    onDeleteAudio={() => {
                      void handleDeleteSavedAudio()
                    }}
                    isDownloadAudioBusy={isDownloadingAudio}
                    isDownloadAudioDisabled={!hasDownloadableAudio}
                    isDeleteAudioBusy={isDeletingAudio}
                    isDeleteAudioDisabled={!hasSavedAudio || effectiveTranscriptionStatus === 'transcribing' || effectiveTranscriptionStatus === 'generating'}
                  />
                </View>
              ) : null}
              {/* Report card */}
              <View style={styles.reportCard}>
                <ReportPanel
                  onPressTemplate={templatePickerTemplates.length > 0 ? openTemplatePickerForGenerate : undefined}
                  summary={reportText || null}
                  hasTranscript={hasTrajectoryReportGenerationSource}
                  transcriptionStatus={effectiveTranscriptionStatus}
                  transcriptionError={session?.transcriptionError ?? null}
                  onEditSummary={handleEditSummaryAction}
                  onShareSummary={() => handleRequestPdfEdit({ text: reportText, title: editableSessionTitle })}
                  onExportSummaryAsWord={() => handleRequestWordEdit({ text: reportText, title: editableSessionTitle })}
                  onRetryTranscription={() => {
                    openTemplatePickerForGenerate()
                  }}
                  onCancelGeneration={handleCancelGeneration}
                  suppressErrorToast={isNoMinutesModalVisible}
                />
              </View>
            </ScrollView>
          </View>

          <View style={styles.rightColumn}>
              <View style={styles.rightCard}>
                <View style={styles.tabsRow}>
                  <View style={styles.tabsLeft}>
                    <ConversationTabs activeTabKey={activeTabKey} onSelectTab={setActiveTabKey} showFullConversationTab={!isWrittenSession} />
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
                            templates={quickQuestionTemplates}
                            onSelectOption={(option) => sendChatMessage(option)}
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

                      {isChatMinutesBlocked && !isNoMinutesCtaDismissed ? (
                        <Animated.View
                          style={[
                            styles.noMinutesChatCtaContainer,
                            { opacity: noMinutesCtaOpacity, transform: [{ translateY: noMinutesCtaTranslateY }] },
                          ]}
                        >
                          <Pressable
                            onPress={() => setIsNoMinutesCtaDismissed(true)}
                            style={({ hovered }) => [styles.noMinutesChatCtaCloseButton, hovered ? styles.noMinutesChatCtaCloseButtonHovered : undefined]}
                            accessibilityRole="button"
                            accessibilityLabel="Melding sluiten"
                          >
                            <CircleCloseIcon size={18} color={colors.textSecondary} />
                          </Pressable>
                          <Text style={styles.noMinutesChatCtaText}>U heeft geen minuten meer.</Text>
                          <Pressable
                            onPress={onOpenMySubscription}
                            style={({ hovered }) => [
                              styles.noMinutesChatCtaButton,
                              hovered ? styles.noMinutesChatCtaButtonHovered : undefined,
                            ]}
                          >
                            <Text isBold style={styles.noMinutesChatCtaButtonText}>
                              Mijn abonnement
                            </Text>
                          </Pressable>
                        </Animated.View>
                      ) : null}

                      <View style={styles.chatBottom}>
                        <ChatComposer
                          value={composerText}
                          onChangeValue={setComposerText}
                          onSend={handleSendChatMessage}
                          isSendDisabled={isChatSending || isCheckingChatMinutes || composerText.trim().length === 0}
                          shouldAutoFocus={activeTabKey === 'snelleVragen'}
                          autoFocusKey={activeTabKey}
                        />
                      </View>
                    </View>
                  ) : null}

                  {activeTabKey === 'notities' ? <NotesTabPanel sessionId={sessionId} /> : null}

                  {!isWrittenSession && activeTabKey === 'volledigeSessie' ? (
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
                      audioDurationSeconds={currentAudioDurationSeconds ?? session?.audioDurationSeconds ?? null}
                      showRetryButton={false}
                      suppressErrorToast={isNoMinutesModalVisible}
                    />
                  ) : null}
                </AnimatedMainContent>
              </View>
            </View>
        </View>
      </View>

      <EditSessieModal
        visible={isEditSessieModalVisible}
        initialSessionTitle={editableSessionTitle}
        initialCoacheeName={editableCoacheeName}
        initialTemplateKey={selectedTemplateId ?? ''}
        initialTemplateLabel={selectedTemplateLabel}
        coacheeOptions={activeCoacheeNames}
        templateOptions={templatesForSession.map((template) => ({ key: template.id, label: getTemplateDisplayName(template.name) }))}
        isTemplateChangeAllowed
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
          selectTemplateForCurrentSession(values.templateKey)
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
        templates={templatePickerTemplates}
        selectedTemplateId={templatePickerSelectedTemplateId}
        emptyOption={templatePickerIntent === 'write' ? { id: emptyTemplateOptionId, name: 'Leeg template' } : null}
        confirmLabel={templatePickerIntent === 'write' ? 'Schrijven' : 'Genereren'}
        onClose={() => setIsTemplatePickerModalVisible(false)}
        onContinue={handleTemplatePickerContinue}
      />

      <RichTextEditorModal
        visible={isSummaryEditorOpen}
        title="Verslag bewerken"
        initialValue={summaryEditorInitialValue}
        saveLabel="Verslag opslaan"
        onClose={() => setIsSummaryEditorOpen(false)}
        onSave={handleSaveSummary}
      />

      <ReportContextModal
        visible={isReportContextModalVisible}
        initialValues={{
          reportDate: session?.reportDate ?? '',
          wvpWeekNumber: session?.wvpWeekNumber ?? '',
          reportFirstSickDay: session?.reportFirstSickDay ?? '',
        }}
        onClose={() => setIsReportContextModalVisible(false)}
        onSave={(values) => {
          updateSession(sessionId, {
            reportDate: values.reportDate.trim() || null,
            wvpWeekNumber: values.wvpWeekNumber.trim() || null,
            reportFirstSickDay: values.reportFirstSickDay.trim() || null,
          })
          setIsReportContextModalVisible(false)
        }}
      />

      <RichTextEditorModal
        visible={isPdfEditorOpen}
        title="PDF bewerken"
        initialValue={pdfEditorDraft}
        saveLabel="Exporteer PDF"
        onClose={() => setIsPdfEditorOpen(false)}
        onSave={async (value) => {
          await exportMessageToPdf(value, pdfEditorTitle, {
            practiceName: data.practiceSettings.practiceName,
            website: data.practiceSettings.website,
            tintColor: data.practiceSettings.tintColor,
            logoDataUrl: data.practiceSettings.logoDataUrl,
          })
          setIsPdfEditorOpen(false)
        }}
      />

      <RichTextEditorModal
        visible={isWordEditorOpen}
        title="Word bewerken"
        initialValue={wordEditorDraft}
        saveLabel="Exporteer Word"
        onClose={() => setIsWordEditorOpen(false)}
        onSave={async (value) => {
          await exportMessageToWord(value, wordEditorTitle, {
            practiceName: data.practiceSettings.practiceName,
            website: data.practiceSettings.website,
            tintColor: data.practiceSettings.tintColor,
            logoDataUrl: data.practiceSettings.logoDataUrl,
          })
          setIsWordEditorOpen(false)
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

      <AnimatedOverlayModal
        visible={isNoMinutesModalVisible}
        onClose={() => setIsNoMinutesModalVisible(false)}
        contentContainerStyle={styles.noMinutesModalContainer}
      >
        <View style={styles.noMinutesModalContent}>
          <Text isBold style={styles.noMinutesModalTitle}>
            Onvoldoende minuten voor transcriptie
          </Text>
          <Text style={styles.noMinutesModalText}>
            U heeft nog {formatMinutesLabel(remainingTranscriptionSeconds)} en dit verslag heeft ongeveer {formatMinutesLabel(requiredTranscriptionSeconds)} nodig. Bekijk uw abonnement om extra minuten te regelen.
          </Text>
        </View>
        <View style={styles.noMinutesModalFooter}>
            <Pressable
              onPress={() => setIsNoMinutesModalVisible(false)}
              style={({ hovered }) => [
                styles.noMinutesFooterSecondaryButton,
                hovered ? styles.noMinutesFooterSecondaryButtonHovered : undefined,
              ]}
            >
              <Text isBold style={styles.noMinutesFooterSecondaryButtonText}>
                Sluiten
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setIsNoMinutesModalVisible(false)
                onOpenMySubscription()
              }}
              style={({ hovered }) => [
                styles.noMinutesFooterPrimaryButton,
                hovered ? styles.noMinutesFooterPrimaryButtonHovered : undefined,
              ]}
            >
              <Text isBold style={styles.noMinutesFooterPrimaryButtonText}>
                Mijn abonnement
              </Text>
            </Pressable>
          </View>
      </AnimatedOverlayModal>

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
                    <QuickQuestionsStart
                      templates={quickQuestionTemplates}
                      onSelectOption={(option) => sendChatMessage(option)}
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
                {isChatMinutesBlocked && !isNoMinutesCtaDismissed ? (
                  <Animated.View
                    style={[
                      styles.noMinutesChatCtaContainer,
                      { opacity: noMinutesCtaOpacity, transform: [{ translateY: noMinutesCtaTranslateY }] },
                    ]}
                  >
                    <Pressable
                      onPress={() => setIsNoMinutesCtaDismissed(true)}
                      style={({ hovered }) => [styles.noMinutesChatCtaCloseButton, hovered ? styles.noMinutesChatCtaCloseButtonHovered : undefined]}
                      accessibilityRole="button"
                      accessibilityLabel="Melding sluiten"
                    >
                      <CircleCloseIcon size={18} color={colors.textSecondary} />
                    </Pressable>
                    <Text style={styles.noMinutesChatCtaText}>U heeft geen minuten meer.</Text>
                    <Pressable
                      onPress={onOpenMySubscription}
                      style={({ hovered }) => [
                        styles.noMinutesChatCtaButton,
                        hovered ? styles.noMinutesChatCtaButtonHovered : undefined,
                      ]}
                    >
                      <Text isBold style={styles.noMinutesChatCtaButtonText}>
                        Mijn abonnement
                      </Text>
                    </Pressable>
                  </Animated.View>
                ) : null}
                <View style={styles.chatBottom}>
                  <ChatComposer
                    value={composerText}
                    onChangeValue={setComposerText}
                    onSend={handleSendChatMessage}
                    isSendDisabled={isChatSending || isCheckingChatMinutes || composerText.trim().length === 0}
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
                {/* Add client */}
                <Text isSemibold style={styles.coacheeMenuRowAddText}>
                  + Nieuwe cliënt
                </Text>
              </Pressable>
            </ScrollView>
          </AnimatedDropdownPanel>
        </WebPortal>
      ) : null}

      {isTitleEditorOpen && titleMenuPosition ? (
        <WebPortal>
          <AnimatedDropdownPanel
            visible={isTitleEditorOpen}
            style={[styles.titleEditorMenu, { left: titleMenuPosition.left, top: titleMenuPosition.top, width: titleMenuPosition.width } as any]}
          >
            <View ref={titleEditorPanelRef} style={styles.titleEditorPanelInner}>
              <TextInput
                ref={sessionTitleInputRef}
                value={editableSessionTitle}
                onChangeText={setEditableSessionTitle}
                onBlur={() => {
                  applySessionTitle(editableSessionTitle)
                  setIsTitleEditorOpen(false)
                }}
                onKeyPress={(event) => {
                  if (event.nativeEvent.key === 'Enter') {
                    applySessionTitle(editableSessionTitle)
                    setIsTitleEditorOpen(false)
                  }
                  if (event.nativeEvent.key === 'Escape') {
                    setEditableSessionTitle(String(session?.title || title))
                    setIsTitleEditorOpen(false)
                  }
                }}
                placeholder="Verslagtitel"
                placeholderTextColor={colors.textSecondary}
                style={[styles.titleEditorInput, inputWebStyle]}
              />
            </View>
          </AnimatedDropdownPanel>
        </WebPortal>
      ) : null}

      {isDateCalendarOpen && dateMenuPosition ? (
        <WebPortal>
          <AnimatedDropdownPanel
            visible={isDateCalendarOpen}
            style={[styles.dateCalendarMenu, { left: dateMenuPosition.left, top: dateMenuPosition.top, width: dateMenuPosition.width } as any]}
          >
            <View ref={dateCalendarPanelRef} style={styles.dateCalendarPanelInner}>
              <View style={styles.dateCalendarHeader}>
                <Pressable
                  onPress={() => setVisibleDateMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1))}
                  style={({ hovered }) => [styles.dateCalendarNavButton, hovered ? styles.dateCalendarNavButtonHovered : undefined]}
                >
                  <Text isBold style={styles.dateCalendarNavButtonText}>
                    {'<'}
                  </Text>
                </Pressable>
                <Text isSemibold style={styles.dateCalendarMonthTitle}>
                  {dateMonthTitle}
                </Text>
                <Pressable
                  onPress={() => setVisibleDateMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1))}
                  style={({ hovered }) => [styles.dateCalendarNavButton, hovered ? styles.dateCalendarNavButtonHovered : undefined]}
                >
                  <Text isBold style={styles.dateCalendarNavButtonText}>
                    {'>'}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.dateCalendarWeekRow}>
                {dayLabels.map((dayLabel) => (
                  <View key={dayLabel} style={styles.dateCalendarDayLabelWrap}>
                    <Text isSemibold style={styles.dateCalendarDayLabel}>
                      {dayLabel}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.dateCalendarGrid}>
                {dateCalendarCells.map((cell) => {
                  const isSelected = cell.isoDate === selectedDateIso
                  return (
                    <Pressable
                      key={cell.isoDate}
                      onPress={() => {
                        const [year, month, day] = cell.isoDate.split('-').map(Number)
                        const selected = new Date(year, month - 1, day)
                        const nextInput = formatDateToInput(selected)
                        setEditableSessionDateInput(nextInput)
                        setVisibleDateMonth(new Date(year, month - 1, 1))
                        setIsDateCalendarOpen(false)
                        applySessionDate(nextInput)
                      }}
                      style={({ hovered }) => [
                        styles.dateCalendarDayButton,
                        !cell.inCurrentMonth ? styles.dateCalendarDayButtonOutside : undefined,
                        isSelected ? styles.dateCalendarDayButtonSelected : undefined,
                        hovered ? styles.dateCalendarDayButtonHovered : undefined,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dateCalendarDayText,
                          !cell.inCurrentMonth ? styles.dateCalendarDayTextOutside : undefined,
                          isSelected ? styles.dateCalendarDayTextSelected : undefined,
                        ]}
                      >
                        {cell.dayOfMonth}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
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
    ...( { backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)' } as any ),
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
  titleEditorMenu: {
    ...( { position: 'fixed', zIndex: 9999, boxShadow: '0 20px 60px rgba(0,0,0,0.16)' } as any ),
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  titleEditorPanelInner: {
    width: '100%',
    padding: 10,
    backgroundColor: colors.surface,
  },
  titleEditorInput: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  dateCalendarMenu: {
    ...( { position: 'fixed', zIndex: 9999, boxShadow: '0 20px 60px rgba(0,0,0,0.16)' } as any ),
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dateCalendarPanelInner: {
    width: '100%',
    padding: 12,
    backgroundColor: colors.surface,
  },
  dateCalendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateCalendarNavButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E6C1D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCalendarNavButtonHovered: {
    backgroundColor: '#FCEFF6',
  },
  dateCalendarNavButtonText: {
    color: colors.selected,
    fontSize: 14,
    lineHeight: 16,
  },
  dateCalendarMonthTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
    textTransform: 'capitalize',
  },
  dateCalendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dateCalendarDayLabelWrap: {
    width: `${100 / 7}%` as any,
    alignItems: 'center',
  },
  dateCalendarDayLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: '#777777',
    textTransform: 'uppercase',
  },
  dateCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 4,
  },
  dateCalendarDayButton: {
    width: `${100 / 7}%` as any,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCalendarDayButtonOutside: {
    backgroundColor: '#FAFAFA',
  },
  dateCalendarDayButtonSelected: {
    backgroundColor: colors.selected,
  },
  dateCalendarDayButtonHovered: {
    backgroundColor: '#F8E4EF',
  },
  dateCalendarDayText: {
    fontSize: 13,
    lineHeight: 16,
    color: '#1D0A00',
  },
  dateCalendarDayTextOutside: {
    color: '#999999',
  },
  dateCalendarDayTextSelected: {
    color: '#FFFFFF',
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
    minHeight: 0,
  },
  rightColumn: {
    flex: 1,
  },
  leftScroll: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    ...( { overflowY: 'auto', scrollbarWidth: 'auto', scrollbarGutter: 'stable', scrollbarColor: `${colors.border} ${colors.pageBackground}` } as any ),
  },
  leftScrollGapAligned: {
    ...( { marginRight: -8, paddingRight: 8 } as any ),
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
    position: 'relative',
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
  noMinutesChatCtaContainer: {
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
  noMinutesChatCtaCloseButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMinutesChatCtaCloseButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  noMinutesChatCtaText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  noMinutesChatCtaButton: {
    alignSelf: 'flex-start',
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.selected,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMinutesChatCtaButtonHovered: {
    backgroundColor: '#A50058',
  },
  noMinutesChatCtaButtonText: {
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
  noMinutesModalContainer: {
    width: 560,
  },
  noMinutesModalContent: {
    padding: 24,
    gap: 16,
  },
  noMinutesModalTitle: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textStrong,
  },
  noMinutesModalText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  noMinutesModalFooter: {
    width: '100%',
    padding: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  noMinutesFooterSecondaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomLeftRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 0,
    borderColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 0,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMinutesFooterSecondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  noMinutesFooterSecondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  noMinutesFooterPrimaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomRightRadius: 16,
    backgroundColor: colors.selected,
    paddingHorizontal: 24,
    paddingVertical: 0,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMinutesFooterPrimaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  noMinutesFooterPrimaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  tabAnimated: {
    flex: 1,
  },
})
