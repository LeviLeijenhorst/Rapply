import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'

import { AnimatedDropdownPanel } from '../AnimatedDropdownPanel'
import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { useBrowserAudioRecorder } from '../../hooks/useBrowserAudioRecorder'
import { useLiveAudioWaveformBars } from '../../hooks/useLiveAudioWaveformBars'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useLocalAppData } from '../../local/LocalAppDataProvider'
import { useE2ee } from '../../e2ee/E2eeProvider'
import { colors } from '../../theme/colors'
import { webTransitionSmooth, webTransitionSlow } from '../../theme/webTransitions'
import { Text } from '../Text'
import { MicrophoneSmallIcon } from '../icons/MicrophoneSmallIcon'
import { ChevronDownIcon } from '../icons/ChevronDownIcon'
import { ModalCloseIcon } from '../icons/ModalCloseIcon'
import { MinimizeIcon } from '../icons/MinimizeIcon'
import { PauseIcon } from '../icons/PauseIcon'
import { StopSquareIcon } from '../icons/StopSquareIcon'
import { PlaySmallIcon } from '../icons/PlaySmallIcon'
import { ProfileCircleIcon } from '../icons/ProfileCircleIcon'
import { Mp3UploadIcon } from '../icons/Mp3UploadIcon'
import { VerslagSchrijvenIcon } from '../icons/VerslagSchrijvenIcon'
import { SendSquareIcon } from '../icons/SendSquareIcon'
import { FolderOpenIcon } from '../icons/FolderOpenIcon'
import { CheckmarkIcon } from '../icons/CheckmarkIcon'
import { unassignedCoacheeLabel } from '../../utils/coachee'
import { AudioPlayerCard } from '../sessionDetail/AudioPlayerCard'
import { setPendingPreviewAudio } from '../../audio/pendingPreviewStore'
import { processSessionAudio } from '../../audio/processSessionAudio'
import { AnimatedMainContent } from '../AnimatedMainContent'
import { fetchBillingStatus, type BillingStatus } from '../../services/billing'
import { clearSubscriptionReturnDraft, readAndClearSubscriptionReturnDraft, saveSubscriptionReturnDraft } from './subscriptionReturnDraftStore'
import {
  fetchTranscriptionRuntimeConfig,
  startRealtimeTranscriber,
  type RealtimeTranscriberSession,
  type TranscriptionMode,
} from '../../services/realtimeTranscription'
import { useToast } from '../../toast/ToastProvider'

type Step = 'select' | 'consent' | 'upload' | 'recording' | 'recorded'
type OptionKey = 'gesprek' | 'verslag' | 'upload' | 'schrijven'

type Props = {
  visible: boolean
  onClose: () => void
  onOpenMySubscription: () => void
  restoreDraftFromSubscriptionReturn?: boolean
  onRestoreDraftHandled?: () => void
  onStartWrittenReport: () => void
  onOpenSession: (sessionId: string) => void
  onOpenNewCoachee: () => void
  initialCoacheeId?: string | null
  newlyCreatedCoacheeId?: string | null
  onNewlyCreatedCoacheeHandled: () => void
}

const maxRecordingSeconds = 1 * 60 * 60 + 54 * 60 + 59
const recordingWarningLeadSeconds = 5 * 60
const recordingWarningStartSeconds = maxRecordingSeconds - recordingWarningLeadSeconds
const maxTranscriptionDurationSeconds = 115 * 60

function formatTimeLabel(totalSeconds: number) {
  const normalizedSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(normalizedSeconds / 3600)
  const minutes = Math.floor((normalizedSeconds % 3600) / 60)
  const seconds = normalizedSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function buildDefaultSessionTitle(existingTitles: string[]) {
  const numberedUntitledSessionPattern = /^Verslag #(\d+) \(naamloos\)$/
  let maxSessionNumber = 0

  existingTitles.forEach((title) => {
    const match = numberedUntitledSessionPattern.exec(title.trim())
    if (!match) return
    const sessionNumber = Number(match[1])
    if (!Number.isFinite(sessionNumber) || sessionNumber <= 0) return
    maxSessionNumber = Math.max(maxSessionNumber, sessionNumber)
  })

  return `Verslag #${maxSessionNumber + 1} (naamloos)`
}

const knownAudioMimeByExtension: Record<string, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  opus: 'audio/opus',
  webm: 'audio/webm',
  flac: 'audio/flac',
}

function getFileExtension(fileName: string) {
  const trimmed = String(fileName || '').trim().toLowerCase()
  const dotIndex = trimmed.lastIndexOf('.')
  if (dotIndex < 0 || dotIndex === trimmed.length - 1) return ''
  return trimmed.slice(dotIndex + 1)
}

function getAudioMimeTypeFromFile(file: File) {
  if (file.type && file.type.toLowerCase().startsWith('audio/')) {
    return file.type
  }
  const extension = getFileExtension(file.name)
  return knownAudioMimeByExtension[extension] ?? 'audio/mpeg'
}

