import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, TextInput, useWindowDimensions, View } from 'react-native'

import { useBrowserAudioRecorder } from '../../hooks/useBrowserAudioRecorder'
import { useLiveAudioWaveformBars } from '../../hooks/useLiveAudioWaveformBars'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useLocalAppData } from '../../local/LocalAppDataProvider'
import { useE2ee } from '../../e2ee/E2eeProvider'
import { colors } from '../../design/theme/colors'
import { webTransitionSmooth } from '../../design/theme/webTransitions'
import { Text } from '../../ui/Text'
import { MinimizeIcon } from '../../icons/MinimizeIcon'
import { FolderOpenIcon } from '../../icons/FolderOpenIcon'
import { unassignedCoacheeLabel } from '../../utils/coachee'
import { setPendingPreviewAudio } from '../../audio/pendingPreviewStore'
import { processSessionAudio } from '../../audio/processSessionAudio'
import { AnimatedMainContent } from '../../ui/AnimatedMainContent'
import { fetchBillingStatus } from '../../api/billing'
import { clearSubscriptionReturnDraft, readAndClearSubscriptionReturnDraft, saveSubscriptionReturnDraft } from './subscriptionReturnDraftStore'
import {
  fetchTranscriptionRuntimeConfig,
  type RealtimeTranscriberSession,
  type TranscriptionMode,
} from '../../api/transcription'
import { useToast } from '../../toast/ToastProvider'
import { isGespreksverslagTemplate } from '../../utils/templateCategories'
import type { Session } from '../../local/types'
import { MinimizedRecordingLayer } from './components/MinimizedRecordingLayer'
import { NewSessionAuxiliaryModals } from './components/NewSessionAuxiliaryModals'
import { NewSessionStepBody } from './NewSessionStepBody'
import { runPrimaryFooterAction } from '../../logic/newSession/newSessionModalActions'
import { styles } from './newSessionModalStyles'
import type { NewSessionStep } from './newSessionModalTypes'
import { useNewSessionRecordingFlow } from '../../hooks/newSession/useNewSessionRecordingFlow'
import {
  buildDefaultSessionTitle,
  createOperationId,
  formatDurationLabel,
  formatTimeLabel,
  getAudioMimeTypeFromFile,
  isAudioFile,
  maxDuration,
  maxRecordingSeconds,
  maxTranscriptionDurationSeconds,
  normalizeDraftOption,
  normalizeFileExtensionFromMimeType,
  readAudioDurationSeconds,
  readRemainingTranscriptionSeconds,
  recordingWarningStartSeconds,
  type OptionKey,
} from './newSessionModalUtils'

type Props = {
  visible: boolean
  onClose: () => void
  onRecordingBusyChange?: (isBusy: boolean) => void
  onOpenGeschrevenGespreksverslag: (coacheeId: string | null) => void
  onOpenMySubscription: () => void
  restoreDraftFromSubscriptionReturn?: boolean
  onRestoreDraftHandled?: () => void
  onOpenSession: (sessionId: string) => void
  onOpenNewCoachee: () => void
  initialCoacheeId?: string | null
  initialTrajectoryId?: string | null
  newlyCreatedCoacheeId?: string | null
  onNewlyCreatedCoacheeHandled: () => void
  limitedMode?: boolean
  initialOption?: 'gesprek' | 'gespreksverslag' | null
}


