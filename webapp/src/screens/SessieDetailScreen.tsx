import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, ScrollView, TextInput, useWindowDimensions, View } from 'react-native'

import { LoadingSpinner } from '../ui/LoadingSpinner'
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon'
import { CoacheeAvatarIcon } from '../icons/CoacheeAvatarIcon'
import { CalendarCircleIcon } from '../icons/CalendarCircleIcon'
import { FullScreenOpenIcon } from '../icons/FullScreenOpenIcon'
import { Text } from '../ui/Text'
import { colors } from '../design/theme/colors'
import { type ConversationTabKey } from '../components/sessionDetail/ConversationTabs'
import { AudioPlayerCard, type AudioPlayerHandle } from '../components/sessionDetail/AudioPlayerCard'
import { exportMessageToPdf, exportMessageToWord } from '../components/sessionDetail/ChatMessage'
import { ReportPanel } from '../components/sessionDetail/ReportPanel'
import { ConfirmTranscriptionCancelModal } from '../components/sessionDetail/ConfirmTranscriptionCancelModal'
import { TemplatePickerModal } from '../components/sessionDetail/TemplatePickerModal'
import { EditSessieModal } from '../components/sessionDetail/EditSessieModal'
import { useLocalAppData } from '../local/LocalAppDataProvider'
import { generateStructuredSummary } from '../api/reports'
import { normalizeSummaryTemplate } from '../services/summary'
import { clearQuickQuestionsChatForSession } from '../local/quickQuestionsChatStore'
import { useE2ee } from '../e2ee/E2eeProvider'
import { ConfirmSessieDeleteModal } from '../components/sessies/ConfirmSessieDeleteModal'
import {
  getPendingPreviewAudio,
  getPendingPreviewShouldSaveAudio,
  retainPendingPreviewAudio,
} from '../audio/pendingPreviewStore'
import { RichTextEditorModal } from '../components/editor/RichTextEditorModal'
import { isGespreksverslagTemplate } from '../utils/templateCategories'
import { ConfirmChatClearModal } from '../components/sessionDetail/ConfirmChatClearModal'
import { ReportContextModal } from '../components/sessionDetail/ReportContextModal'
import { formatCoacheeDetailsForPrompt, formatEmployerDetailsForPrompt, getCoacheeUpsertValues } from '../utils/coacheeProfile'
import { useToast } from '../toast/ToastProvider'
import { features } from '../config/features'
import {
  hasStructuredSummaryContent,
  legacySummaryFallbackTitle,
  mapReportMarkdownToStructuredSummary,
  structuredSummaryToMarkdown,
  type StructuredSessionSummary,
} from '../utils/structuredSummary'
import { ConfirmReportRegenerateModal } from '../components/sessionDetail/ConfirmReportRegenerateModal'
import { isSessionConversationArtifact, isSessionReportArtifact } from '../utils/sessionArtifacts'
import { ChatOverlay } from './sessieDetail/components/ChatOverlay'
import { Menus } from './sessieDetail/components/Menus'
import { NoMinutesModal } from './sessieDetail/components/NoMinutesModal'
import { TabContent } from './sessieDetail/components/TabContent'
import { useSessieDetailActivitySnippetFlow } from '../hooks/sessieDetail/useSessieDetailActivitySnippetFlow'
import { useSessieDetailChatFlow } from '../hooks/sessieDetail/useSessieDetailChatFlow'
import { useSessieDetailTranscriptionFlow } from '../hooks/sessieDetail/useSessieDetailTranscriptionFlow'
import { createSessieDetailReportActions } from '../logic/sessieDetail/sessieDetailReportActions'
import { styles } from './sessieDetail/styles'

type BillingStatus = {
  includedSeconds: number
  cycleUsedSeconds: number
  nonExpiringTotalSeconds: number
  nonExpiringUsedSeconds: number
}

type Props = {
  sessionId: string
  title: string
  coacheeName: string
  dateLabel: string
  forceRapportageOnly?: boolean
  initialOpenTemplatePicker?: boolean
  onInitialTemplatePickerHandled?: () => void
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

function extractLegacyProfileFallback(rawValue: string | null | undefined): string {
  const trimmed = String(rawValue || '').trim()
  if (!trimmed) return ''
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed === 'object') return ''
  } catch {
    return trimmed
  }
  return ''
}

function splitPostalCodeAndCity(value: string): { postalCode: string; city: string } {
  const raw = String(value || '').trim()
  if (!raw) return { postalCode: '', city: '' }
  const match = raw.match(/\b\d{4}\s?[a-z]{2}\b/i)
  if (!match || match.index === undefined) return { postalCode: '', city: raw }
  const postalCode = String(match[0] || '').toUpperCase().replace(/\s+/g, '')
  const city = raw
    .slice(match.index + match[0].length)
    .replace(/^[,\s-]+/, '')
    .trim()
  return { postalCode, city }
}

function extractOrderNumberFallback(clientDetailsRaw: string | null | undefined): string {
  const raw = String(clientDetailsRaw || '').trim()
  if (!raw) return ''
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      const object = parsed as Record<string, unknown>
      return String(
        object.orderNumber ??
          object.ordernummer ??
          object.orderNr ??
          object.order_nr ??
          object.order ??
          '',
      ).trim()
    }
  } catch {
    const match = raw.match(/(?:ordernummer|ordernr|order)\s*[:=-]\s*([^\n\r]+)/i)
    if (match) return String(match[1] || '').trim()
  }
  return ''
}

type TemplatePickerIntent = 'generate' | 'write'
type CalendarCell = {
  isoDate: string
  dayOfMonth: number
  inCurrentMonth: boolean
}

const emptyTemplateOptionId = '__empty_template__'
const dayLabels = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
const missingCoacheeReportsGenerateError = 'Geen items binnen deze client om dit document op te baseren.'

function readRemainingTranscriptionSeconds(status: BillingStatus | null): number {
  if (!status) return 0
  const includedRemainingSeconds = Math.max(0, Math.floor(status.includedSeconds - status.cycleUsedSeconds))
  const nonExpiringRemainingSeconds = Math.max(0, Math.floor(status.nonExpiringTotalSeconds - status.nonExpiringUsedSeconds))
  return includedRemainingSeconds + nonExpiringRemainingSeconds
}