async function readAudioDurationSeconds(blob: Blob): Promise<number | null> {
  if (typeof window === 'undefined') return null
  const audio = document.createElement('audio')
  const objectUrl = URL.createObjectURL(blob)
  audio.preload = 'metadata'
  audio.src = objectUrl

  try {
    const duration = await new Promise<number | null>((resolve) => {
      let isResolved = false
      const timeoutId = window.setTimeout(() => {
        if (isResolved) return
        isResolved = true
        resolve(null)
      }, 6000)

      const cleanup = () => {
        window.clearTimeout(timeoutId)
        audio.removeAttribute('src')
      }

      audio.onloadedmetadata = () => {
        if (isResolved) return
        isResolved = true
        const nextDuration = Number.isFinite(audio.duration) ? Math.max(0, Math.round(audio.duration)) : null
        cleanup()
        resolve(nextDuration)
      }

      audio.onerror = () => {
        if (isResolved) return
        isResolved = true
        cleanup()
        resolve(null)
      }
    })
    return duration
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function readRemainingTranscriptionSeconds(status: BillingStatus | null): number {
  if (!status) return 0
  const includedRemainingSeconds = Math.max(0, Math.floor(status.includedSeconds - status.cycleUsedSeconds))
  const nonExpiringRemainingSeconds = Math.max(0, Math.floor(status.nonExpiringTotalSeconds - status.nonExpiringUsedSeconds))
  return includedRemainingSeconds + nonExpiringRemainingSeconds
}

function normalizeFileExtensionFromMimeType(mimeType: string): string {
  const normalized = String(mimeType || '').toLowerCase()
  if (normalized.includes('wav')) return 'wav'
  if (normalized.includes('ogg') || normalized.includes('opus')) return 'ogg'
  if (normalized.includes('webm')) return 'webm'
  if (normalized.includes('mpeg') || normalized.includes('mp3')) return 'mp3'
  if (normalized.includes('mp4') || normalized.includes('m4a') || normalized.includes('aac')) return 'm4a'
  return 'mp3'
}

function formatDurationLabel(totalSeconds: number) {
  const normalizedSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(normalizedSeconds / 3600)
  const minutes = Math.floor((normalizedSeconds % 3600) / 60)
  const seconds = normalizedSeconds % 60
  const hoursLabel = String(hours).padStart(2, '0')
  const minutesLabel = String(minutes).padStart(2, '0')
  const secondsLabel = String(seconds).padStart(2, '0')
  return `${hoursLabel}:${minutesLabel}:${secondsLabel}`
}

function formatMinutesLabel(totalSeconds: number): string {
  const minutes = Math.ceil(Math.max(0, Number(totalSeconds) || 0) / 60)
  if (minutes <= 0) return 'minder dan 1 minuut'
  if (minutes === 1) return '1 minuut'
  return `${minutes} minuten`
}

function createOperationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `op_${Date.now()}_${Math.floor(Math.random() * 1_000_000_000)}`
}

export function NewSessionModal({
  visible,
  onClose,
  onOpenMySubscription,
  restoreDraftFromSubscriptionReturn = false,
  onRestoreDraftHandled,
  onStartWrittenReport,
  onOpenSession,
  onOpenNewCoachee,
  initialCoacheeId,
  newlyCreatedCoacheeId,
  onNewlyCreatedCoacheeHandled,
}: Props) {
  const isReducedMotionEnabled = useReducedMotion()
  const { data, createSession, updateSession } = useLocalAppData()
  const e2ee = useE2ee()
  const recorder = useBrowserAudioRecorder()
  const { showErrorToast } = useToast()

  const [isRendered, setIsRendered] = useState(visible)
  const [step, setStep] = useState<Step>('select')
  const [selectedOption, setSelectedOption] = useState<OptionKey | null>(null)
  const [isCoacheeOpen, setIsCoacheeOpen] = useState(false)
  const [selectedCoacheeId, setSelectedCoacheeId] = useState<string | null>(null)
  const [isReportTypeOpen, setIsReportTypeOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [sessionTitle, setSessionTitle] = useState(() => buildDefaultSessionTitle(data.sessions.map((session) => session.title)))
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null)
  const [selectedUploadFileDurationSeconds, setSelectedUploadFileDurationSeconds] = useState<number | null>(null)
  const [uploadFileDurationWarning, setUploadFileDurationWarning] = useState<string | null>(null)
  const [isUploadDragActive, setIsUploadDragActive] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMinimizedCloseWarningVisible, setIsMinimizedCloseWarningVisible] = useState(false)
  const [isRecordedCloseWarningVisible, setIsRecordedCloseWarningVisible] = useState(false)
  const [hasRecordingConsent, setHasRecordingConsent] = useState(false)
  const sessionTitleInputRef = useRef<TextInput | null>(null)
  const uploadDropAreaRef = useRef<View | null>(null)
  const isUploadDragActiveRef = useRef(false)
  const coacheeTriggerRef = useRef<any>(null)
  const reportTypeTriggerRef = useRef<any>(null)
  const hasAutoStartedRecordingRef = useRef(false)
  const hasAutoSubmittedRecordingRef = useRef(false)
  const [coacheeDropdownMaxHeight, setCoacheeDropdownMaxHeight] = useState<number | null>(null)
  const [reportTypeDropdownMaxHeight, setReportTypeDropdownMaxHeight] = useState<number | null>(null)

  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null)
  const [audioDurationSeconds, setAudioDurationSeconds] = useState<number | null>(null)
  const [shouldSaveAudio, setShouldSaveAudio] = useState(true)
  const [audioForTranscription, setAudioForTranscription] = useState<{ blob: Blob; mimeType: string } | null>(null)
  const [isInsufficientMinutesWarningVisible, setIsInsufficientMinutesWarningVisible] = useState(false)
  const [insufficientMinutesContext, setInsufficientMinutesContext] = useState<{
    remainingSeconds: number
    requiredSeconds: number
    kind: 'recording' | 'upload'
  } | null>(null)
  const [transcriptionMode, setTranscriptionMode] = useState<TranscriptionMode>('azure-fast-batch')
  const [isRealtimeTranscriberStarting, setIsRealtimeTranscriberStarting] = useState(false)
  const [liveTranscriptText, setLiveTranscriptText] = useState('')
  const [liveTranscriptError, setLiveTranscriptError] = useState<string | null>(null)
  const liveTranscriberRef = useRef<RealtimeTranscriberSession | null>(null)
  const realtimeOperationIdRef = useRef<string | null>(null)
  const { height: windowHeight, width: windowWidth } = useWindowDimensions()
  const templates = data.templates ?? []
  const defaultTemplateId = useMemo(() => {
    const standardTemplate = templates.find((template) => template.name.toLowerCase() === 'intakeverslag')
    return (standardTemplate ?? templates[0])?.id ?? null
  }, [templates])
  const selectedTemplate = useMemo(() => templates.find((template) => template.id === selectedTemplateId) ?? null, [selectedTemplateId, templates])
  const summaryTemplate = useMemo(() => {
    if (!selectedTemplate) return undefined
    const sections = selectedTemplate.sections
      .map((section) => ({ title: section.title.trim(), description: section.description }))
      .filter((section) => section.title.length > 0)
    if (sections.length === 0) return undefined
    return { name: selectedTemplate.name, sections }
  }, [selectedTemplate])

  const backdropOpacity = useRef(new Animated.Value(0)).current
  const modalOpacity = useRef(new Animated.Value(0)).current
  const modalScale = useRef(new Animated.Value(0.98)).current
  const modalTranslateY = useRef(new Animated.Value(10)).current
  const minimizeProgress = useRef(new Animated.Value(0)).current
  const [isMinimizeAnimating, setIsMinimizeAnimating] = useState(false)
  const [isRestoringFromMinimized, setIsRestoringFromMinimized] = useState(false)

  useEffect(() => {
    if (!recorder.errorMessage) return
    showErrorToast(recorder.errorMessage, 'Opnemen is mislukt. Probeer het opnieuw.')
  }, [recorder.errorMessage, showErrorToast])

  useEffect(() => {
    if (!visible) return
    if (liveTranscriberRef.current) {
      void liveTranscriberRef.current.stop()
      liveTranscriberRef.current = null
    }
    recorder.reset()
    setStep('select')
    setSelectedOption(null)
    setIsCoacheeOpen(false)
    setIsReportTypeOpen(false)
    setSelectedCoacheeId(null)
    setSelectedTemplateId(defaultTemplateId)
    setSessionTitle(buildDefaultSessionTitle(data.sessions.map((session) => session.title)))
    setSelectedAudioFile(null)
    setSelectedUploadFileDurationSeconds(null)
    setUploadFileDurationWarning(null)
    setAudioPreviewUrl(null)
    setAudioDurationSeconds(null)
    setShouldSaveAudio(true)
    setAudioForTranscription(null)
    setTranscriptionMode('azure-fast-batch')
    setIsRealtimeTranscriberStarting(false)
    setLiveTranscriptText('')
    setLiveTranscriptError(null)
    realtimeOperationIdRef.current = null
    setIsInsufficientMinutesWarningVisible(false)
    setInsufficientMinutesContext(null)
    setIsMinimized(false)
    setIsMinimizedCloseWarningVisible(false)
    setIsRecordedCloseWarningVisible(false)
    setHasRecordingConsent(false)
    setIsUploadDragActive(false)
    setCoacheeDropdownMaxHeight(null)
    setReportTypeDropdownMaxHeight(null)
    hasAutoStartedRecordingRef.current = false
    hasAutoSubmittedRecordingRef.current = false
  }, [visible])

  useEffect(() => {
    if (!visible) return
    if (!restoreDraftFromSubscriptionReturn) return
    let isCancelled = false

    void (async () => {
      try {
        const draft = await readAndClearSubscriptionReturnDraft()
        if (isCancelled) return
        if (!draft) return

        setSelectedOption(draft.selectedOption)
        setSelectedCoacheeId(draft.selectedCoacheeId)
        setSelectedTemplateId(draft.selectedTemplateId ?? defaultTemplateId)
        setSessionTitle(String(draft.sessionTitle || '').trim() || buildDefaultSessionTitle(data.sessions.map((session) => session.title)))
        setAudioDurationSeconds(draft.audioDurationSeconds)
        setShouldSaveAudio(draft.shouldSaveAudio !== false)
        setAudioForTranscription({ blob: draft.blob, mimeType: draft.mimeType || 'application/octet-stream' })
        setAudioPreviewUrl(URL.createObjectURL(draft.blob))
        setSelectedAudioFile(null)
        setSelectedUploadFileDurationSeconds(null)
        setUploadFileDurationWarning(null)
        setStep('recorded')
      } catch (error) {
        console.error('[NewSessionModal] Failed to restore subscription return draft', error)
      } finally {
        if (!isCancelled) {
          onRestoreDraftHandled?.()
        }
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [data.sessions, defaultTemplateId, onRestoreDraftHandled, restoreDraftFromSubscriptionReturn, visible])

  function buildAudioDownloadFileName(kind: 'recording' | 'upload', mimeType: string) {
    const extension = normalizeFileExtensionFromMimeType(mimeType)
    const safeTitle = String(sessionTitle || '')
      .trim()
      .replace(/[^a-z0-9_-]+/gi, '_')
      .replace(/^_+|_+$/g, '')
    const baseName = safeTitle || (kind === 'recording' ? 'opname' : 'upload')
    return `${baseName}.${extension}`
  }

  function buildUploadDurationWarning(durationSeconds: number) {
    return `Dit bestand duurt ${formatDurationLabel(durationSeconds)}. De maximale duur voor transcriptie is ${formatDurationLabel(maxTranscriptionDurationSeconds)}.`
  }

  async function validateSelectedUploadFileDuration(file: File): Promise<{ durationSeconds: number | null; warning: string | null }> {
    const durationSeconds = await readAudioDurationSeconds(file)
    if (!Number.isFinite(durationSeconds) || durationSeconds === null) {
      return { durationSeconds: null, warning: null }
    }
    if (durationSeconds > maxTranscriptionDurationSeconds) {
      return { durationSeconds, warning: buildUploadDurationWarning(durationSeconds) }
    }
    return { durationSeconds, warning: null }
  }

  async function selectUploadFile(file: File | null) {
    if (!file) return
    if (!isAudioFile(file)) return
    setSelectedAudioFile(file)
    const validation = await validateSelectedUploadFileDuration(file)
    setSelectedUploadFileDurationSeconds(validation.durationSeconds)
    setUploadFileDurationWarning(validation.warning)
  }

  function downloadCurrentAudio(kind: 'recording' | 'upload') {
    if (typeof window === 'undefined') return
    if (!audioForTranscription) return
    const objectUrl = URL.createObjectURL(audioForTranscription.blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = buildAudioDownloadFileName(kind, audioForTranscription.mimeType)
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }

  useEffect(() => {
    if (!audioPreviewUrl) return
    return () => {
      URL.revokeObjectURL(audioPreviewUrl)
    }
  }, [audioPreviewUrl])

  useEffect(() => {
    if (!defaultTemplateId) return
    if (selectedTemplateId && templates.some((template) => template.id === selectedTemplateId)) return
    setSelectedTemplateId(defaultTemplateId)
  }, [defaultTemplateId, selectedTemplateId, templates])

  useEffect(() => {
    if (!visible) return
    let isCancelled = false
    void (async () => {
      try {
        const runtimeConfig = await fetchTranscriptionRuntimeConfig()
        if (isCancelled) return
        setTranscriptionMode(runtimeConfig.mode)
      } catch (error) {
        if (isCancelled) return
        console.warn('[NewSessionModal] Failed to load transcription runtime config', error)
        setTranscriptionMode('azure-fast-batch')
      }
    })()
    return () => {
      isCancelled = true
    }
  }, [visible])

  useEffect(() => {
    return () => {
      void stopLiveTranscriber()
    }
  }, [])


  useEffect(() => {
    if (visible) setIsRendered(true)
  }, [visible])

  useEffect(() => {
    if (!visible) return
    if (typeof window === 'undefined') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      if (step === 'recording') {
        startMinimizeModal()
        return
      }
      handleClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleClose, startMinimizeModal, step, visible])

  const activeCoachees = useMemo(() => data.coachees.filter((c) => !c.isArchived), [data.coachees])

  useEffect(() => {
    if (newlyCreatedCoacheeId && visible) {
      const coachee = activeCoachees.find((c) => c.id === newlyCreatedCoacheeId)
      if (coachee) {
        setSelectedCoacheeId(newlyCreatedCoacheeId)
        setIsCoacheeOpen(false)
        onNewlyCreatedCoacheeHandled()
      }
    }
  }, [newlyCreatedCoacheeId, visible, activeCoachees, onNewlyCreatedCoacheeHandled])

  useEffect(() => {
    if (!visible) return
    if (!initialCoacheeId) return
    const coachee = activeCoachees.find((item) => item.id === initialCoacheeId)
    if (!coachee) return
    setSelectedCoacheeId(initialCoacheeId)
  }, [activeCoachees, initialCoacheeId, visible])

  useEffect(() => {
    if (!isRendered) return

    if (isReducedMotionEnabled) {
      backdropOpacity.setValue(visible ? 1 : 0)
      modalOpacity.setValue(visible ? 1 : 0)
      modalScale.setValue(1)
      modalTranslateY.setValue(0)
      if (!visible) setIsRendered(false)
      return
    }

    if (visible) {
      backdropOpacity.setValue(0)
      modalOpacity.setValue(0)
      modalScale.setValue(0.98)
      modalTranslateY.setValue(10)

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(modalScale, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(modalTranslateY, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.98,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(modalTranslateY, {
        toValue: 10,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return
      setIsRendered(false)
    })
  }, [backdropOpacity, isReducedMotionEnabled, isRendered, modalOpacity, modalScale, modalTranslateY, visible])

  const selectedCoachee = useMemo(() => {
    if (!selectedCoacheeId) return null
    return activeCoachees.find((coachee) => coachee.id === selectedCoacheeId) ?? null
  }, [activeCoachees, selectedCoacheeId])

  const coacheeOptions = useMemo(() => {
    return [{ id: null, name: unassignedCoacheeLabel }, ...activeCoachees]
  }, [activeCoachees])

  const [waveBarCount, setWaveBarCount] = useState(64)
  const bars = useMemo(() => Array.from({ length: waveBarCount }, (_, index) => index), [waveBarCount])
  const isRealtimeModeActive = transcriptionMode === 'azure-realtime-live'
  const liveWaveHeights = useLiveAudioWaveformBars({
    mediaStream: recorder.mediaStream,
    barCount: waveBarCount,
    isActive: step === 'recording' && (recorder.status === 'recording' || recorder.status === 'paused'),
  })
  const isRecordingPaused = recorder.status === 'paused'
  const isRecordingInProgress = recorder.status === 'recording' || recorder.status === 'paused'
  const displayedRecordingElapsedSeconds = isRecordingInProgress || recorder.status === 'ready' ? recorder.elapsedSeconds + 1 : recorder.elapsedSeconds
  const displayedRecordingMaxSeconds = maxRecordingSeconds + 1
  const shouldShowRecordingLimitWarning =
    step === 'recording' &&
    isRecordingInProgress &&
    recorder.elapsedSeconds >= recordingWarningStartSeconds &&
    recorder.elapsedSeconds < maxRecordingSeconds
  const recordingLimitRemainingSeconds = Math.max(0, displayedRecordingMaxSeconds - displayedRecordingElapsedSeconds)
  const shouldShowMinimized = step === 'recording' && isMinimized && !isRestoringFromMinimized


  useEffect(() => {
    if (typeof document === 'undefined') return
    if (!isRendered || shouldShowMinimized) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isRendered, shouldShowMinimized])

  const title =
    step === 'select'
      ? 'Nieuw verslag'
        : step === 'consent'
        ? 'Toestemming voor opname bevestigen'
        : step === 'upload'
          ? 'Bestand uploaden'
          : step === 'recording'
            ? 'Opnemen'
            : selectedOption === 'gesprek'
              ? 'Gesprek opgenomen'
              : 'Verslag opgenomen'
  const showFooter = step !== 'recording'
  const isUploadStep = step === 'upload'
  const isConsentStep = step === 'consent'
  const isCompactUploadFooter = isUploadStep && windowWidth <= 700
  const isCompactFooter = windowWidth <= 520
  const isCompactConsent = step === 'consent' && windowWidth <= 520
  const modalHeight = Math.min(533, windowHeight * 0.9)
  const modalWidth = Math.min(1088, windowWidth * 0.9)
  const modalTop = (windowHeight - modalHeight) / 2
  const minimizedLeft = windowWidth < 700 ? 72 : 240
  const minimizedBarWidth = Math.min(520, windowWidth * 0.7)
  const modalCenterX = windowWidth / 2
  const modalCenterY = windowHeight / 2
  const minimizedCenterX = minimizedLeft + minimizedBarWidth / 2
  const minimizedCenterY = 36
  const minimizeTranslateX = minimizedCenterX - modalCenterX
  const minimizeTranslateY = minimizedCenterY - modalCenterY
  const minimizeScaleX = minimizedBarWidth / Math.max(1, modalWidth)
  const minimizeScaleY = 40 / Math.max(1, modalHeight)
  const dropdownSafeBottom = 12
  const defaultDropdownMaxHeight = Math.max(120, windowHeight - modalTop - 72 - dropdownSafeBottom)

  function startMinimizeModal() {
    if (isMinimizeAnimating || isRestoringFromMinimized) return
    if (isReducedMotionEnabled) {
      setIsMinimized(true)
      return
    }
    setIsMinimizeAnimating(true)
    minimizeProgress.setValue(0)
    Animated.timing(minimizeProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return
      setIsMinimizeAnimating(false)
      setIsMinimized(true)
      minimizeProgress.setValue(0)
    })
  }

  function startRestoreModal() {
    if (isRestoringFromMinimized || isMinimizeAnimating) return
    if (isReducedMotionEnabled) {
      setIsMinimized(false)
      return
    }
    setIsMinimized(false)
    setIsRestoringFromMinimized(true)
    minimizeProgress.setValue(1)
    Animated.timing(minimizeProgress, {
      toValue: 0,
      duration: 220,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return
      setIsRestoringFromMinimized(false)
      minimizeProgress.setValue(0)
    })
  }

  function updateDropdownMaxHeight(targetRef: React.RefObject<any>, setMaxHeight: (value: number) => void) {
    if (typeof window === 'undefined') {
      setMaxHeight(defaultDropdownMaxHeight)
      return
    }
    const target = targetRef.current
    if (!target?.measureInWindow) {
      setMaxHeight(defaultDropdownMaxHeight)
      return
    }
    target.measureInWindow((x: number, y: number, width: number, height: number) => {
      const availableHeight = windowHeight - (y + height) - dropdownSafeBottom
      const nextHeight = Math.max(120, availableHeight)
      setMaxHeight(nextHeight)
    })
  }

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (!isCoacheeOpen && !isReportTypeOpen) return

    const coacheeTriggerId = 'new-session-coachee-trigger'
    const coacheePanelId = 'new-session-coachee-panel'
    const reportTriggerId = 'new-session-report-trigger'
    const reportPanelId = 'new-session-report-panel'

    const isInside = (id: string, target: Node | null) => {
      if (!target) return false
      const element = document.getElementById(id)
      return !!element && element.contains(target)
    }

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (isInside(coacheeTriggerId, target) || isInside(coacheePanelId, target) || isInside(reportTriggerId, target) || isInside(reportPanelId, target)) {
        return
      }
      setIsCoacheeOpen(false)
      setIsReportTypeOpen(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isCoacheeOpen, isReportTypeOpen])

  function openFilePicker() {
    if (typeof document === 'undefined') return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'audio/*,.mp3,.m4a,.mp4,.aac,.wav,.ogg,.opus,.webm,.flac'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      void selectUploadFile(file)
    }
    input.click()
  }

  function openConsentHelpPage() {
    if (typeof window === 'undefined') return
    window.open('https://www.coachscribe.nl/toestemming-vragen', '_blank', 'noopener,noreferrer')
  }

  function isAudioFile(file: File) {
    if (!file) return false
    if (file.type && file.type.toLowerCase().startsWith('audio/')) return true
    const extension = getFileExtension(file.name)
    return Boolean(knownAudioMimeByExtension[extension])
  }

  function handleDroppedFile(file: File | null) {
    void selectUploadFile(file)
  }

  useEffect(() => {
    if (!visible || step !== 'upload') return
    if (typeof window === 'undefined') return

    const isOverDropArea = (event: DragEvent) => {
      const rect = (uploadDropAreaRef.current as any)?.getBoundingClientRect?.()
      if (!rect) return false
      const x = event.clientX
      const y = event.clientY
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    }

    const extractFileFromDrop = (event: DragEvent) => {
      const fileFromFiles = event.dataTransfer?.files?.[0]
      if (fileFromFiles) return fileFromFiles
      const items = event.dataTransfer?.items ?? []
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index]
        if (item.kind !== 'file') continue
        const file = item.getAsFile()
        if (file) return file
      }
      return null
    }

    const onDragOver = (event: DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy'
      }
      const isInside = isOverDropArea(event)
      if (isInside && !isUploadDragActiveRef.current) {
        console.log('[NewSessionModal] Drag over upload area')
      }
      isUploadDragActiveRef.current = isInside
      setIsUploadDragActive(isInside)
    }

    const onDragLeave = (event: DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      if (!isOverDropArea(event)) {
        setIsUploadDragActive(false)
      }
    }

    const onDrop = (event: DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      const isInside = isOverDropArea(event)
      console.log('[NewSessionModal] Drop event', { isInside, filesCount: event.dataTransfer?.files?.length ?? 0 })
      setIsUploadDragActive(false)
      if (!isInside) return
      const file = extractFileFromDrop(event)
      handleDroppedFile(file)
    }

    window.addEventListener('dragover', onDragOver, true)
    window.addEventListener('dragleave', onDragLeave, true)
    window.addEventListener('drop', onDrop, true)
    return () => {
      window.removeEventListener('dragover', onDragOver, true)
      window.removeEventListener('dragleave', onDragLeave, true)
      window.removeEventListener('drop', onDrop, true)
    }
  }, [handleDroppedFile, step, visible])

  async function saveSelectedFileToAudioStore() {
    if (!selectedAudioFile) return
    const detectedDurationSeconds =
      selectedUploadFileDurationSeconds !== null ? selectedUploadFileDurationSeconds : await readAudioDurationSeconds(selectedAudioFile)
    if (Number.isFinite(detectedDurationSeconds) && detectedDurationSeconds !== null && detectedDurationSeconds > maxTranscriptionDurationSeconds) {
      setUploadFileDurationWarning(buildUploadDurationWarning(detectedDurationSeconds))
      return
    }
    setAudioDurationSeconds(detectedDurationSeconds)
    setUploadFileDurationWarning(null)
    const mimeType = getAudioMimeTypeFromFile(selectedAudioFile)
    setAudioForTranscription({ blob: selectedAudioFile, mimeType })
    setAudioPreviewUrl(URL.createObjectURL(selectedAudioFile))
    setStep('recorded')
  }

  function handleClose() {
    recorder.reset()
    setAudioPreviewUrl(null)
    setSelectedAudioFile(null)
    setShouldSaveAudio(false)
    setAudioForTranscription(null)
    setIsMinimizedCloseWarningVisible(false)
    setIsRecordedCloseWarningVisible(false)
    void clearSubscriptionReturnDraft()
    onClose()
  }

  function shouldConfirmRecordedClose() {
    if (step !== 'recorded') return false
    return Boolean(audioForTranscription || selectedAudioFile || audioPreviewUrl)
  }

  function requestClose() {
    if (shouldConfirmRecordedClose()) {
      setIsRecordedCloseWarningVisible(true)
      return
    }
    handleClose()
  }

  function handleBackdropPress() {
    if (step === 'recording') {
      startMinimizeModal()
      return
    }
    requestClose()
  }

  async function readRemainingSecondsBeforeStart(): Promise<number | null> {
    try {
      const response = await fetchBillingStatus()
      return readRemainingTranscriptionSeconds(response?.billingStatus ?? null)
    } catch (error) {
      console.error('[NewSessionModal] Failed to read billing status', error)
      return null
    }
  }

  async function stopLiveTranscriber() {
    const activeTranscriber = liveTranscriberRef.current
    if (!activeTranscriber) return
    liveTranscriberRef.current = null
    setIsRealtimeTranscriberStarting(false)
    await activeTranscriber.stop().catch(() => undefined)
  }

  async function createAndOpenSessionInternal(
    values: { kind: 'recording' | 'upload' },
    options?: {
      overrideShouldSaveAudio?: boolean
      audioForTranscription?: { blob: Blob; mimeType: string }
      recordingDurationSeconds?: number | null
    },
  ): Promise<boolean> {
    const resolvedAudioForTranscription = options?.audioForTranscription ?? audioForTranscription
    if (!resolvedAudioForTranscription) return false
    const effectiveShouldSaveAudio = options?.overrideShouldSaveAudio ?? shouldSaveAudio
    const nextAudioDurationSeconds =
      values.kind === 'recording'
        ? Math.max(0, options?.recordingDurationSeconds ?? recorder.elapsedSeconds)
        : (Number.isFinite(audioDurationSeconds) ? audioDurationSeconds : null)

    const createdSessionId = createSession({
      coacheeId: selectedCoachee?.id ?? null,
      title: sessionTitle,
      kind: values.kind,
      audioBlobId: null,
      audioDurationSeconds: nextAudioDurationSeconds,
      uploadFileName: values.kind === 'upload' ? selectedAudioFile?.name ?? null : null,
      transcriptionStatus: 'transcribing',
      transcriptionError: null,
    })

    if (!createdSessionId) return false

    try {
      await setPendingPreviewAudio({
        sessionId: createdSessionId,
        blob: resolvedAudioForTranscription.blob,
        mimeType: resolvedAudioForTranscription.mimeType,
        shouldSaveAudio: effectiveShouldSaveAudio,
        summaryTemplate,
      })
    } catch (error) {
      console.error('[NewSessionModal] Failed to persist raw audio preview', error)
    }

    const nextAudioForTranscription = resolvedAudioForTranscription
    const realtimeChargeOperationId = isRealtimeModeActive ? (realtimeOperationIdRef.current || createOperationId()) : null
    if (isRealtimeModeActive && realtimeChargeOperationId) {
      realtimeOperationIdRef.current = realtimeChargeOperationId
    }
    onOpenSession(createdSessionId)
    void clearSubscriptionReturnDraft()
    handleClose()

    void processSessionAudio({
      sessionId: createdSessionId,
      audioBlob: nextAudioForTranscription.blob,
      mimeType: nextAudioForTranscription.mimeType,
      shouldSaveAudio: effectiveShouldSaveAudio,
      transcriptOverride: isRealtimeModeActive ? liveTranscriptText.trim() : null,
      realtimeCharge:
        isRealtimeModeActive
          ? {
              operationId: String(realtimeChargeOperationId || ''),
              durationSeconds: Math.max(1, Math.ceil(nextAudioDurationSeconds || 0)),
            }
          : null,
      summaryTemplate,
      initialAudioBlobId: null,
      e2ee,
      updateSession,
    }).catch((error) => {
      console.error('[NewSessionModal] Session audio processing failed', { sessionId: createdSessionId, error })
    })
    realtimeOperationIdRef.current = null
    return true
  }

  async function createAndOpenSession(
    values: { kind: 'recording' | 'upload' },
    options?: {
      overrideShouldSaveAudio?: boolean
      audioForTranscription?: { blob: Blob; mimeType: string }
      recordingDurationSeconds?: number | null
    },
  ): Promise<boolean> {
    const resolvedAudioForTranscription = options?.audioForTranscription ?? audioForTranscription
    if (!resolvedAudioForTranscription) return false
    const requiredSeconds = Math.max(
      1,
      Math.ceil(values.kind === 'recording' ? (options?.recordingDurationSeconds ?? recorder.elapsedSeconds) : audioDurationSeconds || 0),
    )
    const remainingSeconds = await readRemainingSecondsBeforeStart()
    if (remainingSeconds !== null && remainingSeconds < requiredSeconds) {
      setInsufficientMinutesContext({ kind: values.kind, remainingSeconds, requiredSeconds })
      setIsInsufficientMinutesWarningVisible(true)
      return false
    }
    return createAndOpenSessionInternal(values, { ...options, audioForTranscription: resolvedAudioForTranscription })
  }

  useEffect(() => {
    if (step !== 'recording') {
      hasAutoStartedRecordingRef.current = false
      hasAutoSubmittedRecordingRef.current = false
    }
  }, [step])

  useEffect(() => {
    if (!visible) return
    if (step !== 'recording') return
    if (hasAutoStartedRecordingRef.current) return
    if (recorder.status !== 'idle') return
    if (isRealtimeModeActive) {
      realtimeOperationIdRef.current = createOperationId()
      setLiveTranscriptText('')
      setLiveTranscriptError(null)
    }
    hasAutoStartedRecordingRef.current = true
    recorder.start()
  }, [isRealtimeModeActive, recorder, step, visible])

  useEffect(() => {
    if (!visible) return
    if (step !== 'recording') return
    if (recorder.status !== 'recording' && recorder.status !== 'paused') return
    if (recorder.elapsedSeconds < maxRecordingSeconds) return
    recorder.stop()
  }, [recorder, recorder.elapsedSeconds, recorder.status, step, visible])

  useEffect(() => {
    const shouldRunRealtime =
      visible &&
      step === 'recording' &&
      recorder.status === 'recording' &&
      isRealtimeModeActive

    if (!shouldRunRealtime) {
      void stopLiveTranscriber()
      return
    }
    if (liveTranscriberRef.current || isRealtimeTranscriberStarting) return

    let cancelled = false
    setIsRealtimeTranscriberStarting(true)
    setLiveTranscriptError(null)

    void startRealtimeTranscriber({
      languageCode: 'nl',
      onFinalSegment: (segment) => {
        if (cancelled) return
        const line = `${segment.speaker}: ${segment.text}`.trim()
        if (!line) return
        setLiveTranscriptText((prev) => (prev ? `${prev}\n${line}` : line))
      },
      onError: (message) => {
        if (cancelled) return
        setLiveTranscriptError(message)
      },
    })
      .then((session) => {
        if (cancelled) {
          void session.stop()
          return
        }
        liveTranscriberRef.current = session
      })
      .catch((error) => {
        if (cancelled) return
        setLiveTranscriptError(error instanceof Error ? error.message : String(error || 'Realtime transcriptie is mislukt.'))
      })
      .finally(() => {
        if (!cancelled) {
          setIsRealtimeTranscriberStarting(false)
        }
      })

    return () => {
      cancelled = true
      void stopLiveTranscriber()
    }
  }, [isRealtimeModeActive, recorder.status, step, visible])

  function retryRecordingAfterError() {
    recorder.reset()
    if (isRealtimeModeActive) {
      realtimeOperationIdRef.current = createOperationId()
      setLiveTranscriptText('')
      setLiveTranscriptError(null)
    }
    hasAutoStartedRecordingRef.current = true
    hasAutoSubmittedRecordingRef.current = false
    recorder.start()
  }

  useEffect(() => {
    if (!visible) return
    if (step !== 'recording') {
      setIsMinimized(false)
    }
  }, [step, visible])

  useEffect(() => {
    if (step !== 'recording') return
    if (recorder.status !== 'ready') return
    if (!recorder.recordedBlob || !recorder.recordedMimeType) return

    const blob = recorder.recordedBlob as Blob
    const mimeType = recorder.recordedMimeType as string
    const recordingDurationSeconds = Math.max(0, recorder.elapsedSeconds)
    setAudioForTranscription({ blob, mimeType })
    setAudioDurationSeconds(recordingDurationSeconds)
    setAudioPreviewUrl(URL.createObjectURL(blob))
    hasAutoSubmittedRecordingRef.current = false
    setStep('recorded')
  }, [recorder.elapsedSeconds, recorder.recordedBlob, recorder.recordedMimeType, recorder.status, selectedOption, step])

  if (!isRendered) return null

  if (shouldShowMinimized) {
    return (
      <>
        <View style={styles.minimizedOverlay} pointerEvents="box-none">
          {/* Minimized recording bar */}
          <Pressable onPress={startRestoreModal} style={styles.minimizedBar}>
            <View style={styles.minimizedInfo}>
              {/* Recording time */}
              <View style={styles.minimizedTimeContainer}>
                <Text isSemibold style={styles.minimizedTimeText}>
                  {formatTimeLabel(displayedRecordingElapsedSeconds)}
                </Text>
              </View>
              {/* Recording waveform */}
              <View style={styles.minimizedWaveform}>
                {bars.map((index) => {
                  const rawHeight = liveWaveHeights[index] ?? 6
                  if (rawHeight <= 8) {
                    return <View key={index} style={[styles.minimizedWaveBar, styles.minimizedWaveBarSilent]} />
                  }
                  const normalizedHeight = Math.min(1, Math.max(0, (rawHeight - 6) / 194))
                  const height = 4 + normalizedHeight * 12
                  return <View key={index} style={[styles.minimizedWaveBar, { height }]} />
                })}
              </View>
            </View>
            {/* Minimized controls */}
            <View style={styles.minimizedControls}>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation?.()
                  if (recorder.status === 'recording') {
                    recorder.pause()
                    return
                  }
                  if (recorder.status === 'paused') {
                    recorder.resume()
                  }
                }}
                style={({ hovered }) => [
                  styles.minimizedControlButton,
                  styles.minimizedSoftButton,
                  hovered ? styles.minimizedSoftButtonHovered : undefined,
                ]}
              >
                {/* Pause or play */}
                {isRecordingPaused ? (
                  <View style={styles.minimizedPlayIconWrapper}>
                    <PlaySmallIcon size={10} />
                  </View>
                ) : (
                  <PauseIcon size={12} />
                )}
              </Pressable>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation?.()
                  if (recorder.status === 'error') {
                    retryRecordingAfterError()
                    return
                  }
                  recorder.stop()
                }}
                style={({ hovered }) => [styles.minimizedStopButton, hovered ? styles.minimizedStopButtonHovered : undefined]}
              >
                {/* Stop */}
                <StopSquareIcon size={12} />
              </Pressable>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation?.()
                  setIsMinimizedCloseWarningVisible(true)
                }}
                style={({ hovered }) => [
                  styles.minimizedControlButton,
                  styles.minimizedSoftButton,
                  hovered ? styles.minimizedSoftButtonHovered : undefined,
                ]}
              >
                {/* Close */}
                <ModalCloseIcon size={22} />
              </Pressable>
            </View>
          </Pressable>
        </View>

        <AnimatedOverlayModal
          visible={isMinimizedCloseWarningVisible}
          onClose={() => setIsMinimizedCloseWarningVisible(false)}
          contentContainerStyle={styles.closeWarningContainer}
        >
          {/* Close warning */}
          <View style={styles.closeWarningContent}>
            {/* Warning title */}
            <Text isBold style={styles.closeWarningTitle}>
              Weet je zeker dat je wil sluiten?
            </Text>
            {/* Warning text */}
            <Text style={styles.closeWarningText}>
              Als je sluit, gaat je huidige opname of invoer verloren.
            </Text>
            {/* Warning actions */}
            <View style={styles.closeWarningActions}>
              <Pressable
                onPress={() => setIsMinimizedCloseWarningVisible(false)}
                style={({ hovered }) => [
                  styles.closeWarningButton,
                  styles.closeWarningButtonSecondary,
                  hovered ? styles.closeWarningButtonSecondaryHovered : undefined,
                ]}
              >
                {/* Keep */}
                <Text isBold style={styles.closeWarningButtonSecondaryText}>
                  Annuleren
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setIsMinimizedCloseWarningVisible(false)
                  handleClose()
                }}
                style={({ hovered }) => [
                  styles.closeWarningButton,
                  styles.closeWarningButtonPrimary,
                  hovered ? styles.closeWarningButtonPrimaryHovered : undefined,
                ]}
              >
                {/* Close */}
                <Text isBold style={styles.closeWarningButtonPrimaryText}>
                  Sluiten
                </Text>
              </Pressable>
            </View>
          </View>
        </AnimatedOverlayModal>
      </>
    )
  }
  return (
    <View style={styles.overlay} pointerEvents="auto">
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} pointerEvents="none" />
      <Pressable onPress={handleBackdropPress} style={styles.backdropPressable} pointerEvents="auto" />
      <Animated.View
        pointerEvents="auto"
        style={[
          styles.container,
          {
            opacity: modalOpacity,
            transform: [
              { translateY: modalTranslateY },
              { scale: modalScale },
              {
                translateX: minimizeProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, minimizeTranslateX],
                }),
              },
              {
                translateY: minimizeProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, minimizeTranslateY],
                }),
              },
              {
                scaleX: minimizeProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, minimizeScaleX],
                }),
              },
              {
                scaleY: minimizeProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, minimizeScaleY],
                }),
              },
            ],
          },
        ]}
      >
        {/* Modal header */}
        <View style={styles.header}>
          <Text isBold style={styles.headerTitle}>
            {title}
          </Text>

          <View style={styles.headerRight}>
            {step === 'recording' ? (
              <>
                <Pressable
                  onPress={startMinimizeModal}
                  style={({ hovered }) => [styles.iconButton, webTransitionSmooth, hovered ? styles.iconButtonHovered : undefined]}
                >
                  {/* Minimize */}
                  <MinimizeIcon />
                </Pressable>
              </>
            ) : null}

            {step === 'recorded' ? (
              <Text style={styles.headerMetaText}>Jan 22 2026, 19:28</Text>
            ) : null}

          </View>
        </View>

        {step === 'recording' && shouldShowRecordingLimitWarning ? (
          <View pointerEvents="none" style={styles.recordingWarningOverlay}>
            <View style={styles.recordingWarningBanner}>
              <Text isSemibold style={styles.recordingWarningTitle}>
                Opname stopt over {formatTimeLabel(recordingLimitRemainingSeconds)}
              </Text>
              <Text style={styles.recordingWarningText}>Maximum opnametijd is {formatTimeLabel(displayedRecordingMaxSeconds)}.</Text>
            </View>
          </View>
        ) : null}

        {/* Modal body */}
        <View style={styles.body}>
          <AnimatedMainContent contentKey={step} style={styles.stepContent}>
            {step === 'select' ? (
            <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.selectList}>
                <SessionOptionRow
                  label="Gesprek opnemen"
                  isSelected={selectedOption === 'gesprek'}
                  onPress={() => setSelectedOption('gesprek')}
                  leftIcon={<MicrophoneSmallIcon color={colors.textStrong} size={20} />}
                />
                <SessionOptionRow
                  label="Verslag opnemen"
                  isSelected={selectedOption === 'verslag'}
                  onPress={() => setSelectedOption('verslag')}
                  leftIcon={<MicrophoneSmallIcon color={colors.textStrong} size={20} />}
                />
                <SessionOptionRow
                  label="Bestand uploaden"
                  isSelected={selectedOption === 'upload'}
                  onPress={() => setSelectedOption('upload')}
                  leftIcon={<Mp3UploadIcon />}
                />
                <SessionOptionRow
                  label="Verslag schrijven"
                  isSelected={selectedOption === 'schrijven'}
                  onPress={() => setSelectedOption('schrijven')}
                  leftIcon={<VerslagSchrijvenIcon />}
                />
              </View>
            </ScrollView>
            ) : null}

            {step === 'upload' ? (
            <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.uploadBody}>
                {/* Upload drop area */}
                <View ref={uploadDropAreaRef} style={[styles.uploadDropArea, isUploadDragActive ? styles.uploadDropAreaActive : undefined]}>
                  <Pressable
                    onPress={openFilePicker}
                    style={({ hovered }) => [styles.uploadPressable, hovered ? styles.uploadDropAreaHovered : undefined]}
                  >
                    <View style={styles.uploadCenter}>
                      {/* Upload icon */}
                      <SendSquareIcon size={80} color="#656565" />
                      <Text isSemibold style={styles.uploadHintText}>
                        Sleep bestand hierin
                      </Text>
                      {selectedAudioFile ? (
                        <Text style={styles.uploadFileNameText} numberOfLines={1}>
                          {selectedAudioFile.name}
                        </Text>
                      ) : null}
                      {uploadFileDurationWarning ? (
                        <Text style={styles.uploadDurationWarningText}>{uploadFileDurationWarning}</Text>
                      ) : null}
                    </View>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
            ) : null}

            {step === 'recording' ? (
            <View style={styles.recordingBody}>
              {/* Recording waveform */}
              <View
                style={styles.waveformContainer}
                onLayout={(event) => {
                  const width = event.nativeEvent.layout.width
                  const padding = 48
                  const barWidth = 8
                  const gap = 8
                  const available = Math.max(0, width - padding * 2)
                  const nextCount = Math.max(10, Math.floor((available + gap) / (barWidth + gap)))
                  if (nextCount !== waveBarCount) setWaveBarCount(nextCount)
                }}
              >
                {bars.map((index) => {
                  const rawHeight = liveWaveHeights[index] ?? 8
                  const height = rawHeight <= 8 ? 8 : rawHeight
                  return <View key={index} style={[styles.waveBar, { height, borderRadius: height <= 8 ? 4 : 8 }]} />
                })}
              </View>

              {/* Recording timer */}
              <Text isSemibold style={styles.timerText}>
                {formatTimeLabel(displayedRecordingElapsedSeconds)}
              </Text>

              {/* Recording controls */}
              <View style={styles.recordingControls}>
                <Pressable
                  onPress={() => {
                    recorder.reset()
                    setStep('select')
                  }}
                  style={({ hovered }) => [styles.softCircle, hovered ? styles.softCircleHovered : undefined]}
                >
                  {/* Cancel */}
                  <ModalCloseIcon size={55} />
                </Pressable>

                <Pressable
                  onPress={() => {
                    if (recorder.status === 'error') {
                      retryRecordingAfterError()
                      return
                    }
                    recorder.stop()
                  }}
                  style={({ hovered }) => [styles.primaryCircle, webTransitionSmooth, hovered ? styles.primaryCircleHovered : undefined]}
                >
                  {/* Stop */}
                  <StopSquareIcon />
                </Pressable>

                <Pressable
                  onPress={() => {
                    if (recorder.status === 'recording') {
                      recorder.pause()
                      return
                    }
                    if (recorder.status === 'paused') {
                      recorder.resume()
                    }
                  }}
                  style={({ hovered }) => [styles.softCircle, hovered ? styles.softCircleHovered : undefined]}
                >
                  {/* Pause or play */}
                  {isRecordingPaused ? <PlaySmallIcon size={24} /> : <PauseIcon />}
                </Pressable>
              </View>

            </View>
            ) : null}

            {step === 'recorded' ? (
            <View style={styles.recordedBody}>
              {audioPreviewUrl ? (
                <View style={styles.audioPreviewCard}>
                  {/* Audio preview */}
                  <AudioPlayerCard
                    audioBlobId={null}
                    audioDurationSeconds={audioDurationSeconds}
                    audioUrlOverride={audioPreviewUrl}
                  />
                  <Pressable
                    onPress={() => setShouldSaveAudio((value) => !value)}
                    style={({ hovered }) => [styles.audioSaveToggleRow, hovered ? styles.audioSaveToggleRowHovered : undefined]}
                  >
                    <Text isSemibold style={styles.audioSaveToggleLabel}>
                      Audio opslaan
                    </Text>
                    <View style={[styles.audioSaveToggleTrack, shouldSaveAudio ? styles.audioSaveToggleTrackOn : styles.audioSaveToggleTrackOff]}>
                      <View style={[styles.audioSaveToggleThumb, shouldSaveAudio ? styles.audioSaveToggleThumbOn : styles.audioSaveToggleThumbOff]} />
                    </View>
                  </Pressable>
                </View>
              ) : null}
              <Pressable
                onPress={() => sessionTitleInputRef.current?.focus()}
                style={styles.infoRow}
              >
                {/* Session name */}
                <MicrophoneSmallIcon color={colors.textStrong} size={20} />
                <TextInput
                  ref={sessionTitleInputRef}
                  value={sessionTitle}
                  onChangeText={setSessionTitle}
                  placeholder="Verslagnaam..."
                  placeholderTextColor="#656565"
                  style={[styles.sessionTitleInput, ({ outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any)]}
                />
              </Pressable>

              <View style={styles.recordedDropdownsRow}>
                <View style={[styles.dropdownArea, styles.dropdownAreaHalf, isCoacheeOpen ? styles.dropdownAreaRaised : undefined]}>
                  <Pressable
                    ref={coacheeTriggerRef}
                    id="new-session-coachee-trigger"
                    onPress={() => {
                      updateDropdownMaxHeight(coacheeTriggerRef, setCoacheeDropdownMaxHeight)
                      setIsCoacheeOpen((value) => !value)
                      setIsReportTypeOpen(false)
                    }}
                    style={({ hovered }) => [styles.infoRow, hovered ? styles.infoRowHovered : undefined]}
                  >
                    {/* Coachee */}
                    <ProfileCircleIcon />
                    <Text isSemibold style={styles.infoRowText}>
                      {selectedCoachee?.name ?? unassignedCoacheeLabel}
                    </Text>
                    <View style={styles.infoRowSpacer} />
                    <ChevronDownIcon color={colors.textStrong} size={20} />
                  </Pressable>

                  <AnimatedDropdownPanel
                    visible={isCoacheeOpen}
                    id="new-session-coachee-panel"
                    style={[styles.coacheePanel, { maxHeight: coacheeDropdownMaxHeight ?? defaultDropdownMaxHeight }]}
                  >
                    <ScrollView style={styles.coacheeList} contentContainerStyle={styles.coacheeListContent} showsVerticalScrollIndicator={false}>
                      {coacheeOptions.map((coachee, index) => {
                        const isFirst = index === 0
                        return (
                          <Pressable
                            key={coachee.id ?? 'coachee-unassigned'}
                            onPress={() => {
                              setSelectedCoacheeId(coachee.id)
                              setIsCoacheeOpen(false)
                            }}
                            style={({ hovered }) => [
                              styles.coacheeItem,
                              isFirst ? styles.coacheeItemTop : undefined,
                              hovered ? styles.coacheeItemHovered : undefined,
                            ]}
                          >
                            {/* Coachee list item */}
                            <ProfileCircleIcon />
                            <Text style={styles.coacheeItemText}>{coachee.name}</Text>
                          </Pressable>
                        )
                      })}
                      <Pressable
                        onPress={() => {
                          setIsCoacheeOpen(false)
                          onOpenNewCoachee()
                        }}
                        style={({ hovered }) => [
                          styles.coacheeItem,
                          styles.coacheeItemAdd,
                          coacheeOptions.length === 0 ? styles.coacheeItemTop : undefined,
                          styles.coacheeItemBottom,
                          hovered ? styles.coacheeItemAddHovered : undefined,
                        ]}
                      >
                        {/* Add client */}
                        <ProfileCircleIcon />
                        <Text style={styles.coacheeItemAddText}>+ Nieuwe cliënt</Text>
                      </Pressable>
                    </ScrollView>
                  </AnimatedDropdownPanel>
                </View>

                <View style={[styles.dropdownArea, styles.dropdownAreaHalf, isReportTypeOpen ? styles.dropdownAreaRaised : undefined]}>
                  <Pressable
                    ref={reportTypeTriggerRef}
                    id="new-session-report-trigger"
                    onPress={() => {
                      updateDropdownMaxHeight(reportTypeTriggerRef, setReportTypeDropdownMaxHeight)
                      setIsReportTypeOpen((value) => !value)
                      setIsCoacheeOpen(false)
                    }}
                    style={({ hovered }) => [styles.infoRow, hovered ? styles.infoRowHovered : undefined]}
                  >
                    {/* Report type */}
                    <VerslagSchrijvenIcon />
                    <Text isSemibold style={styles.infoRowText}>
                      {selectedTemplate?.name ?? 'Template'}
                    </Text>
                    <View style={styles.infoRowSpacer} />
                    <ChevronDownIcon color={colors.textStrong} size={20} />
                  </Pressable>

                  <AnimatedDropdownPanel
                    visible={isReportTypeOpen}
                    id="new-session-report-panel"
                    style={[styles.reportTypePanel, { maxHeight: reportTypeDropdownMaxHeight ?? defaultDropdownMaxHeight }]}
                  >
                    <ScrollView style={styles.reportTypeList} contentContainerStyle={styles.reportTypeListContent} showsVerticalScrollIndicator={false}>
                      {templates.map((template, index, items) => {
                        const isFirst = index === 0
                        const isLast = index === items.length - 1
                        return (
                          <Pressable
                            key={template.id}
                            onPress={() => {
                              setSelectedTemplateId(template.id)
                              setIsReportTypeOpen(false)
                            }}
                            style={({ hovered }) => [
                              styles.reportTypeItem,
                              isFirst ? styles.reportTypeItemTop : undefined,
                              isLast ? styles.reportTypeItemBottom : undefined,
                              hovered ? styles.reportTypeItemHovered : undefined,
                            ]}
                          >
                            {/* Report type item */}
                            <Text style={styles.reportTypeItemText}>{template.name}</Text>
                          </Pressable>
                        )
                      })}
                    </ScrollView>
                  </AnimatedDropdownPanel>
                </View>
              </View>
            </View>
            ) : null}

            {step === 'consent' ? (
            <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.consentBody}>
                <View style={styles.consentIconCircle}>
                  <MicrophoneSmallIcon color={colors.textStrong} size={28} />
                </View>
                <Text isBold style={[styles.consentTitle, isCompactConsent ? styles.consentTitleCompact : undefined]}>
                  Ik heb expliciete toestemming van mijn cliënt
                </Text>
                <Text style={[styles.consentDescription, isCompactConsent ? styles.consentDescriptionCompact : undefined]}>
                  Door verder te gaan bevestig je dat alle deelnemers vooraf zijn geinformeerd over de opname en vrijwillig toestemming hebben gegeven.
                </Text>
                <Pressable
                  onPress={() => setHasRecordingConsent((value) => !value)}
                  style={({ hovered }) => [styles.consentCheckboxRow, hovered ? styles.consentCheckboxRowHovered : undefined]}
                >
                  <View style={[styles.consentCheckbox, hasRecordingConsent ? styles.consentCheckboxChecked : undefined]}>
                    {hasRecordingConsent ? <CheckmarkIcon color={colors.selected} width={14} height={12} /> : null}
                  </View>
                  <Text style={styles.consentCheckboxLabel}>
                    Ik bevestig dat ik toestemming heb.
                  </Text>
                </Pressable>
                <Pressable
                  onPress={openConsentHelpPage}
                  style={({ hovered }) => [styles.consentHelpLinkRow, hovered ? styles.consentHelpLinkRowHovered : undefined]}
                >
                  <Text isSemibold style={styles.consentHelpLinkText}>
                    Hoe vraag ik toestemming?
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
            ) : null}
          </AnimatedMainContent>
        </View>

        {/* Modal footer */}
        {showFooter ? (
          <View
            style={[
              step === 'recorded' ? styles.footerInline : styles.footerFloating,
              (isUploadStep && !isCompactUploadFooter) || isConsentStep ? styles.footerSplit : undefined,
              isCompactUploadFooter ? styles.footerStacked : undefined,
            ]}
          >
            {isConsentStep ? (
              <Pressable
                onPress={() => {
                  setHasRecordingConsent(false)
                  setStep('select')
                }}
                style={({ hovered, pressed }) => [
                  styles.footerButtonBase,
                  styles.footerButtonSecondary,
                  styles.footerButtonLeft,
                  isCompactFooter ? styles.footerButtonCompact : undefined,
                  webTransitionSmooth,
                  hovered ? styles.footerButtonSecondaryHovered : undefined,
                  pressed ? styles.footerButtonSecondaryPressed : undefined,
                ]}
              >
                <Text isBold style={styles.footerButtonSecondaryText}>
                  Terug
                </Text>
              </Pressable>
            ) : null}
            {step === 'upload' ? (
              <Pressable
                onPress={openFilePicker}
                style={({ hovered }) => [
                  styles.footerButtonBase,
                  styles.footerButtonSecondary,
                  isCompactUploadFooter ? styles.footerButtonUploadTop : styles.footerButtonLeft,
                  isCompactFooter ? styles.footerButtonCompact : undefined,
                  hovered ? styles.footerButtonSecondaryHovered : undefined,
                ]}
              >
                {/* Select from computer */}
                <View style={styles.footerButtonContent}>
                  <FolderOpenIcon size={20} color={colors.textStrong} />
                  <Text isSemibold style={styles.footerButtonSecondaryText}>
                    Selecteer van computer
                  </Text>
                </View>
              </Pressable>
            ) : null}
            <View
              style={[
                styles.footerRightGroup,
                isCompactUploadFooter ? styles.footerRightGroupStacked : undefined,
                isUploadStep ? undefined : styles.footerRightGroupAlignEnd,
              ]}
            >
              <Pressable
                onPress={requestClose}
                style={({ hovered, pressed }) => [
                  styles.footerButtonBase,
                  styles.footerButtonSecondary,
                  isUploadStep && !isCompactUploadFooter ? styles.footerButtonMiddle : styles.footerButtonLeft,
                  isCompactUploadFooter ? styles.footerButtonStackedSplit : undefined,
                  isCompactFooter ? styles.footerButtonCompact : undefined,
                  webTransitionSmooth,
                  hovered ? styles.footerButtonSecondaryHovered : undefined,
                  pressed ? styles.footerButtonSecondaryPressed : undefined,
                ]}
              >
                {/* Cancel */}
                <Text isBold style={styles.footerButtonSecondaryText}>
                  Annuleren
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (step === 'recorded') {
                    if (selectedOption === 'upload') {
                      createAndOpenSession({ kind: 'upload' })
                      return
                    }
                    if (selectedOption === 'gesprek' || selectedOption === 'verslag') {
                      createAndOpenSession({ kind: 'recording' })
                    }
                    return
                  }

                  if (step === 'upload') {
                    if (!selectedAudioFile) return
                    saveSelectedFileToAudioStore()
                    return
                  }

                  if (step === 'consent') {
                    if (!selectedOption || !hasRecordingConsent) return
                    if (selectedOption === 'upload') {
                      setStep('upload')
                      return
                    }
                    setStep('recording')
                    return
                  }

                  if (!selectedOption) return
                  if (selectedOption === 'schrijven') {
                    onStartWrittenReport()
                    return
                  }
                  if (selectedOption === 'verslag') {
                    setStep('recording')
                    return
                  }
                  setHasRecordingConsent(false)
                  setStep('consent')
                }}
                style={({ hovered, pressed }) => [
                  styles.footerButtonBase,
                  styles.footerButtonPrimary,
                  styles.footerButtonRight,
                  isCompactUploadFooter ? styles.footerButtonStackedSplit : undefined,
                  isCompactFooter ? styles.footerButtonCompact : undefined,
                  step === 'upload' && (!selectedAudioFile || !!uploadFileDurationWarning) ? styles.primaryButtonDisabled : undefined,
                  !selectedOption && step === 'select' ? styles.primaryButtonDisabled : undefined,
                  step === 'consent' && !hasRecordingConsent ? styles.primaryButtonDisabled : undefined,
                  hovered &&
                    (step === 'select'
                      ? !!selectedOption
                      : step === 'consent'
                        ? hasRecordingConsent
                        : step === 'upload'
                          ? !!selectedAudioFile && !uploadFileDurationWarning
                          : step === 'recorded'
                            ? !!audioForTranscription
                            : false)
                    ? styles.footerButtonPrimaryHovered
                    : undefined,
                  pressed &&
                  !(step === 'upload' && (!selectedAudioFile || !!uploadFileDurationWarning)) &&
                  !(!selectedOption && step === 'select') &&
                  !(step === 'consent' && !hasRecordingConsent)
                    ? styles.footerButtonPrimaryPressed
                    : undefined,
                ]}
              >
                {/* Continue */}
                <Text isBold style={styles.footerButtonPrimaryText}>
                  {step === 'recorded' ? 'Verslag aanmaken' : 'Doorgaan'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Animated.View>
      <AnimatedOverlayModal
        visible={isRecordedCloseWarningVisible}
        onClose={() => setIsRecordedCloseWarningVisible(false)}
        contentContainerStyle={styles.closeWarningContainer}
      >
        <View style={styles.closeWarningContent}>
          <Text isBold style={styles.closeWarningTitle}>
            Weet je zeker dat je de opname wil verwijderen?
          </Text>
          <Text style={styles.closeWarningText}>
            Als je verwijdert, gaat je huidige opname of invoer verloren.
          </Text>
        </View>
        <View style={styles.recordedCloseWarningFooter}>
            <Pressable
              onPress={() => setIsRecordedCloseWarningVisible(false)}
              style={({ hovered }) => [
                styles.recordedCloseWarningSecondaryButton,
                hovered ? styles.recordedCloseWarningSecondaryButtonHovered : undefined,
              ]}
            >
              <Text isBold style={styles.recordedCloseWarningSecondaryButtonText}>
                Annuleren
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setIsRecordedCloseWarningVisible(false)
                handleClose()
              }}
              style={({ hovered }) => [
                styles.recordedCloseWarningPrimaryButton,
                hovered ? styles.recordedCloseWarningPrimaryButtonHovered : undefined,
              ]}
            >
              <Text isBold style={styles.recordedCloseWarningPrimaryButtonText}>
                Verwijderen
              </Text>
            </Pressable>
        </View>
      </AnimatedOverlayModal>
      <AnimatedOverlayModal
        visible={isInsufficientMinutesWarningVisible}
        onClose={() => {
          setIsInsufficientMinutesWarningVisible(false)
        }}
        contentContainerStyle={styles.insufficientMinutesModalContainer}
      >
        <View style={styles.insufficientMinutesModalContent}>
          <Text isBold style={styles.insufficientMinutesModalTitle}>
            Onvoldoende minuten voor transcriptie
          </Text>
          <Text style={styles.insufficientMinutesModalText}>
            Deze opname duurt ongeveer {insufficientMinutesContext ? formatMinutesLabel(insufficientMinutesContext.requiredSeconds) : '0 minuten'} en je hebt nog{' '}
            {insufficientMinutesContext ? formatMinutesLabel(insufficientMinutesContext.remainingSeconds) : '0 minuten'} over.
          </Text>
        </View>
        <View style={styles.insufficientMinutesFooter}>
          <Pressable
            onPress={() => {
              if (!insufficientMinutesContext) return
              downloadCurrentAudio(insufficientMinutesContext.kind)
            }}
            style={({ hovered }) => [
              styles.insufficientMinutesFooterSecondaryButton,
              hovered ? styles.insufficientMinutesFooterSecondaryButtonHovered : undefined,
            ]}
          >
            <Text isBold style={styles.insufficientMinutesFooterSecondaryButtonText}>
              Audio downloaden
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              void (async () => {
                const selectedOptionForRestore =
                  selectedOption === 'gesprek' || selectedOption === 'verslag' || selectedOption === 'upload'
                    ? selectedOption
                    : insufficientMinutesContext?.kind === 'upload'
                      ? 'upload'
                      : 'verslag'
                if (audioForTranscription) {
                  try {
                    await saveSubscriptionReturnDraft({
                      selectedOption: selectedOptionForRestore,
                      selectedCoacheeId,
                      selectedTemplateId,
                      sessionTitle,
                      shouldSaveAudio,
                      audioDurationSeconds,
                      mimeType: audioForTranscription.mimeType,
                      blob: audioForTranscription.blob,
                    })
                  } catch (error) {
                    console.error('[NewSessionModal] Failed to persist subscription return draft', error)
                  }
                }
                setIsInsufficientMinutesWarningVisible(false)
                onOpenMySubscription()
              })()
            }}
            style={({ hovered }) => [
              styles.insufficientMinutesFooterPrimaryButton,
              hovered ? styles.insufficientMinutesFooterPrimaryButtonHovered : undefined,
            ]}
          >
            <Text isBold style={styles.insufficientMinutesFooterPrimaryButtonText}>
              Mijn abonnement
            </Text>
          </Pressable>
        </View>
      </AnimatedOverlayModal>
    </View>
  )
}