export function NewSessionModal({
  visible,
  onClose,
  onRecordingBusyChange,
  onOpenGeschrevenGespreksverslag,
  onOpenMySubscription,
  restoreDraftFromSubscriptionReturn = false,
  onRestoreDraftHandled,
  onOpenSession,
  onOpenNewCoachee,
  initialCoacheeId,
  initialTrajectoryId,
  newlyCreatedCoacheeId,
  onNewlyCreatedCoacheeHandled,
  limitedMode = false,
  initialOption = null,
}: Props) {
  const isReducedMotionEnabled = useReducedMotion()
  const { data, createSession, updateSession } = useLocalAppData()
  const e2ee = useE2ee()
  const recorder = useBrowserAudioRecorder()
  const { showErrorToast } = useToast()

  const [isRendered, setIsRendered] = useState(visible)
  const [step, setStep] = useState<NewSessionStep>('select')
  const [selectedOption, setSelectedOption] = useState<OptionKey | null>(null)
  const [selectedOptionGroup, setSelectedOptionGroup] = useState<'gesprek' | 'gespreksverslag' | null>(null)
  const [, setOpenOptionGroup] = useState<'gesprek' | 'gespreksverslag' | null>(null)
  const [isCoacheeOpen, setIsCoacheeOpen] = useState(false)
  const [selectedCoacheeId, setSelectedCoacheeId] = useState<string | null>(null)
  const [selectedTrajectoryId, setSelectedTrajectoryId] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [sessionTitle, setSessionTitle] = useState(() => buildDefaultSessionTitle(null))
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
  const hasAutoStartedRecordingRef = useRef(false)
  const hasAutoSubmittedRecordingRef = useRef(false)
  const [coacheeDropdownMaxHeight, setCoacheeDropdownMaxHeight] = useState<number | null>(null)

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
  const gesprekReportTemplates = useMemo(() => templates.filter((template) => isGespreksverslagTemplate(template)), [templates])
  const reportTypeTemplates = useMemo(() => gesprekReportTemplates, [gesprekReportTemplates])
  const defaultTemplateId = useMemo(() => {
    const standardTemplate = reportTypeTemplates.find((template) => {
      const normalizedName = template.name.trim().toLowerCase()
      return normalizedName === 'intake' || normalizedName === 'intakeverslag'
    })
    return (standardTemplate ?? reportTypeTemplates[0])?.id ?? null
  }, [reportTypeTemplates])
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
    setSelectedOptionGroup(null)
    setOpenOptionGroup(null)
    setIsCoacheeOpen(false)
    setSelectedCoacheeId(null)
    setSelectedTrajectoryId(initialTrajectoryId ?? null)
    setSelectedTemplateId(defaultTemplateId)
    setSessionTitle(buildDefaultSessionTitle(null))
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
    hasAutoStartedRecordingRef.current = false
    hasAutoSubmittedRecordingRef.current = false
  }, [initialTrajectoryId, visible])

  useEffect(() => {
    if (!visible) return
    if (!limitedMode) return
    if (!initialOption) return
    if (restoreDraftFromSubscriptionReturn) return
    setSelectedOption(initialOption)
    setSessionTitle(buildDefaultSessionTitle(initialOption))
    if (initialOption === 'gespreksverslag') {
      setStep('recording')
      setSelectedOptionGroup('gespreksverslag')
      return
    }
    setSelectedOptionGroup('gesprek')
    setHasRecordingConsent(false)
    setStep('consent')
  }, [initialOption, limitedMode, restoreDraftFromSubscriptionReturn, visible])

  useEffect(() => {
    if (!visible) return
    if (!restoreDraftFromSubscriptionReturn) return
    let isCancelled = false

    void (async () => {
      try {
        const draft = await readAndClearSubscriptionReturnDraft()
        if (isCancelled) return
        if (!draft) return

        const restoredOption = normalizeDraftOption(draft.selectedOption)
        setSelectedOption(restoredOption)
        setSelectedOptionGroup(restoredOption === 'gespreksverslag' ? 'gespreksverslag' : 'gesprek')
        setOpenOptionGroup(null)
        setSelectedCoacheeId(draft.selectedCoacheeId)
        setSelectedTemplateId(draft.selectedTemplateId ?? defaultTemplateId)
        setSessionTitle(String(draft.sessionTitle || '').trim() || buildDefaultSessionTitle(restoredOption))
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
    if (selectedTemplateId && reportTypeTemplates.some((template) => template.id === selectedTemplateId)) return
    setSelectedTemplateId(defaultTemplateId)
  }, [defaultTemplateId, reportTypeTemplates, selectedTemplateId])

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
  const trajectoriesByCoacheeId = useMemo(() => {
    const map = new Map<string, typeof data.trajectories>()
    for (const coachee of activeCoachees) {
      map.set(
        coachee.id,
        data.trajectories
          .filter((trajectory) => trajectory.coacheeId === coachee.id)
          .sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs),
      )
    }
    return map
  }, [activeCoachees, data.trajectories])

  const resolveDefaultTrajectoryIdForCoachee = (coacheeId: string | null | undefined): string | null => {
    if (!coacheeId) return null
    const trajectories = trajectoriesByCoacheeId.get(coacheeId) ?? []
    if (trajectories.length === 0) return null
    const matchingInitial = initialTrajectoryId ? trajectories.find((trajectory) => trajectory.id === initialTrajectoryId) : null
    return matchingInitial?.id ?? trajectories[0].id
  }

  useEffect(() => {
    if (newlyCreatedCoacheeId && visible) {
      const coachee = activeCoachees.find((c) => c.id === newlyCreatedCoacheeId)
      if (coachee) {
        setSelectedCoacheeId(newlyCreatedCoacheeId)
        setSelectedTrajectoryId(resolveDefaultTrajectoryIdForCoachee(newlyCreatedCoacheeId))
        setIsCoacheeOpen(false)
        onNewlyCreatedCoacheeHandled()
      }
    }
  }, [activeCoachees, newlyCreatedCoacheeId, onNewlyCreatedCoacheeHandled, visible])

  useEffect(() => {
    if (!visible) return
    if (!initialCoacheeId) return
    const coachee = activeCoachees.find((item) => item.id === initialCoacheeId)
    if (!coachee) return
    setSelectedCoacheeId(initialCoacheeId)
    setSelectedTrajectoryId(resolveDefaultTrajectoryIdForCoachee(initialCoacheeId))
  }, [activeCoachees, initialCoacheeId, visible])

  useEffect(() => {
    if (!visible) return
    if (!selectedCoacheeId) {
      setSelectedTrajectoryId(null)
      return
    }
    const trajectories = trajectoriesByCoacheeId.get(selectedCoacheeId) ?? []
    if (trajectories.length === 0) {
      setSelectedTrajectoryId(null)
      return
    }
    if (selectedTrajectoryId && trajectories.some((trajectory) => trajectory.id === selectedTrajectoryId)) return
    setSelectedTrajectoryId(resolveDefaultTrajectoryIdForCoachee(selectedCoacheeId))
  }, [selectedCoacheeId, selectedTrajectoryId, trajectoriesByCoacheeId, visible])

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
  const isRecordingBusy =
    visible &&
    (step === 'recording' ||
      recorder.status === 'requesting' ||
      recorder.status === 'stopping' ||
      isRealtimeTranscriberStarting)

  useEffect(() => {
    onRecordingBusyChange?.(isRecordingBusy)
  }, [isRecordingBusy, onRecordingBusyChange])

  useEffect(() => {
    return () => {
      onRecordingBusyChange?.(false)
    }
  }, [onRecordingBusyChange])


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
      ? 'Nieuw item'
        : step === 'consent'
        ? 'Toestemming voor opname bevestigen'
        : step === 'upload'
          ? 'Bestand uploaden'
          : step === 'recording'
            ? 'Opnemen'
            : selectedOption === 'gesprek'
              ? 'Gesprek opgenomen'
              : selectedOption === 'intake'
                ? 'Intake opgenomen'
              : 'Verslag opgenomen'
  const showFooter = limitedMode ? step === 'consent' || step === 'recorded' || step === 'upload' : step !== 'recording'
  const isUploadStep = step === 'upload'
  const isConsentStep = step === 'consent'
  const isLimitedFooter = limitedMode && (step === 'consent' || step === 'recorded')
  const isCompactUploadFooter = isUploadStep && windowWidth <= 700
  const isCompactFooter = limitedMode || windowWidth <= 520
  const isCompactConsent = limitedMode || (step === 'consent' && windowWidth <= 520)
  const gesprekOptionLabel = 'Gesprek opnemen'
  const gespreksverslagOptionLabel = 'Gespreksverslag opnemen'
  const isSessionTitleEmpty = sessionTitle.trim().length === 0
  const isPrimaryActionDisabled =
    (step === 'upload' && (!selectedAudioFile || !!uploadFileDurationWarning)) ||
    (!selectedOption && step === 'select' && !limitedMode) ||
    (step === 'consent' && !hasRecordingConsent) ||
    (step === 'recorded' && (!audioForTranscription || isSessionTitleEmpty))
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

  function handleSelectOption(option: OptionKey) {
    if (option === 'gesprek') {
      setSelectedOptionGroup('gesprek')
      setSelectedOption('gesprek')
      setOpenOptionGroup(null)
      setSessionTitle(limitedMode ? buildDefaultSessionTitle('gesprek') : 'Voortgangsgesprek')
      if (limitedMode) {
        setHasRecordingConsent(false)
        setStep('consent')
      }
      return
    }
    if (option === 'gespreksverslag') {
      setSelectedOptionGroup('gespreksverslag')
      setSelectedOption('gespreksverslag')
      setOpenOptionGroup(null)
      setSessionTitle(limitedMode ? buildDefaultSessionTitle('gespreksverslag') : 'Voortgangsverslag')
      if (limitedMode) {
        setStep('recording')
      }
      return
    }
    if (option === 'upload') {
      setSelectedOption('upload')
      setSelectedOptionGroup(null)
      setOpenOptionGroup(null)
      setSessionTitle('Bestand uploaden')
    }
  }

  function handlePrimaryActionPress() {
    runPrimaryFooterAction({
      hasRecordingConsent,
      isPrimaryActionDisabled,
      limitedMode,
      selectedCoacheeId,
      selectedCoacheeResolvedId: selectedCoachee?.id ?? null,
      selectedOption,
      step,
      createAndOpenSession,
      handleClose,
      onOpenGeschrevenGespreksverslag,
      saveSelectedFileToAudioStore,
      setHasRecordingConsent: (value) => setHasRecordingConsent(value),
      setStep,
      clearSubscriptionReturnDraft,
    })
  }

  function handleSelectCoachee(coacheeId: string | null) {
    setSelectedCoacheeId(coacheeId)
    setSelectedTrajectoryId(resolveDefaultTrajectoryIdForCoachee(coacheeId))
    setIsCoacheeOpen(false)
  }

  function handleOpenSubscriptionFromInsufficientMinutes() {
    void (async () => {
      const selectedOptionForRestore =
        selectedOption === 'gesprek' ||
        selectedOption === 'gespreksverslag' ||
        selectedOption === 'upload'
          ? selectedOption
          : selectedOption === 'intake'
            ? 'gesprek'
            : insufficientMinutesContext?.kind === 'upload'
              ? 'upload'
              : 'gespreksverslag'
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
  }

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
    if (!isCoacheeOpen) return

    const coacheeTriggerId = 'new-session-coachee-trigger'
    const coacheePanelId = 'new-session-coachee-panel'

    const isInside = (id: string, target: Node | null) => {
      if (!target) return false
      const element = document.getElementById(id)
      return !!element && element.contains(target)
    }

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (
        isInside(coacheeTriggerId, target) ||
        isInside(coacheePanelId, target)
      ) {
        return
      }
      setIsCoacheeOpen(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isCoacheeOpen])

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

  async function resolveRecordingDurationSeconds(params: {
    recordingDurationSeconds?: number | null
    audioBlob?: Blob | null
  }): Promise<number> {
    const chunkDurationSeconds = recorder.recordedChunkDurationsSeconds.reduce(
      (sum, value) => sum + (Number.isFinite(value) ? Math.max(0, Number(value)) : 0),
      0,
    )
    const detectedDurationSeconds = params.audioBlob ? await readAudioDurationSeconds(params.audioBlob).catch(() => null) : null
    return maxDuration([
      params.recordingDurationSeconds,
      audioDurationSeconds,
      chunkDurationSeconds,
      recorder.elapsedSeconds,
      detectedDurationSeconds,
    ])
  }

  async function createAndOpenSessionInternal(
    values: { kind: 'recording' | 'upload' },
    options?: {
      sessionKind?: Session['kind']
      overrideShouldSaveAudio?: boolean
      audioForTranscription?: { blob: Blob; mimeType: string }
      recordingDurationSeconds?: number | null
    },
  ): Promise<boolean> {
    const resolvedAudioForTranscription = options?.audioForTranscription ?? audioForTranscription
    if (!resolvedAudioForTranscription) return false
    const effectiveShouldSaveAudio = options?.overrideShouldSaveAudio ?? shouldSaveAudio
    const resolvedRecordingDurationSeconds =
      values.kind === 'recording'
        ? await resolveRecordingDurationSeconds({
            recordingDurationSeconds: options?.recordingDurationSeconds,
            audioBlob: resolvedAudioForTranscription.blob,
          })
        : 0
    const nextAudioDurationSeconds =
      values.kind === 'recording'
        ? Math.max(0, resolvedRecordingDurationSeconds)
        : (Number.isFinite(audioDurationSeconds) ? audioDurationSeconds : null)

    const createdSessionId = createSession({
      coacheeId: selectedCoachee?.id ?? null,
      trajectoryId: selectedTrajectoryId ?? null,
      title: sessionTitle,
      kind: options?.sessionKind ?? values.kind,
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
        summaryTemplate: undefined,
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
      summaryTemplate: undefined,
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
      sessionKind?: Session['kind']
      overrideShouldSaveAudio?: boolean
      audioForTranscription?: { blob: Blob; mimeType: string }
      recordingDurationSeconds?: number | null
    },
  ): Promise<boolean> {
    const resolvedAudioForTranscription = options?.audioForTranscription ?? audioForTranscription
    if (!resolvedAudioForTranscription) return false
    const resolvedRecordingDurationSeconds =
      values.kind === 'recording'
        ? await resolveRecordingDurationSeconds({
            recordingDurationSeconds: options?.recordingDurationSeconds,
            audioBlob: resolvedAudioForTranscription.blob,
          })
        : 0
    const requiredSeconds = Math.max(
      1,
      Math.ceil(values.kind === 'recording' ? resolvedRecordingDurationSeconds : audioDurationSeconds || 0),
    )
    const remainingSeconds = await readRemainingSecondsBeforeStart()
    if (remainingSeconds !== null && remainingSeconds < requiredSeconds) {
      setInsufficientMinutesContext({ kind: values.kind, remainingSeconds, requiredSeconds })
      setIsInsufficientMinutesWarningVisible(true)
      return false
    }
    return createAndOpenSessionInternal(values, { ...options, audioForTranscription: resolvedAudioForTranscription })
  }

  const { retryRecordingAfterError } = useNewSessionRecordingFlow({
    hasAutoStartedRecordingRef,
    hasAutoSubmittedRecordingRef,
    isRealtimeModeActive,
    isRealtimeTranscriberStarting,
    liveTranscriberRef,
    realtimeOperationIdRef,
    recorder,
    setAudioDurationSeconds,
    setAudioForTranscription,
    setAudioPreviewUrl,
    setIsRealtimeTranscriberStarting,
    setLiveTranscriptError,
    setLiveTranscriptText,
    setStep,
    step,
    visible,
  })

  useEffect(() => {
    if (!visible) return
    if (step !== 'recording') {
      setIsMinimized(false)
    }
  }, [step, visible])

  if (!isRendered) return null

  if (shouldShowMinimized) {
    return (
      <MinimizedRecordingLayer
        bars={bars}
        displayedRecordingElapsedSeconds={displayedRecordingElapsedSeconds}
        isMinimizedCloseWarningVisible={isMinimizedCloseWarningVisible}
        isRecordingPaused={isRecordingPaused}
        liveWaveHeights={liveWaveHeights}
        recorderStatus={recorder.status}
        onPauseOrResume={() => {
          if (recorder.status === 'recording') {
            recorder.pause()
            return
          }
          if (recorder.status === 'paused') {
            recorder.resume()
          }
        }}
        onRetryRecordingAfterError={retryRecordingAfterError}
        onShowCloseWarning={() => setIsMinimizedCloseWarningVisible(true)}
        onStopRecording={() => recorder.stop()}
        onRestore={startRestoreModal}
        onCloseWarningCancel={() => setIsMinimizedCloseWarningVisible(false)}
        onCloseWarningConfirm={() => {
          setIsMinimizedCloseWarningVisible(false)
          handleClose()
        }}
      />
    )
  }
  return (
    <View style={[styles.overlay, limitedMode ? styles.overlayLimited : undefined]} pointerEvents="auto">
      {!limitedMode ? <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} pointerEvents="none" /> : null}
      {!limitedMode ? <Pressable onPress={handleBackdropPress} style={styles.backdropPressable} pointerEvents="auto" /> : null}
      <Animated.View
        pointerEvents="auto"
        style={[
          styles.container,
          limitedMode ? styles.containerLimited : undefined,
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
        {!limitedMode ? <View style={styles.header}>
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
        </View> : null}

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
        <View style={[styles.body, step === 'select' ? styles.bodySelect : undefined]}>
          <AnimatedMainContent contentKey={step} style={styles.stepContent}>
            <NewSessionStepBody
              audioDurationSeconds={audioDurationSeconds}
              audioPreviewUrl={audioPreviewUrl}
              bars={bars}
              coacheeDropdownMaxHeight={coacheeDropdownMaxHeight}
              coacheeOptions={coacheeOptions}
              defaultDropdownMaxHeight={defaultDropdownMaxHeight}
              displayedRecordingElapsedSeconds={displayedRecordingElapsedSeconds}
              gesprekOptionLabel={gesprekOptionLabel}
              gespreksverslagOptionLabel={gespreksverslagOptionLabel}
              hasRecordingConsent={hasRecordingConsent}
              isCoacheeOpen={isCoacheeOpen}
              isCompactConsent={isCompactConsent}
              isRecordingPaused={isRecordingPaused}
              isUploadDragActive={isUploadDragActive}
              limitedMode={limitedMode}
              liveWaveHeights={liveWaveHeights}
              recorder={recorder}
              selectedAudioFile={selectedAudioFile}
              selectedCoacheeName={selectedCoachee?.name ?? unassignedCoacheeLabel}
              selectedOption={selectedOption}
              selectedOptionGroup={selectedOptionGroup}
              sessionTitle={sessionTitle}
              sessionTitleInputRef={sessionTitleInputRef}
              shouldSaveAudio={shouldSaveAudio}
              step={step}
              uploadDropAreaRef={uploadDropAreaRef}
              uploadFileDurationWarning={uploadFileDurationWarning}
              waveBarCount={waveBarCount}
              coacheeTriggerRef={coacheeTriggerRef}
              onAddCoachee={() => {
                setIsCoacheeOpen(false)
                onOpenNewCoachee()
              }}
              onCancelRecording={() => {
                recorder.reset()
                setStep('select')
              }}
              onOpenConsentHelpPage={openConsentHelpPage}
              onOpenFilePicker={openFilePicker}
              onRetryRecordingAfterError={retryRecordingAfterError}
              onSelectCoachee={handleSelectCoachee}
              onSelectOption={handleSelectOption}
              onSessionTitleChange={setSessionTitle}
              onSetWaveBarCount={setWaveBarCount}
              onToggleAudioSave={() => setShouldSaveAudio((value) => !value)}
              onToggleCoacheeDropdown={() => {
                updateDropdownMaxHeight(coacheeTriggerRef, setCoacheeDropdownMaxHeight)
                setIsCoacheeOpen((value) => !value)
              }}
              onToggleConsent={() => setHasRecordingConsent((value) => !value)}
              onUpdateAudioDuration={setAudioDurationSeconds}
            />
          </AnimatedMainContent>
        </View>

        {/* Modal footer */}
        {showFooter ? (
          <View
            style={[
              step === 'recorded' ? styles.footerInline : styles.footerFloating,
              (isUploadStep && !isCompactUploadFooter) || isConsentStep ? styles.footerSplit : undefined,
              isCompactUploadFooter ? styles.footerStacked : undefined,
              isLimitedFooter ? styles.mobileFooterContainer : undefined,
            ]}
          >
            {isConsentStep && !limitedMode ? (
              <Pressable
                onPress={() => {
                  if (limitedMode) {
                    requestClose()
                    return
                  }
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
                  {limitedMode ? 'Annuleren' : 'Terug'}
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
                isLimitedFooter ? styles.mobileFooterRightGroup : undefined,
              ]}
            >
              {isLimitedFooter ? (
                <>
                  <Pressable
                    disabled={isPrimaryActionDisabled}
                    onPress={handlePrimaryActionPress}
                    style={({ hovered, pressed }) => [
                      styles.footerButtonBase,
                      styles.footerButtonPrimary,
                      styles.footerButtonRight,
                      styles.mobileFooterButtonBase,
                      styles.mobileFooterPrimaryButton,
                      isPrimaryActionDisabled ? styles.primaryButtonDisabled : undefined,
                      hovered && !isPrimaryActionDisabled ? styles.footerButtonPrimaryHovered : undefined,
                      pressed && !isPrimaryActionDisabled ? styles.footerButtonPrimaryPressed : undefined,
                    ]}
                  >
                    <Text isBold style={[styles.footerButtonPrimaryText, styles.mobileFooterButtonText]}>
                      Doorgaan
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={requestClose}
                    style={({ hovered, pressed }) => [
                      styles.footerButtonBase,
                      styles.footerButtonSecondary,
                      styles.footerButtonLeft,
                      styles.cancelButtonNoBottomLeftRadius,
                      styles.mobileFooterButtonBase,
                      styles.mobileFooterSecondaryButton,
                      webTransitionSmooth,
                      hovered ? styles.footerButtonSecondaryHovered : undefined,
                      pressed ? styles.footerButtonSecondaryPressed : undefined,
                    ]}
                  >
                    <Text isBold style={[styles.footerButtonSecondaryText, styles.mobileFooterButtonText]}>
                      Annuleren
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={requestClose}
                    style={({ hovered, pressed }) => [
                      styles.footerButtonBase,
                      styles.footerButtonSecondary,
                      isUploadStep && !isCompactUploadFooter ? styles.footerButtonMiddle : styles.footerButtonLeft,
                      styles.cancelButtonNoBottomLeftRadius,
                      isCompactUploadFooter ? styles.footerButtonStackedSplit : undefined,
                      isCompactFooter ? styles.footerButtonCompact : undefined,
                      webTransitionSmooth,
                      hovered ? styles.footerButtonSecondaryHovered : undefined,
                      pressed ? styles.footerButtonSecondaryPressed : undefined,
                    ]}
                  >
                    <Text isBold style={styles.footerButtonSecondaryText}>
                      Annuleren
                    </Text>
                  </Pressable>
                  <Pressable
                    disabled={isPrimaryActionDisabled}
                    onPress={handlePrimaryActionPress}
                    style={({ hovered, pressed }) => [
                      styles.footerButtonBase,
                      styles.footerButtonPrimary,
                      styles.footerButtonRight,
                      isCompactUploadFooter ? styles.footerButtonStackedSplit : undefined,
                      isCompactFooter ? styles.footerButtonCompact : undefined,
                      isPrimaryActionDisabled ? styles.primaryButtonDisabled : undefined,
                      hovered && !isPrimaryActionDisabled ? styles.footerButtonPrimaryHovered : undefined,
                      pressed && !isPrimaryActionDisabled ? styles.footerButtonPrimaryPressed : undefined,
                    ]}
                  >
                    <Text isBold style={styles.footerButtonPrimaryText}>
                      {step === 'recorded' ? 'Verslag aanmaken' : 'Doorgaan'}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        ) : null}
      </Animated.View>
      <NewSessionAuxiliaryModals
        insufficientMinutesContext={insufficientMinutesContext}
        isInsufficientMinutesWarningVisible={isInsufficientMinutesWarningVisible}
        isRecordedCloseWarningVisible={isRecordedCloseWarningVisible}
        onCloseInsufficientMinutes={() => setIsInsufficientMinutesWarningVisible(false)}
        onCloseRecordedWarning={() => setIsRecordedCloseWarningVisible(false)}
        onConfirmRecordedDelete={() => {
          setIsRecordedCloseWarningVisible(false)
          handleClose()
        }}
        onDownloadAudioForInsufficientMinutes={() => {
          if (!insufficientMinutesContext) return
          downloadCurrentAudio(insufficientMinutesContext.kind)
        }}
        onOpenSubscriptionFromInsufficientMinutes={handleOpenSubscriptionFromInsufficientMinutes}
      />
    </View>
  )
}