function buildTemplatePromptText(templateName: string, sections: { title: string; description: string }[]): string {
  const sectionLines = sections
    .map((section, index) => {
      const title = section.title.trim() || `Onderdeel ${index + 1}`
      const description = section.description.trim()
      return description ? `${index + 1}. ${title}: ${description}` : `${index + 1}. ${title}`
    })
    .join('\n')
  const sectionStructure = sections
    .map((section, index) => {
      const title = section.title.trim() || `Onderdeel ${index + 1}`
      return `### ${title}\n-`
    })
    .join('\n\n')
  if (!sectionLines) {
    return `Maak nu een volledig verslag op basis van dit verslagtype: ${templateName}.`
  }
  return [
    `Maak nu een volledig verslag op basis van dit verslagtype: ${templateName}.`,
    'Gebruik exact de onderstaande koppen en volgorde.',
    'Voeg geen extra koppen toe en laat geen kop weg.',
    '',
    'Onderdelen met uitleg:',
    sectionLines,
    '',
    'Te gebruiken structuur:',
    sectionStructure || '### Verslag\n-',
  ].join('\n')
}
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
  forceRapportageOnly = false,
  initialOpenTemplatePicker = false,
  onInitialTemplatePickerHandled,
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
  const { data, createActivity, createSnippet, updateSnippet, deleteActivity, deleteSession, setWrittenReport, updateSession } =
    useLocalAppData()
  const { showErrorToast, showToast } = useToast()
  const e2ee = useE2ee()
  const session = data.sessions.find((item) => item.id === sessionId) ?? null
  const coachee = session?.coacheeId ? data.coachees.find((item) => item.id === session.coacheeId) ?? null : null
  const coacheeProfileValues = useMemo(() => getCoacheeUpsertValues(coachee), [coachee])
  const orderNumberForExport = useMemo(
    () => extractOrderNumberFallback(coachee?.clientDetails),
    [coachee?.clientDetails],
  )
  const organizationPostal = useMemo(
    () => splitPostalCodeAndCity(data.practiceSettings.postalCodeCity),
    [data.practiceSettings.postalCodeCity],
  )
  // Session.kind decides which artifact flow this detail screen should render.
  const isWrittenSession = session ? isSessionReportArtifact(session) : false
  const isRapportageOnlyView = forceRapportageOnly
  const documentLabelLower = isRapportageOnlyView ? 'rapportage' : 'samenvatting'
  const missingGenerateMessage = isRapportageOnlyView
    ? 'Wijs deze rapportage eerst aan een cliënt toe om deze te genereren.'
    : missingCoacheeGenerateError
  const missingSourceReportsMessage = isRapportageOnlyView
    ? 'Geen items binnen deze cliënt om dit document op te baseren.'
    : missingCoacheeReportsGenerateError
  const writtenReportText = data.writtenReports.find((report) => report.sessionId === sessionId)?.text ?? ''
  const summaryStructured = session?.summaryStructured ?? null
  const legacySummaryText = session?.summary ?? null
  const reportText = isWrittenSession ? writtenReportText : structuredSummaryToMarkdown(summaryStructured) || (legacySummaryText ?? '')
  const hasExistingRapportage = isRapportageOnlyView && String(reportText || '').trim().length > 0
  const hasTranscript = Boolean(session?.transcript && session.transcript.trim())
  const hasSavedAudio = Boolean(String(session?.audioBlobId || '').trim())
  const snippetsForSession = useMemo(
    () =>
      data.snippets
        .filter((snippet) => snippet.itemId === sessionId)
        .sort((a, b) => {
          if (a.date !== b.date) return a.date - b.date
          if (a.createdAtUnixMs !== b.createdAtUnixMs) return a.createdAtUnixMs - b.createdAtUnixMs
          return a.id.localeCompare(b.id)
        }),
    [data.snippets, sessionId],
  )

  const [activeTabKey, setActiveTabKey] = useState<ConversationTabKey>('summary')
  const [transcriptSearchText, setTranscriptSearchText] = useState('')
  const [editableCoacheeName, setEditableCoacheeName] = useState(coacheeName)
  const [editableSessionTitle, setEditableSessionTitle] = useState(title)
  const headerSessionTitle = isRapportageOnlyView ? 'Rapportage bewerken' : editableSessionTitle
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
  const [pendingPreviewAudioUrl, setPendingPreviewAudioUrl] = useState<string | null>(null)
  const [pendingPreviewShouldSaveAudio, setPendingPreviewShouldSaveAudio] = useState<boolean | null>(null)
  const [currentAudioSeconds, setCurrentAudioSeconds] = useState(0)
  const [currentAudioDurationSeconds, setCurrentAudioDurationSeconds] = useState<number | null>(session?.audioDurationSeconds ?? null)
  const [isSummaryEditorOpen, setIsSummaryEditorOpen] = useState(false)
  const [summaryEditorInitialValue, setSummaryEditorInitialValue] = useState(reportText)
  const [isRegenerateReportConfirmOpen, setIsRegenerateReportConfirmOpen] = useState(false)
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
  const [requiredTranscriptionSeconds, setRequiredTranscriptionSeconds] = useState(0)
  const [remainingTranscriptionSeconds, setRemainingTranscriptionSeconds] = useState(0)
  const shouldShowAudioPlayer = false
  const hasDownloadableAudio = hasSavedAudio || Boolean(pendingPreviewAudioUrl)
  const hasCurrentSessionAudioSource =
    hasSavedAudio || Boolean(pendingPreviewAudioUrl) || Number(session?.audioDurationSeconds ?? 0) > 0

  function handleAudioDurationSecondsChange(seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) return
    const roundedSeconds = Math.max(1, Math.round(seconds))
    const storedSeconds = Number.isFinite(Number(session?.audioDurationSeconds)) ? Number(session?.audioDurationSeconds) : 0
    const nextSeconds = Math.max(storedSeconds, roundedSeconds)
    setCurrentAudioDurationSeconds((previousSeconds) => {
      const previous = Number.isFinite(Number(previousSeconds)) ? Number(previousSeconds) : 0
      return Math.max(previous, nextSeconds)
    })
    if (storedSeconds > 0 && Math.abs(storedSeconds - nextSeconds) < 1) return
    updateSession(sessionId, { audioDurationSeconds: nextSeconds })
  }

  const coacheeButtonRef = useRef<any>(null)
  const backTitleButtonRef = useRef<any>(null)
  const sessionTitleInputRef = useRef<TextInput | null>(null)
  const titleEditorPanelRef = useRef<any>(null)
  const dateHoverTargetRef = useRef<any>(null)
  const dateCalendarPanelRef = useRef<any>(null)
  const templates = data.templates ?? []
  const isConversationSession = session ? isSessionConversationArtifact(session) : false
  const shouldHideTranscriptLinkedTemplates = isWrittenSession && !hasTranscript
  const templatesForSession = useMemo(() => {
    if (isRapportageOnlyView) {
      const rapportageTemplates = templates.filter((template) => !isGespreksverslagTemplate(template))
      return rapportageTemplates.length > 0 ? rapportageTemplates : templates
    }
    if (isConversationSession) {
      return templates.filter((template) => isGespreksverslagTemplate(template))
    }
    if (shouldHideTranscriptLinkedTemplates) {
      return templates.filter((template) => !isGespreksverslagTemplate(template))
    }
    return templates
  }, [isConversationSession, isRapportageOnlyView, shouldHideTranscriptLinkedTemplates, templates])
  const templatePickerTemplates = useMemo(
    () => templatesForSession.map((template) => ({ id: template.id, name: getTemplateDisplayName(template.name) })),
    [templatesForSession],
  )
  const templatePickerDefaultTemplateId = useMemo(() => templatePickerTemplates[0]?.id ?? null, [templatePickerTemplates])
  const quickQuestionTemplates = useMemo(
    () =>
      templatesForSession.map((template) => {
        const promptText = buildTemplatePromptText(template.name, template.sections)
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
    const normalizedTemplate = normalizeSummaryTemplate({
      name: selectedTemplate.name,
      sections: selectedTemplate.sections.map((section) => ({ title: section.title, description: section.description })),
    })
    const sections = normalizedTemplate.sections
      .map((section, index) => {
        const title = section.title.trim()
        const description = section.description.trim()
        if (!title && !description) return null
        return { title: title || `Onderdeel ${index + 1}`, description }
      })
      .filter((section): section is { title: string; description: string } => Boolean(section))
    if (sections.length === 0) return undefined
    return { name: normalizedTemplate.name, sections }
  }, [selectedTemplate])
  const selectedTemplateLabel = selectedTemplate ? getTemplateDisplayName(selectedTemplate.name) : 'Formulier'
  const activeTrajectoryForSession = useMemo(() => {
    const directTrajectory = session?.trajectoryId
      ? data.trajectories.find((trajectory) => trajectory.id === session.trajectoryId) ?? null
      : null
    if (directTrajectory) return directTrajectory
    if (!session?.coacheeId) return null
    return data.trajectories.find((trajectory) => trajectory.coacheeId === session.coacheeId) ?? null
  }, [data.trajectories, session?.coacheeId, session?.trajectoryId])
  const plannedActivitiesForTrajectory = useMemo(() => {
    if (!activeTrajectoryForSession) return []
    return data.activities
      .filter((activity) => activity.trajectoryId === activeTrajectoryForSession.id && activity.status === 'planned')
      .sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs)
  }, [activeTrajectoryForSession, data.activities])
  const executedActivitiesForTrajectory = useMemo(() => {
    if (!activeTrajectoryForSession) return []
    return data.activities
      .filter((activity) => activity.trajectoryId === activeTrajectoryForSession.id && activity.status === 'executed')
      .sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs)
  }, [activeTrajectoryForSession, data.activities])
  const totalExecutedHours = useMemo(
    () =>
      executedActivitiesForTrajectory.reduce((sum, activity) => {
        const hours = Number.isFinite(Number(activity.actualHours)) ? Number(activity.actualHours) : 0
        return sum + hours
      }, 0),
    [executedActivitiesForTrajectory],
  )
  const adminExecutedHours = useMemo(
    () =>
      executedActivitiesForTrajectory.reduce((sum, activity) => {
        if (!activity.isAdmin) return sum
        const hours = Number.isFinite(Number(activity.actualHours)) ? Number(activity.actualHours) : 0
        return sum + hours
      }, 0),
    [executedActivitiesForTrajectory],
  )
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
      const notes = isRapportageOnlyView ? [] : (notesBySessionId.get(relatedSession.id) ?? [])
      if (!transcript && !summary && !written && notes.length === 0) return

      const blockLines: string[] = [`Sessie: ${String(relatedSession.title || 'Onbenoemde sessie').trim() || 'Onbenoemde sessie'}`]
      if (!isRapportageOnlyView) {
        blockLines.push(`Datum: ${formatSessionDate(relatedSession.createdAtUnixMs) || '-'}`)
      }
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
  }, [data.notes, data.sessions, data.writtenReports, isRapportageOnlyView, isWrittenSession, session])
  const audioPlayerRef = useRef<AudioPlayerHandle | null>(null)
  const chatScrollRef = useRef<ScrollView | null>(null)
  const [isCoacheeMenuOpen, setIsCoacheeMenuOpen] = useState(false)
  const [coacheeMenuAnchor, setCoacheeMenuAnchor] = useState<{ left: number; top: number; width: number } | null>(null)

  const activeCoacheeNames = useMemo(() => {
    const names = data.coachees.filter((coachee) => !coachee.isArchived).map((coachee) => coachee.name)
    return names
  }, [data.coachees])
  const isCoacheeMenuVisible = isCoacheeMenuOpen
  const effectiveTranscriptionStatus = forcedTranscriptionStatus ?? (session?.transcriptionStatus ?? 'idle')
  const hasSummaryContent = Boolean(String(reportText || '').trim())
  const shouldAutoGenerateSummaryFromTranscript =
    !isRapportageOnlyView &&
    !isWrittenSession &&
    hasTranscript &&
    !hasSummaryContent &&
    effectiveTranscriptionStatus === 'idle'
  const shouldAutoGenerateSummaryFromAudio =
    !isRapportageOnlyView &&
    !isWrittenSession &&
    !hasTranscript &&
    !hasSummaryContent &&
    hasCurrentSessionAudioSource &&
    effectiveTranscriptionStatus === 'idle'
  const shouldSuppressSummaryGenerateCta =
    !isRapportageOnlyView &&
    !isWrittenSession &&
    !hasSummaryContent &&
    (effectiveTranscriptionStatus === 'transcribing' ||
      effectiveTranscriptionStatus === 'generating' ||
      shouldAutoGenerateSummaryFromTranscript ||
      shouldAutoGenerateSummaryFromAudio)
  const shouldUseTranscriptTint = hasSavedAudio || pendingPreviewShouldSaveAudio === true
  const chatOverlayOpacity = useRef(new Animated.Value(0)).current
  const chatOverlayScale = useRef(new Animated.Value(0.98)).current
  const dateMonthSlideTranslateX = useRef(new Animated.Value(0)).current
  const noMinutesCtaOpacity = useRef(new Animated.Value(0)).current
  const noMinutesCtaTranslateY = useRef(new Animated.Value(8)).current
  const selectedTemplateIdBySessionRef = useRef<Record<string, string>>({})
  const autoSummaryTriggeredSessionIdRef = useRef<string | null>(null)

  const {
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
  } = useSessieDetailChatFlow({
    buildSummaryInputWithContext,
    chatScrollRef,
    noMinutesCtaOpacity,
    noMinutesCtaTranslateY,
    readRemainingTranscriptionSeconds,
    sessionId,
    templatesForSession,
    transcript: session?.transcript ?? null,
    writtenReportText,
  })

  const {
    detectedActivitySuggestions,
    getSnippetDraftText,
    handleAiEditSnippet,
    handleAiOverwriteSnippet,
    handleApproveDetectedActivity,
    handleChangeDetectedHours,
    handleChangeSnippetText,
    handleDetectActivities,
    handleGenerateSnippets,
    handleRejectDetectedActivity,
    handleSaveSnippetText,
    isDetectingActivities,
    isGeneratingSnippets,
    setDetectedActivitySuggestions,
    snippetActionById,
  } = useSessieDetailActivitySnippetFlow({
    activityTemplates: data.activityTemplates,
    activeTrajectoryId: activeTrajectoryForSession?.id ?? null,
    createActivity,
    createSnippet,
    e2eeEnabled: Boolean(e2ee),
    itemCreatedAtUnixMs: session?.createdAtUnixMs ?? Date.now(),
    sessionId,
    showErrorToast,
    showToast,
    snippetsForSession,
    transcript: session?.transcript ?? null,
    updateSession,
    updateSnippet,
  })
  const {
    generateSummaryFromTranscript,
    handleCancelGeneration,
    handleConfirmCancelTranscription,
    handleDeleteSavedAudio,
    handleDownloadSavedAudio,
    retryTranscription,
  } = useSessieDetailTranscriptionFlow({
    buildSummaryInputWithContext,
    clearQuickQuestionsChatForSession,
    currentAudioDurationSeconds,
    deleteSession,
    e2ee,
    editableSessionTitle,
    effectiveTranscriptionStatus,
    generateStructuredSummary,
    hasTranscript,
    isDeletingAudio,
    isDownloadingAudio,
    onBack,
    pendingPreviewShouldSaveAudio,
    readRemainingTranscriptionSeconds,
    session,
    sessionId,
    setForcedTranscriptionStatus,
    setIsCancelTranscriptionModalVisible,
    setIsDeletingAudio,
    setIsDownloadingAudio,
    setIsNoMinutesModalVisible,
    setRemainingTranscriptionSeconds,
    setRequiredTranscriptionSeconds,
    updateSession,
  })
  const shouldShowQuickStart = chatMessages.length === 0
  const shouldShowClearChat = chatMessages.length > 0
  const pendingDetectedActivitiesCount = useMemo(
    () => detectedActivitySuggestions.filter((suggestion) => suggestion.decision === 'pending').length,
    [detectedActivitySuggestions],
  )

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
  const shiftVisibleDateMonth = (delta: -1 | 1) => {
    dateMonthSlideTranslateX.setValue(delta * 18)
    setVisibleDateMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + delta, 1))
    Animated.timing(dateMonthSlideTranslateX, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }
  const sessionDateLabel = useMemo(() => {
    if (session?.createdAtUnixMs) return formatSessionDate(session.createdAtUnixMs)
    return dateLabel
  }, [dateLabel, session?.createdAtUnixMs])
  const dateMenuPosition = useMemo(() => {
    if (!dateMenuAnchor) return null
    const padding = 12
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800
    const width = 336
    const estimatedHeight = 380
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

  function buildSummaryInputWithContext(sourceText: string): string {
    const transcript = String(sourceText || '').trim()
    if (!transcript) return ''

    const clientEmployerLines: string[] = []
    const parsedClientLines = formatCoacheeDetailsForPrompt(coachee?.clientDetails ?? '')
    const parsedEmployerLines = formatEmployerDetailsForPrompt(coachee?.employerDetails ?? '')
    if (parsedClientLines.length > 0) clientEmployerLines.push(...parsedClientLines)
    if (parsedEmployerLines.length > 0) clientEmployerLines.push(...parsedEmployerLines)
    const legacyClientDetails = extractLegacyProfileFallback(coachee?.clientDetails)
    const legacyEmployerDetails = extractLegacyProfileFallback(coachee?.employerDetails)
    if (parsedClientLines.length === 0 && legacyClientDetails) {
      clientEmployerLines.push(`Cliëntgegevens: ${legacyClientDetails}`)
    }
    if (parsedEmployerLines.length === 0 && legacyEmployerDetails) {
      clientEmployerLines.push(`Werkgeversgegevens: ${legacyEmployerDetails}`)
    }
    const trajectoryUwvContactName = String(activeTrajectoryForSession?.uwvContactName || '').trim()
    if (trajectoryUwvContactName) {
      clientEmployerLines.push(`UWV-contactpersoon: ${trajectoryUwvContactName}`)
    }
    const practiceValue = (value: string | null | undefined) => {
      const normalized = String(value || '').trim()
      return normalized || '-'
    }
    clientEmployerLines.push(
      `3.1 Naam organisatie: ${practiceValue(data.practiceSettings.practiceName)}`,
      `3.2 Bezoekadres: ${practiceValue(data.practiceSettings.visitAddress)}`,
      `3.3 Postadres: ${practiceValue(data.practiceSettings.postalAddress)}`,
      `3.4 Postcode en plaats: ${practiceValue(data.practiceSettings.postalCodeCity)}`,
      `3.5 Naam contactpersoon: ${practiceValue(data.practiceSettings.contactName)}`,
      `3.6 Functie contactpersoon: ${practiceValue(data.practiceSettings.contactRole)}`,
      `3.7 Telefoonnummer contactpersoon: ${practiceValue(data.practiceSettings.contactPhone)}`,
      `3.8 E-mailadres contactpersoon: ${practiceValue(data.practiceSettings.contactEmail)}`,
    )

    const wvpWeekNumber = String(session?.wvpWeekNumber || '').trim()
    const firstSickDay = String(session?.reportFirstSickDay || coachee?.firstSickDay || '').trim()

    const contextLines: string[] = ['[COACHSCRIBE_REPORT_CONTEXT]']
    contextLines.push(...clientEmployerLines.map((line) => `CLIENT_EMPLOYER_LINE=${line}`))
    if (!isRapportageOnlyView) {
      const reportDate = String(session?.reportDate || formatSessionDate(session?.createdAtUnixMs ?? Date.now()) || '').trim()
      contextLines.push(`REPORT_DATE=${reportDate}`)
    }
    contextLines.push(`WVP_WEEK_NUMBER=${wvpWeekNumber}`)
    contextLines.push(`FIRST_SICK_DAY=${firstSickDay}`)
    contextLines.push('[/COACHSCRIBE_REPORT_CONTEXT]')

    const snippetLines = snippetsForSession
      .map((snippet) => {
        const field = String(snippet.field || '').trim()
        const text = String(snippet.text || '').trim()
        if (!text) return null
        return field ? `${field}: ${text}` : text
      })
      .filter((line): line is string => Boolean(line))
    if (snippetLines.length > 0) {
      contextLines.push('[COACHSCRIBE_SNIPPETS_CONTEXT]')
      contextLines.push(...snippetLines.map((line) => `SNIPPET_LINE=${line}`))
      contextLines.push('[/COACHSCRIBE_SNIPPETS_CONTEXT]')
    }

    return `${contextLines.join('\n')}\n\n${transcript}`.trim()
  }

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
    setDateMenuAnchor({ left: rect.left, top: rect.bottom + 8, width: 336 })
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

  function handleSelectCoacheeFromMenu(name: string) {
    const nextCoacheeId = data.coachees.find((coachee) => coachee.name === name)?.id ?? session?.coacheeId ?? null
    updateSession(sessionId, { coacheeId: nextCoacheeId })
    onChangeCoachee(nextCoacheeId)
    setEditableCoacheeName(name)
    setIsCoacheeMenuOpen(false)
  }

  function handleAddNewCoacheeFromMenu() {
    setIsCoacheeMenuOpen(false)
    onOpenNewCoachee()
  }

  function handleSubmitTitleEditor() {
    applySessionTitle(editableSessionTitle)
    setIsTitleEditorOpen(false)
  }

  function handleCancelTitleEditor() {
    setEditableSessionTitle(String(session?.title || title))
    setIsTitleEditorOpen(false)
  }

  function handleSelectCalendarIsoDate(isoDate: string) {
    const [year, month, day] = isoDate.split('-').map(Number)
    const selected = new Date(year, month - 1, day)
    const nextInput = formatDateToInput(selected)
    setEditableSessionDateInput(nextInput)
    setVisibleDateMonth(new Date(year, month - 1, 1))
    setIsDateCalendarOpen(false)
    applySessionDate(nextInput)
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
    const generationSource = hasCurrentSessionAudioSource ? '' : String(trajectoryReportSourceText || '').trim()
    if (!session?.coacheeId && !generationSource) {
      showErrorToast(missingGenerateMessage, missingGenerateMessage)
      return
    }
    if (templatePickerTemplates.length === 0) {
      showErrorToast('Geen formulieren beschikbaar.', 'Geen formulieren beschikbaar.')
      return
    }
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
    setTemplatePickerSelectedTemplateId(isRapportageOnlyView ? (templatePickerDefaultTemplateId ?? null) : emptyTemplateOptionId)
    setIsTemplatePickerModalVisible(true)
  }

  function buildSummaryTemplateDraft(templateId: string): string {
    if (templateId === emptyTemplateOptionId) return ''
    const template = templates.find((item) => item.id === templateId)
    if (!template) return ''
    const normalizedTemplate = normalizeSummaryTemplate({
      name: template.name,
      sections: template.sections.map((section) => ({
        title: section.title,
        description: section.description,
      })),
    })
    const headings = normalizedTemplate.sections
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

  function handleConfirmReportRegenerate() {
    setIsRegenerateReportConfirmOpen(false)
    const templateIdForRegeneration = selectedTemplateId ?? templatePickerDefaultTemplateId ?? ''
    void generateReportForTemplate(templateIdForRegeneration)
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
    setDetectedActivitySuggestions([])
  }, [sessionId])

  useEffect(() => {
    if (!isWrittenSession) return
    if (activeTabKey !== 'transcript') return
    setActiveTabKey('summary')
  }, [activeTabKey, isWrittenSession])

  useEffect(() => {
    if (activeTabKey !== 'activities') return
    setActiveTabKey('summary')
  }, [activeTabKey])

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
    if (!initialOpenTemplatePicker) return
    openTemplatePickerForGenerate()
    onInitialTemplatePickerHandled?.()
  }, [initialOpenTemplatePicker, onInitialTemplatePickerHandled])

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


  function handleTranscriptMentionPress(seconds: number) {
    audioPlayerRef.current?.seekToSeconds(seconds)
  }

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

  const reportActions = createSessieDetailReportActions({
    activeTrajectoryForSession,
    adminExecutedHours,
    coachee,
    coacheeProfileValues,
    data: {
      sessions: data.sessions,
      practiceSettings: data.practiceSettings,
    },
    editableCoacheeName,
    editableSessionTitle,
    isRapportageOnlyView,
    isWrittenSession,
    missingGenerateMessage,
    missingSourceReportsMessage,
    orderNumberForExport,
    organizationPostal,
    plannedActivitiesForTrajectory,
    reportText,
    selectedTemplate,
    session,
    sessionId,
    setForcedTranscriptionStatus,
    setWrittenReport,
    showErrorToast,
    totalExecutedHours,
    updateSession,
    executedActivitiesForTrajectory,
  })

  async function handleExportSummaryAsWord() {
    const result = await reportActions.handleExportSummaryAsWord()
    if (result.mode === 'editor') {
      handleRequestWordEdit({ text: reportText, title: editableSessionTitle })
    }
  }

  function handleEditSummaryAction() {
    if (String(reportText || '').trim()) {
      setSummaryEditorInitialValue(reportText)
      setIsSummaryEditorOpen(true)
      return
    }
    openTemplatePickerForWrite()
  }

  function applyStructuredSummaryUpdate(markdownValue: string) {
    const trimmedValue = String(markdownValue || '').trim()
    const mappedStructured = mapReportMarkdownToStructuredSummary(trimmedValue)
    const hasStructured = hasStructuredSummaryContent(mappedStructured)
    updateSession(sessionId, {
      summaryStructured: hasStructured && mappedStructured ? mappedStructured : null,
      summary: hasStructured ? null : (trimmedValue || null),
      transcriptionStatus: (hasStructured || trimmedValue) ? 'done' : session?.transcriptionStatus ?? 'done',
      transcriptionError: null,
    })
  }

  function handleSaveSummary(value: string) {
    if (isWrittenSession) {
      setWrittenReport(sessionId, value)
      setIsSummaryEditorOpen(false)
      return
    }
    applyStructuredSummaryUpdate(value)
    setIsSummaryEditorOpen(false)
  }

  function handleUpdateSummaryFromFields(value: string) {
    if (isWrittenSession) {
      setWrittenReport(sessionId, value)
      return
    }
    applyStructuredSummaryUpdate(value)
  }

  function formatMinutesLabel(totalSeconds: number): string {
    const minutes = Math.ceil(Math.max(0, Number(totalSeconds) || 0) / 60)
    if (minutes <= 0) return 'minder dan 1 minuut'
    if (minutes === 1) return '1 minuut'
    return `${minutes} minuten`
  }

  async function generateReportForTemplate(templateId: string) {
    await reportActions.generateReportForTemplate(templateId)
  }

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const audioPlayerNode =
    shouldShowAudioPlayer && (hasSavedAudio || pendingPreviewAudioUrl) ? (
      <View style={styles.audioCardSection}>
        <AudioPlayerCard
          ref={audioPlayerRef}
          audioBlobId={session?.audioBlobId ?? null}
          audioDurationSeconds={session?.audioDurationSeconds ?? null}
          audioUrlOverride={pendingPreviewAudioUrl}
          onCurrentSecondsChange={setCurrentAudioSeconds}
          onDurationSecondsChange={handleAudioDurationSecondsChange}
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
    ) : null
  const reportPanelNode = (
    <ReportPanel
      onPressTemplate={isRapportageOnlyView && templatePickerTemplates.length > 0 && !hasExistingRapportage ? openTemplatePickerForGenerate : undefined}
      onPressRegenerate={isRapportageOnlyView && hasExistingRapportage ? () => setIsRegenerateReportConfirmOpen(true) : undefined}
      summary={reportText || null}
      summaryStructured={summaryStructured}
      hasTranscript={hasTrajectoryReportGenerationSource}
      transcriptionStatus={effectiveTranscriptionStatus}
      transcriptionError={session?.transcriptionError ?? null}
      onEditSummary={isRapportageOnlyView ? handleEditSummaryAction : undefined}
      onChangeSummary={handleUpdateSummaryFromFields}
      onShareSummary={isRapportageOnlyView ? () => handleRequestPdfEdit({ text: reportText, title: editableSessionTitle }) : undefined}
      onExportSummaryAsWord={isRapportageOnlyView ? () => {
        void handleExportSummaryAsWord()
      } : undefined}
      onRetryTranscription={shouldSuppressSummaryGenerateCta ? undefined : () => {
        if (isRapportageOnlyView && hasExistingRapportage) {
          setIsRegenerateReportConfirmOpen(true)
          return
        }
        openTemplatePickerForGenerate()
      }}
      onCancelGeneration={handleCancelGeneration}
      documentNoun={isRapportageOnlyView ? 'rapportage' : 'samenvatting'}
      suppressErrorToast={isNoMinutesModalVisible}
      showCopyAction={!isRapportageOnlyView}
      fillHeight={isRapportageOnlyView}
    />
  )
  const shouldShowDetectActivitiesPanel = !isRapportageOnlyView && hasTranscript
  const linkedActivitiesForItem = useMemo(
    () =>
      data.activities
        .filter((activity) => activity.sessionId === sessionId)
        .sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs),
    [data.activities, sessionId],
  )
  const detectedActivitiesPanelNode = shouldShowDetectActivitiesPanel ? (
    <View style={styles.detectActivitiesCard}>
      <View style={styles.detectActivitiesHeader}>
        <Text isSemibold style={styles.detectActivitiesTitle}>Activiteiten detecteren</Text>
        <Pressable
          onPress={() => {
            void handleDetectActivities()
          }}
          disabled={isDetectingActivities || !activeTrajectoryForSession}
          style={({ hovered }) => [
            styles.detectButton,
            hovered ? styles.detectButtonHovered : undefined,
            isDetectingActivities || !activeTrajectoryForSession ? styles.detectButtonDisabled : undefined,
          ]}
        >
          {isDetectingActivities ? (
            <LoadingSpinner size="small" color="#FFFFFF" />
          ) : (
            <Text isBold style={styles.detectButtonText}>
              Activiteiten detecteren
            </Text>
          )}
        </Pressable>
      </View>
      {!activeTrajectoryForSession ? (
        <Text style={styles.detectHelpText}>Koppel dit item eerst aan een trajectory.</Text>
      ) : null}
      {detectedActivitySuggestions.length > 0 ? (
        <View style={styles.detectList}>
          <Text style={styles.detectHelpText}>
            {pendingDetectedActivitiesCount > 0
              ? `${pendingDetectedActivitiesCount} voorstel(len) wachten op goedkeuren of afwijzen.`
              : 'Alle voorgestelde activiteiten zijn verwerkt.'}
          </Text>
          {detectedActivitySuggestions.map((suggestion) => (
            <View key={suggestion.id} style={styles.detectItem}>
              <View style={styles.detectItemTopRow}>
                <Text isSemibold style={styles.detectItemTitle}>
                  {suggestion.name}
                </Text>
                <Text style={styles.detectMetaText}>{Math.round(suggestion.confidence * 100)}%</Text>
              </View>
              <Text style={styles.detectMetaText}>
                {suggestion.category}
                {suggestion.templateId ? ' · sjabloon gevonden' : ' · zonder sjabloon'}
              </Text>
              {suggestion.rationale ? <Text style={styles.detectReasonText}>{suggestion.rationale}</Text> : null}
              <View style={styles.detectHoursRow}>
                <Text style={styles.detectMetaText}>Uren</Text>
                <TextInput
                  value={suggestion.editedHours}
                  onChangeText={(value) => handleChangeDetectedHours(suggestion.id, value)}
                  editable={suggestion.decision === 'pending'}
                  keyboardType="numeric"
                  style={[styles.detectHoursInput, inputWebStyle]}
                />
              </View>
              <View style={styles.detectActionsRow}>
                <Pressable
                  onPress={() => handleApproveDetectedActivity(suggestion.id)}
                  disabled={suggestion.decision !== 'pending'}
                  style={({ hovered }) => [
                    styles.detectApproveButton,
                    hovered ? styles.detectApproveButtonHovered : undefined,
                    suggestion.decision !== 'pending' ? styles.detectActionButtonDisabled : undefined,
                  ]}
                >
                  <Text isBold style={styles.detectApproveButtonText}>
                    Goedkeuren
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleRejectDetectedActivity(suggestion.id)}
                  disabled={suggestion.decision !== 'pending'}
                  style={({ hovered }) => [
                    styles.detectRejectButton,
                    hovered ? styles.detectRejectButtonHovered : undefined,
                    suggestion.decision !== 'pending' ? styles.detectActionButtonDisabled : undefined,
                  ]}
                >
                  <Text isBold style={styles.detectRejectButtonText}>
                    Afwijzen
                  </Text>
                </Pressable>
                {suggestion.decision !== 'pending' ? (
                  <Text style={styles.detectDecisionText}>
                    {suggestion.decision === 'approved' ? 'Goedgekeurd' : 'Afgewezen'}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  ) : null
  const linkedActivitiesNode = (
    <View style={styles.detectActivitiesCard}>
      <View style={styles.detectActivitiesHeader}>
        <Text isSemibold style={styles.detectActivitiesTitle}>
          Gekoppelde activiteiten
        </Text>
      </View>
      {linkedActivitiesForItem.length === 0 ? (
        <Text style={styles.detectHelpText}>Nog geen goedgekeurde activiteiten voor dit item.</Text>
      ) : (
        <View style={styles.detectList}>
          {linkedActivitiesForItem.map((activity) => (
            <View key={activity.id} style={styles.detectItem}>
              <View style={styles.detectItemTopRow}>
                <Text isSemibold style={styles.detectItemTitle}>
                  {activity.name}
                </Text>
                <Text style={styles.detectMetaText}>{activity.status === 'planned' ? 'Gepland' : 'Uitgevoerd'}</Text>
              </View>
              <Text style={styles.detectMetaText}>{activity.category}</Text>
              <View style={styles.detectActionsRow}>
                <Pressable
                  onPress={() => deleteActivity(activity.id)}
                  style={({ hovered }) => [
                    styles.detectRejectButton,
                    hovered ? styles.detectRejectButtonHovered : undefined,
                  ]}
                >
                  <Text isBold style={styles.detectRejectButtonText}>
                    Verwijderen
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
  const snippetsPanelNode = !isRapportageOnlyView ? (
    <View style={styles.detectActivitiesCard}>
      <View style={styles.detectActivitiesHeader}>
        <Text isSemibold style={styles.detectActivitiesTitle}>Snippets</Text>
        <Pressable
          onPress={() => {
            void handleGenerateSnippets()
          }}
          disabled={isGeneratingSnippets || !activeTrajectoryForSession}
          style={({ hovered }) => [
            styles.detectButton,
            hovered ? styles.detectButtonHovered : undefined,
            isGeneratingSnippets || !activeTrajectoryForSession ? styles.detectButtonDisabled : undefined,
          ]}
        >
          {isGeneratingSnippets ? (
            <LoadingSpinner size="small" color="#FFFFFF" />
          ) : (
            <Text isBold style={styles.detectButtonText}>
              Snippets genereren
            </Text>
          )}
        </Pressable>
      </View>
      {!activeTrajectoryForSession ? (
        <Text style={styles.detectHelpText}>Koppel dit item eerst aan een trajectory.</Text>
      ) : null}
      {snippetsForSession.length === 0 ? (
        <Text style={styles.detectHelpText}>Nog geen snippets voor dit item.</Text>
      ) : (
        <View style={styles.detectList}>
          {snippetsForSession.map((snippet) => {
            const currentAction = snippetActionById[snippet.id]
            const statusText =
              snippet.status === 'approved' ? 'Goedgekeurd' : snippet.status === 'rejected' ? 'Afgewezen' : 'In review'
            return (
              <View key={snippet.id} style={styles.detectItem}>
                <View style={styles.detectItemTopRow}>
                  <Text isSemibold style={styles.detectItemTitle}>
                    {snippet.field}
                  </Text>
                  <Text style={styles.detectMetaText}>{statusText}</Text>
                </View>
                <TextInput
                  value={getSnippetDraftText(snippet)}
                  onChangeText={(value) => handleChangeSnippetText(snippet.id, value)}
                  onBlur={() => handleSaveSnippetText(snippet)}
                  multiline
                  style={[styles.snippetInput, inputWebStyle]}
                />
                <View style={styles.detectActionsRow}>
                  <Pressable
                    onPress={() => updateSnippet(snippet.id, { status: 'approved' })}
                    style={({ hovered }) => [styles.detectApproveButton, hovered ? styles.detectApproveButtonHovered : undefined]}
                  >
                    <Text isBold style={styles.detectApproveButtonText}>
                      Goedkeuren
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => updateSnippet(snippet.id, { status: 'rejected' })}
                    style={({ hovered }) => [styles.detectRejectButton, hovered ? styles.detectRejectButtonHovered : undefined]}
                  >
                    <Text isBold style={styles.detectRejectButtonText}>
                      Afwijzen
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      void handleAiEditSnippet(snippet)
                    }}
                    disabled={currentAction !== undefined}
                    style={({ hovered }) => [
                      styles.detectRejectButton,
                      hovered ? styles.detectRejectButtonHovered : undefined,
                      currentAction !== undefined ? styles.detectActionButtonDisabled : undefined,
                    ]}
                  >
                    <Text isBold style={styles.detectRejectButtonText}>
                      {currentAction === 'editing' ? 'AI bewerkt...' : 'AI Edit'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      void handleAiOverwriteSnippet(snippet)
                    }}
                    disabled={currentAction !== undefined}
                    style={({ hovered }) => [
                      styles.detectRejectButton,
                      hovered ? styles.detectRejectButtonHovered : undefined,
                      currentAction !== undefined ? styles.detectActionButtonDisabled : undefined,
                    ]}
                  >
                    <Text isBold style={styles.detectRejectButtonText}>
                      {currentAction === 'overwriting' ? 'AI overschrijft...' : 'AI Overwrite'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )
          })}
        </View>
      )}
    </View>
  ) : null

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
                {headerSessionTitle}
              </Text>
            </Pressable>
          </View>

        </View>

        <TabContent
          activeTabKey={activeTabKey}
          audioDurationSeconds={currentAudioDurationSeconds ?? session?.audioDurationSeconds ?? null}
          audioPlayerNode={audioPlayerNode}
          currentAudioSeconds={currentAudioSeconds}
          detectedActivitiesPanelNode={detectedActivitiesPanelNode}
          isMobileLayout
          isRapportageOnlyView={isRapportageOnlyView}
          isWrittenSession={isWrittenSession}
          linkedActivitiesNode={linkedActivitiesNode}
          onCancelGeneration={handleCancelGeneration}
          onChangeTranscriptSearchText={setTranscriptSearchText}
          onRetryTranscription={retryTranscription}
          onSeekToSeconds={(seconds) => audioPlayerRef.current?.seekToSeconds(seconds)}
          onSelectTab={setActiveTabKey}
          reportPanelNode={reportPanelNode}
          sessionId={sessionId}
          snippetsPanelNode={snippetsPanelNode}
          suppressTranscriptErrorToast={isNoMinutesModalVisible}
          transcript={session?.transcript ?? null}
          transcriptHighlightTintColor={practiceTintColor}
          transcriptSearchText={transcriptSearchText}
          transcriptionError={session?.transcriptionError ?? null}
          transcriptionStatus={effectiveTranscriptionStatus}
          useTranscriptTintColors={shouldUseTranscriptTint}
        />

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
            const nextCoacheeId = data.coachees.find((coachee) => coachee.name === values.coacheeName)?.id ?? session?.coacheeId ?? null
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
          emptyOption={templatePickerIntent === 'write' && !isRapportageOnlyView ? { id: emptyTemplateOptionId, name: 'Leeg formulier' } : null}
          confirmLabel={templatePickerIntent === 'write' ? 'Schrijven' : 'Genereren'}
          onClose={() => setIsTemplatePickerModalVisible(false)}
          onContinue={handleTemplatePickerContinue}
        />
        <ConfirmReportRegenerateModal
          visible={isRegenerateReportConfirmOpen}
          onClose={() => setIsRegenerateReportConfirmOpen(false)}
          onConfirm={handleConfirmReportRegenerate}
        />

        <NoMinutesModal
          visible={isNoMinutesModalVisible}
          documentLabelLower={documentLabelLower}
          formattedRemainingMinutes={formatMinutesLabel(remainingTranscriptionSeconds)}
          formattedRequiredMinutes={formatMinutesLabel(requiredTranscriptionSeconds)}
          onClose={() => setIsNoMinutesModalVisible(false)}
          onOpenSubscription={() => {
            setIsNoMinutesModalVisible(false)
            onOpenMySubscription()
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
              {headerSessionTitle}
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

          {!isRapportageOnlyView && !isVerySmallLayout && !hideDate && sessionDateLabel.length > 0 ? (
            <Pressable
              ref={dateHoverTargetRef}
              onHoverIn={() => {
                const parsed = parseDateInput(editableSessionDateInput)
                if (parsed) setVisibleDateMonth(parsed)
                updateDateMenuAnchor()
                setIsDateCalendarOpen(true)
              }}
              style={({ hovered }) => [styles.dateContainer, hovered ? styles.dateContainerHovered : undefined]}
            >
              <CalendarCircleIcon size={24} />
              <Text isSemibold style={styles.dateText}>
                {sessionDateLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>

      </View>

      <TabContent
        activeTabKey={activeTabKey}
        audioDurationSeconds={currentAudioDurationSeconds ?? session?.audioDurationSeconds ?? null}
        audioPlayerNode={audioPlayerNode}
        currentAudioSeconds={currentAudioSeconds}
        detectedActivitiesPanelNode={detectedActivitiesPanelNode}
        isMobileLayout={false}
        isRapportageOnlyView={isRapportageOnlyView}
        isWrittenSession={isWrittenSession}
        linkedActivitiesNode={linkedActivitiesNode}
        onCancelGeneration={handleCancelGeneration}
        onChangeTranscriptSearchText={setTranscriptSearchText}
        onRetryTranscription={retryTranscription}
        onSeekToSeconds={(seconds) => audioPlayerRef.current?.seekToSeconds(seconds)}
        onSelectTab={setActiveTabKey}
        reportPanelNode={reportPanelNode}
        sessionId={sessionId}
        snippetsPanelNode={snippetsPanelNode}
        suppressTranscriptErrorToast={isNoMinutesModalVisible}
        transcript={session?.transcript ?? null}
        transcriptHighlightTintColor={practiceTintColor}
        transcriptSearchText={transcriptSearchText}
        transcriptionError={session?.transcriptionError ?? null}
        transcriptionStatus={effectiveTranscriptionStatus}
        useTranscriptTintColors={shouldUseTranscriptTint}
      />

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
          const nextCoacheeId = data.coachees.find((coachee) => coachee.name === values.coacheeName)?.id ?? session?.coacheeId ?? null
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
        emptyOption={templatePickerIntent === 'write' && !isRapportageOnlyView ? { id: emptyTemplateOptionId, name: 'Leeg formulier' } : null}
        confirmLabel={templatePickerIntent === 'write' ? 'Schrijven' : 'Genereren'}
        onClose={() => setIsTemplatePickerModalVisible(false)}
        onContinue={handleTemplatePickerContinue}
      />
      <ConfirmReportRegenerateModal
        visible={isRegenerateReportConfirmOpen}
        onClose={() => setIsRegenerateReportConfirmOpen(false)}
        onConfirm={handleConfirmReportRegenerate}
      />

      <RichTextEditorModal
        visible={isSummaryEditorOpen}
        title={isRapportageOnlyView ? 'Rapportage bewerken' : 'Samenvatting bewerken'}
        initialValue={summaryEditorInitialValue}
        saveLabel={isRapportageOnlyView ? 'Rapportage opslaan' : 'Samenvatting opslaan'}
        onClose={() => setIsSummaryEditorOpen(false)}
        onSave={handleSaveSummary}
      />

      <ReportContextModal
        visible={isReportContextModalVisible}
        initialValues={{
          wvpWeekNumber: session?.wvpWeekNumber ?? '',
          reportFirstSickDay: session?.reportFirstSickDay ?? '',
        }}
        onClose={() => setIsReportContextModalVisible(false)}
        onSave={(values) => {
          updateSession(sessionId, {
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
        title="Word-bestand bewerken"
        initialValue={wordEditorDraft}
        saveLabel="Exporteren naar Word"
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

      <NoMinutesModal
        visible={isNoMinutesModalVisible}
        documentLabelLower={documentLabelLower}
        formattedRemainingMinutes={formatMinutesLabel(remainingTranscriptionSeconds)}
        formattedRequiredMinutes={formatMinutesLabel(requiredTranscriptionSeconds)}
        onClose={() => setIsNoMinutesModalVisible(false)}
        onOpenSubscription={() => {
          setIsNoMinutesModalVisible(false)
          onOpenMySubscription()
        }}
      />

      <ChatOverlay
        chatMessages={chatMessages}
        chatOverlayOpacity={chatOverlayOpacity}
        chatOverlayScale={chatOverlayScale}
        chatScrollRef={chatScrollRef}
        composerText={composerText}
        editableSessionTitle={editableSessionTitle}
        isChatMaximizedRendered={isChatMaximizedRendered}
        isChatMinutesBlocked={isChatMinutesBlocked}
        isChatSending={isChatSending}
        isCheckingChatMinutes={isCheckingChatMinutes}
        isNoMinutesCtaDismissed={isNoMinutesCtaDismissed}
        noMinutesCtaOpacity={noMinutesCtaOpacity}
        noMinutesCtaTranslateY={noMinutesCtaTranslateY}
        quickQuestionTemplates={quickQuestionTemplates}
        shouldShowClearChat={shouldShowClearChat}
        shouldShowQuickStart={shouldShowQuickStart}
        onChangeComposerText={setComposerText}
        onCloseOverlay={() => setIsChatMaximized(false)}
        onDismissNoMinutesCta={() => setIsNoMinutesCtaDismissed(true)}
        onOpenMySubscription={onOpenMySubscription}
        onRequestPdfEdit={handleRequestPdfEdit}
        onRequestResetChat={requestResetChat}
        onSendChatMessage={sendChatMessage}
        onSendComposer={handleSendChatMessage}
        onTranscriptMentionPress={handleTranscriptMentionPress}
      />

      <Menus
        activeCoacheeNames={activeCoacheeNames}
        coacheeMenuPosition={coacheeMenuPosition}
        dateCalendarCells={dateCalendarCells}
        dateCalendarPanelRef={dateCalendarPanelRef}
        dateMenuPosition={dateMenuPosition}
        dateMonthSlideTranslateX={dateMonthSlideTranslateX}
        dateMonthTitle={dateMonthTitle}
        dayLabels={dayLabels}
        editableSessionTitle={editableSessionTitle}
        inputWebStyle={inputWebStyle}
        isCoacheeMenuVisible={isCoacheeMenuVisible}
        isDateCalendarOpen={isDateCalendarOpen}
        isTitleEditorOpen={isTitleEditorOpen}
        onAddNewCoachee={handleAddNewCoacheeFromMenu}
        onCancelTitleEditing={handleCancelTitleEditor}
        onChangeSessionTitle={setEditableSessionTitle}
        onSelectCalendarIsoDate={handleSelectCalendarIsoDate}
        onSelectCoacheeName={handleSelectCoacheeFromMenu}
        onShiftVisibleDateMonth={shiftVisibleDateMonth}
        onSubmitTitleEditing={handleSubmitTitleEditor}
        selectedDateIso={selectedDateIso}
        sessionTitleInputRef={sessionTitleInputRef}
        titleEditorPanelRef={titleEditorPanelRef}
        titleMenuPosition={titleMenuPosition}
      />
    </View>
  )
}