type SessionOptionRowProps = {
  label: string
  leftIcon: React.ReactNode
  isSelected: boolean
  onPress: () => void
}

function SessionOptionRow({ label, leftIcon, isSelected, onPress }: SessionOptionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [
        styles.optionRow,
        webTransitionSmooth,
        isSelected ? styles.optionRowSelected : styles.optionRowUnselected,
        hovered ? styles.optionRowHovered : undefined,
      ]}
    >
      {/* Session option row */}
      <View style={styles.optionRowContent}>
        {leftIcon}
        <Text isSemibold style={styles.optionRowText}>
          {label}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...( { position: 'fixed', inset: 0, zIndex: 9000 } as any ),
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backdrop: {
    ...( { position: 'absolute', inset: 0 } as any ),
    backgroundColor: 'rgba(16,18,20,0.22)',
    ...( { backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } as any ),
    zIndex: 0,
  },
  backdropPressable: {
    ...( { position: 'absolute', inset: 0 } as any ),
    zIndex: 0,
  },
  container: {
    width: 1088,
    maxWidth: '90vw',
    height: 533,
    ...( { height: 'min(533px, 90vh)' } as any ),
    backgroundColor: colors.surface,
    borderRadius: 16,
    ...( { boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } as any ),
    overflow: 'visible',
    position: 'relative',
    zIndex: 2,
  },
  minimizedOverlay: {
    ...( { position: 'fixed', top: 16, left: 240, right: 24, zIndex: 9000 } as any ),
    alignItems: 'flex-start',
    height: 40,
  },
  minimizedBar: {
    width: 520,
    ...( { maxWidth: '70vw' } as any ),
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F8F9F9',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  minimizedInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  minimizedTimeText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  minimizedTimeContainer: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimizedWaveform: {
    flex: 1,
    height: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    overflow: 'hidden',
  },
  minimizedWaveBar: {
    width: 2,
    borderRadius: 8,
    backgroundColor: '#F2BBD9',
  },
  minimizedWaveBarSilent: {
    height: 2,
    borderRadius: 1,
  },
  minimizedControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  minimizedControlButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimizedSoftButton: {
    backgroundColor: '#FCE3F2',
  },
  minimizedSoftButtonHovered: {
    backgroundColor: '#F8D2EA',
  },
  minimizedStopButtonHovered: {
    backgroundColor: '#A50058',
  },
  minimizedStopButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimizedPlayIconWrapper: {
    marginLeft: 2,
  },
  header: {
    width: '100%',
    height: 72,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 24,
    color: colors.textStrong,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordingWarningOverlay: {
    ...( { position: 'absolute', top: 24, left: 0, right: 0, zIndex: 3 } as any ),
    alignItems: 'center',
  },
  recordingWarningBanner: {
    padding: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    gap: 2,
  },
  recordingWarningTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
    textAlign: 'center',
  },
  recordingWarningText: {
    fontSize: 13,
    lineHeight: 17,
    color: colors.text,
    textAlign: 'center',
  },
  headerMetaText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  iconButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  iconButtonPressed: {},
  iconButtonOverlay: {
    ...( { position: 'absolute', inset: 0 } as any ),
    backgroundColor: 'rgba(190, 1, 101, 0.08)',
  },
  body: {
    width: '100%',
    flex: 1,
    padding: 24,
    paddingBottom: 96,
    ...( { overflow: 'visible' } as any ),
    zIndex: 1,
  },
  stepContent: {
    width: '100%',
    flex: 1,
  },
  stepScroll: {
    width: '100%',
    flex: 1,
  },
  stepScrollContent: {
    paddingBottom: 8,
  },
  selectList: {
    gap: 16,
  },
  optionRow: {
    width: '100%',
    height: 72,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    justifyContent: 'center',
  },
  optionRowSelected: {
    borderColor: colors.selected,
    borderWidth: 2,
  },
  optionRowUnselected: {
    borderColor: colors.border,
  },
  optionRowHovered: {
    backgroundColor: colors.hoverBackground,
  },
  optionRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionRowText: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  footerFloating: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 0,
    zIndex: 2,
  },
  footerInline: {
    marginTop: 16,
    paddingBottom: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 0,
    zIndex: 0,
  },
  footerSplit: {
    justifyContent: 'space-between',
  },
  footerStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
  },
  footerButtonBase: {
    height: 48,
    borderRadius: 0,
    paddingHorizontal: 24,
    paddingVertical: 0,
    minWidth: 180,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  footerButtonLeft: {
    borderBottomLeftRadius: 16,
  },
  footerButtonMiddle: {},
  footerButtonRight: {
    borderBottomRightRadius: 16,
  },
  footerRightGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  footerRightGroupStacked: {
    width: '100%',
  },
  footerRightGroupAlignEnd: {
    marginLeft: 'auto',
  },
  footerButtonStackedSplit: {
    flex: 1,
    minWidth: 0,
  },
  footerButtonUploadTop: {
    width: '100%',
    borderRadius: 0,
  },
  footerButtonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  footerButtonSecondaryHovered: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  footerButtonSecondaryPressed: {},
  footerButtonSecondaryText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  footerButtonPrimary: {
    backgroundColor: colors.selected,
  },
  footerButtonPrimaryHovered: {
    backgroundColor: '#A50058',
  },
  footerButtonPrimaryPressed: {},
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  footerButtonPrimaryText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  buttonOverlay: {
    ...( { position: 'absolute', inset: 0 } as any ),
    backgroundColor: 'rgba(190, 1, 101, 0.08)',
  },
  recordingBody: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    paddingVertical: 40,
  },
  waveformContainer: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 48,
    overflow: 'hidden',
  },
  waveBar: {
    width: 8,
    borderRadius: 8,
    backgroundColor: '#F2BBD9',
  },
  timerText: {
    fontSize: 44,
    lineHeight: 48,
    color: colors.textStrong,
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  closeWarningContainer: {
    width: 520,
  },
  closeWarningContent: {
    padding: 24,
    gap: 16,
  },
  closeWarningTitle: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textStrong,
  },
  closeWarningText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  closeWarningActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  closeWarningButton: {
    height: 40,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeWarningButtonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeWarningButtonSecondaryHovered: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  closeWarningButtonSecondaryText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  closeWarningButtonPrimary: {
    backgroundColor: colors.selected,
  },
  closeWarningButtonPrimaryHovered: {
    backgroundColor: '#A50058',
  },
  closeWarningButtonPrimaryText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  recordedCloseWarningFooter: {
    width: '100%',
    padding: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recordedCloseWarningSecondaryButton: {
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
  recordedCloseWarningSecondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  recordedCloseWarningSecondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  recordedCloseWarningPrimaryButton: {
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
  recordedCloseWarningPrimaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  recordedCloseWarningPrimaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  insufficientMinutesModalContainer: {
    width: 560,
  },
  insufficientMinutesModalContent: {
    padding: 24,
    gap: 16,
  },
  insufficientMinutesModalTitle: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textStrong,
  },
  insufficientMinutesModalText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  insufficientMinutesFooter: {
    width: '100%',
    padding: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  insufficientMinutesFooterSecondaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomLeftRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 0,
    borderColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 0,
    minWidth: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insufficientMinutesFooterSecondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  insufficientMinutesFooterSecondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  insufficientMinutesFooterPrimaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomRightRadius: 16,
    backgroundColor: colors.selected,
    paddingHorizontal: 24,
    paddingVertical: 0,
    minWidth: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insufficientMinutesFooterPrimaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  insufficientMinutesFooterPrimaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  softCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FCE3F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  softCircleHovered: {
    backgroundColor: '#F8D2EA',
  },
  primaryCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCircleHovered: {
    backgroundColor: '#A50058',
  },
  recordedBody: {
    width: '100%',
    gap: 16,
  },
  recordedDropdownsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  audioPreviewCard: {
    width: '100%',
    padding: 0,
    position: 'relative',
  },
  footerButtonCompact: {
    minWidth: 0,
    flex: 1,
    paddingHorizontal: 12,
  },
  audioSaveToggleRow: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  audioSaveToggleRowHovered: {
    backgroundColor: 'rgba(249,249,249,0.98)',
  },
  audioSaveToggleLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textStrong,
  },
  audioSaveToggleTrack: {
    width: 34,
    height: 20,
    borderRadius: 999,
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  audioSaveToggleTrackOff: {
    backgroundColor: '#D2D2D2',
  },
  audioSaveToggleTrackOn: {
    backgroundColor: colors.selected,
  },
  audioSaveToggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  audioSaveToggleThumbOff: {
    alignSelf: 'flex-start',
  },
  audioSaveToggleThumbOn: {
    alignSelf: 'flex-end',
  },
  uploadBody: {
    width: '100%',
    gap: 16,
  },
  consentBody: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  consentIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FCE3F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  consentTitle: {
    fontSize: 30,
    lineHeight: 36,
    color: colors.textStrong,
    textAlign: 'center',
  },
  consentTitleCompact: {
    fontSize: 22,
    lineHeight: 30,
  },
  consentDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    textAlign: 'center',
    maxWidth: 640,
  },
  consentDescriptionCompact: {
    fontSize: 14,
    lineHeight: 21,
  },
  consentCheckboxRow: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  consentCheckboxRowHovered: {
    backgroundColor: colors.hoverBackground,
  },
  consentCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    flexShrink: 0,
  },
  consentCheckboxChecked: {
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  consentCheckboxLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textStrong,
  },
  consentHelpLinkRow: {
    marginTop: 2,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  consentHelpLinkRowHovered: {
    backgroundColor: colors.hoverBackground,
  },
  consentHelpLinkText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.selected,
    textDecorationLine: 'underline',
  },
  uploadDropArea: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPressable: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadDropAreaHovered: {
    backgroundColor: colors.hoverBackground,
  },
  uploadDropAreaActive: {
    backgroundColor: 'rgba(190,1,101,0.08)',
    borderColor: colors.selected,
  },
  uploadCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  uploadHintText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  uploadFileNameText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
    maxWidth: 520,
    textAlign: 'center',
  },
  uploadDurationWarningText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.selected,
    maxWidth: 700,
    textAlign: 'center',
  },
  footerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownArea: {
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  dropdownAreaHalf: {
    flex: 1,
    width: undefined as any,
  },
  dropdownAreaRaised: {
    zIndex: 2,
  },
  infoRow: {
    width: '100%',
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoRowHovered: {
    backgroundColor: colors.hoverBackground,
  },
  infoRowText: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  infoRowSpacer: {
    flex: 1,
  },
  sessionTitleInput: {
    flex: 1,
    padding: 0,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  coacheePanel: {
    width: '100%',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 72,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 0,
    gap: 0,
    ...( { boxShadow: '0 8px 20px rgba(0,0,0,0.12)' } as any ),
    zIndex: 30,
    overflow: 'hidden',
  },
  reportTypePanel: {
    width: '100%',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 72,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 0,
    gap: 0,
    ...( { boxShadow: '0 8px 20px rgba(0,0,0,0.12)' } as any ),
    zIndex: 30,
    overflow: 'hidden',
  },
  reportTypeList: {
    width: '100%',
  },
  reportTypeListContent: {
    paddingVertical: 0,
  },
  reportTypeItem: {
    width: '100%',
    height: 48,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  reportTypeItemTop: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  reportTypeItemBottom: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  reportTypeItemHovered: {
    backgroundColor: colors.hoverBackground,
  },
  reportTypeItemText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  coacheeList: {
    width: '100%',
  },
  coacheeListContent: {
    paddingVertical: 0,
  },
  coacheeItem: {
    width: '100%',
    height: 48,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coacheeItemTop: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  coacheeItemBottom: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  coacheeItemHovered: {
    backgroundColor: colors.hoverBackground,
  },
  coacheeItemText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  coacheeItemAdd: {
    backgroundColor: colors.selected,
  },
  coacheeItemAddHovered: {
    backgroundColor: '#A50058',
  },
  coacheeItemAddText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})
