import { useEffect, useMemo } from 'react'
import { Animated, Easing, useWindowDimensions } from 'react-native'

import { useBrowserAudioRecorder } from '../../../audio/recording/useBrowserAudioRecorder'
import { useLiveAudioWaveformBars } from '../../../audio/recording/useLiveAudioWaveformBars'
import { useReducedMotion } from '../../../hooks/useReducedMotion'
import { useLocalAppData } from '../../../storage/LocalAppDataProvider'
import { useE2ee } from '../../../security/providers/E2eeProvider'
import { unassignedClientLabel } from '../../../types/client'
import { setPendingPreviewAudio } from '../../../audio/pendingPreviewStore'
import { processRecordedInput } from '../../../api/transcription/recorded/processRecordedSession'
import { fetchBillingStatus } from '../../../api/billing/billingApi'
import { clearSubscriptionReturnDraft, readAndClearSubscriptionReturnDraft, saveSubscriptionReturnDraft } from './subscriptionReturnDraft'
import { fetchRealtimeTranscriptionRuntime } from '../../../api/transcription/realtime/transcribeAudioRealtime'
import { useToast } from '../../../toast/ToastProvider'
import { isGespreksverslagTemplate } from '../../../content/templateCategories'
import { runPrimaryFooterAction } from './primaryAction'
import {
  buildAudioDownloadFileName,
  buildUploadDurationWarning,
  getDropdownMaxHeight,
  resolveDefaultTrajectoryIdForClient,
  validateUploadFileDuration,
} from './modalHelpers'
import { useNewInputModalState } from './useNewInputModalState'
import { useRecordingFlow } from './useRecordingFlow'
import {
  buildDefaultInputTitle,
  createOperationId,
  formatTimeLabel,
  getAudioMimeTypeFromFile,
  isAudioFile,
  maxDuration,
  maxRecordingSeconds,
  maxTranscriptionDurationSeconds,
  normalizeDraftOption,
  readAudioDurationSeconds,
  readRemainingTranscriptionSeconds,
  recordingWarningStartSeconds,
  type OptionKey,
} from '../utils'
import type { NewInputModalArgs } from '../types'

const BASE_RECORDING_MODAL_WIDTH = 747
const NOTES_PANEL_WIDTH = 437
const RECORDING_PANEL_GAP = 24
const BASE_RECORDING_MODAL_HEIGHT = 862
type InputKind = 'recording' | 'upload' | 'intake'

export function useNewInputModalController({
  visible,
  onClose,
  onRecordingBusyChange,
  onOpenGeschrevenGespreksverslag,
  onOpenMySubscription,
  restoreDraftFromSubscriptionReturn = false,
  onRestoreDraftHandled,
  onOpenInput,
  onOpenNewClient,
  initialClientId,
  initialTrajectoryId,
  newlyCreatedClientId,
  onNewlyCreatedClientHandled,
  limitedMode = false,
  initialOption = null,
}: NewInputModalArgs) {
  const isReducedMotionEnabled = useReducedMotion()
  const { data, createNote, createInput, createSnippet, updateInput } = useLocalAppData()
  const e2ee = useE2ee()
  const recorder = useBrowserAudioRecorder()
  const { showErrorToast } = useToast()

  const {
    audioDurationSeconds,
    audioForTranscription,
    audioPreviewUrl,
    backdropOpacity,
    clientDropdownMaxHeight,
    clientTriggerRef,
    hasAutoStartedRecordingRef,
    hasAutoSubmittedRecordingRef,
    hasRecordingConsent,
    insufficientMinutesContext,
    isClientOpen,
    isInsufficientMinutesWarningVisible,
    isMinimizeAnimating,
    isMinimized,
    isMinimizedCloseWarningVisible,
    isRealtimeTranscriberStarting,
    isRecordedCloseWarningVisible,
    isRendered,
    isRestoringFromMinimized,
    isUploadDragActive,
    isUploadDragActiveRef,
    liveTranscriptError,
    liveTranscriptText,
    liveTranscriberRef,
    minimizeProgress,
    modalOpacity,
    modalScale,
    modalTranslateY,
    realtimeOperationIdRef,
    recordingExpandProgress,
    recordingNoteDraft,
    recordingNotes,
    recordingNotesRevealProgress,
    selectedAudioFile,
    selectedClientId,
    selectedOption,
    selectedOptionGroup,
    selectedTemplateId,
    selectedTrajectoryId,
    sessionTitle,
    sessionTitleInputRef,
    shouldRenderRecordingNotesPanel,
    shouldSaveAudio,
    step,
    transcriptionMode,
    uploadDropAreaRef,
    uploadFileDurationWarning,
    waveBarCount,
    setAudioDurationSeconds,
    setAudioForTranscription,
    setAudioPreviewUrl,
    setClientDropdownMaxHeight,
    setHasRecordingConsent,
    setInsufficientMinutesContext,
    setIsClientOpen,
    setIsInsufficientMinutesWarningVisible,
    setIsMinimizeAnimating,
    setIsMinimized,
    setIsMinimizedCloseWarningVisible,
    setIsRealtimeTranscriberStarting,
    setIsRecordedCloseWarningVisible,
    setIsRendered,
    setIsRestoringFromMinimized,
    setIsUploadDragActive,
    setLiveTranscriptError,
    setLiveTranscriptText,
    setOpenOptionGroup,
    setRecordingNoteDraft,
    setRecordingNotes,
    setSelectedAudioFile,
    setSelectedClientId,
    setSelectedOption,
    setSelectedOptionGroup,
    setSelectedTemplateId,
    setSelectedTrajectoryId,
    setSelectedUploadFileDurationSeconds,
    setInputTitle,
    setShouldRenderRecordingNotesPanel,
    setShouldSaveAudio,
    setStep,
    setTranscriptionMode,
    setUploadFileDurationWarning,
    setWaveBarCount,
    selectedUploadFileDurationSeconds,
  } = useNewInputModalState(visible)

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
    setIsClientOpen(false)
    setSelectedClientId(null)
    setSelectedTrajectoryId(initialTrajectoryId ?? null)
    setSelectedTemplateId(defaultTemplateId)
    setInputTitle(buildDefaultInputTitle(null))
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
    setClientDropdownMaxHeight(null)
    setRecordingNotes([])
    setRecordingNoteDraft('')
    setShouldRenderRecordingNotesPanel(false)
    hasAutoStartedRecordingRef.current = false
    hasAutoSubmittedRecordingRef.current = false
  }, [initialTrajectoryId, visible])

  useEffect(() => {
    if (!visible) return
    if (!limitedMode) return
    if (!initialOption) return
    if (restoreDraftFromSubscriptionReturn) return
    setSelectedOption(initialOption)
    setInputTitle(buildDefaultInputTitle(initialOption))
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
        setSelectedClientId(draft.selectedClientId)
        setSelectedTemplateId(draft.selectedTemplateId ?? defaultTemplateId)
        setInputTitle(String(draft.sessionTitle || '').trim() || buildDefaultInputTitle(restoredOption))
        setAudioDurationSeconds(draft.audioDurationSeconds)
        setShouldSaveAudio(draft.shouldSaveAudio !== false)
        setAudioForTranscription({ blob: draft.blob, mimeType: draft.mimeType || 'application/octet-stream' })
        setAudioPreviewUrl(URL.createObjectURL(draft.blob))
        setSelectedAudioFile(null)
        setSelectedUploadFileDurationSeconds(null)
        setUploadFileDurationWarning(null)
        setStep('recorded')
      } catch (error) {
        console.error('[NewInputModal] Failed to restore subscription return draft', error)
      } finally {
        if (!isCancelled) {
          onRestoreDraftHandled?.()
        }
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [data.inputs, defaultTemplateId, onRestoreDraftHandled, restoreDraftFromSubscriptionReturn, visible])

  async function selectUploadFile(file: File | null) {
    if (!file) return
    if (!isAudioFile(file)) return
    setSelectedAudioFile(file)
    const validation = await validateUploadFileDuration({
      file,
      maxTranscriptionDurationSeconds,
    })
    setSelectedUploadFileDurationSeconds(validation.durationSeconds)
    setUploadFileDurationWarning(validation.warning)
  }

  function downloadCurrentAudio(kind: 'recording' | 'upload') {
    if (typeof window === 'undefined') return
    if (!audioForTranscription) return
    const objectUrl = URL.createObjectURL(audioForTranscription.blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = buildAudioDownloadFileName({
      kind,
      mimeType: audioForTranscription.mimeType,
      title: sessionTitle,
    })
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
        const runtimeConfig = await fetchRealtimeTranscriptionRuntime()
        if (isCancelled) return
        setTranscriptionMode(runtimeConfig.mode)
      } catch (error) {
        if (isCancelled) return
        console.warn('[NewInputModal] Failed to load transcription runtime config', error)
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

  const activeClients = useMemo(() => data.clients.filter((c) => !c.isArchived), [data.clients])
  const trajectoriesByClientId = useMemo(() => {
    const map = new Map<string, typeof data.trajectories>()
    for (const client of activeClients) {
      map.set(
        client.id,
        data.trajectories
          .filter((trajectory) => trajectory.clientId === client.id)
          .sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs),
      )
    }
    return map
  }, [activeClients, data.trajectories])

  useEffect(() => {
    if (newlyCreatedClientId && visible) {
      const client = activeClients.find((c) => c.id === newlyCreatedClientId)
      if (client) {
        setSelectedClientId(newlyCreatedClientId)
        setSelectedTrajectoryId(
          resolveDefaultTrajectoryIdForClient({
            clientId: newlyCreatedClientId,
            initialTrajectoryId,
            trajectoriesByClientId,
          }),
        )
        setIsClientOpen(false)
        onNewlyCreatedClientHandled()
      }
    }
  }, [activeClients, newlyCreatedClientId, onNewlyCreatedClientHandled, visible])

  useEffect(() => {
    if (!visible) return
    if (!initialClientId) return
    const client = activeClients.find((item) => item.id === initialClientId)
    if (!client) return
    setSelectedClientId(initialClientId)
    setSelectedTrajectoryId(
      resolveDefaultTrajectoryIdForClient({
        clientId: initialClientId,
        initialTrajectoryId,
        trajectoriesByClientId,
      }),
    )
  }, [activeClients, initialClientId, initialTrajectoryId, trajectoriesByClientId, visible])

  useEffect(() => {
    if (!visible) return
    if (!selectedClientId) {
      setSelectedTrajectoryId(null)
      return
    }
    const trajectories = trajectoriesByClientId.get(selectedClientId) ?? []
    if (trajectories.length === 0) {
      setSelectedTrajectoryId(null)
      return
    }
    if (selectedTrajectoryId && trajectories.some((trajectory) => trajectory.id === selectedTrajectoryId)) return
    setSelectedTrajectoryId(
      resolveDefaultTrajectoryIdForClient({
        clientId: selectedClientId,
        initialTrajectoryId,
        trajectoriesByClientId,
      }),
    )
  }, [initialTrajectoryId, selectedClientId, selectedTrajectoryId, trajectoriesByClientId, visible])

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

  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null
    return activeClients.find((client) => client.id === selectedClientId) ?? null
  }, [activeClients, selectedClientId])

  const clientOptions = useMemo(() => {
    return [{ id: null, name: unassignedClientLabel }, ...activeClients]
  }, [activeClients])

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
  const isDesktopRecordingStep = !limitedMode && step === 'recording'
  const showFooter = limitedMode ? step === 'consent' || step === 'recorded' || step === 'upload' : step !== 'recording'
  const isUploadStep = step === 'upload'
  const isConsentStep = step === 'consent'
  const isLimitedFooter = limitedMode && (step === 'consent' || step === 'recorded')
  const isCompactUploadFooter = isUploadStep && windowWidth <= 700
  const isCompactFooter = limitedMode || windowWidth <= 520
  const isCompactConsent = limitedMode || (step === 'consent' && windowWidth <= 520)
  const gesprekOptionLabel = 'Gesprek opnemen'
  const gespreksverslagOptionLabel = 'Gespreksverslag opnemen'
  const isInputTitleEmpty = sessionTitle.trim().length === 0
  const isPrimaryActionDisabled =
    (step === 'upload' && (!selectedAudioFile || !!uploadFileDurationWarning)) ||
    (!selectedOption && step === 'select' && !limitedMode) ||
    (step === 'consent' && !hasRecordingConsent) ||
    (step === 'recorded' && (!audioForTranscription || isInputTitleEmpty))
  const expandedRecordingWidth = BASE_RECORDING_MODAL_WIDTH + NOTES_PANEL_WIDTH + RECORDING_PANEL_GAP
  const modalHeight = Math.min(BASE_RECORDING_MODAL_HEIGHT, windowHeight * 0.92)
  const modalWidth = Math.min(isDesktopRecordingStep ? expandedRecordingWidth : BASE_RECORDING_MODAL_WIDTH, windowWidth * 0.95)
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

  useEffect(() => {
    if (!visible || limitedMode) return
    if (isReducedMotionEnabled) {
      recordingExpandProgress.setValue(isDesktopRecordingStep ? 1 : 0)
      recordingNotesRevealProgress.setValue(isDesktopRecordingStep ? 1 : 0)
      setShouldRenderRecordingNotesPanel(isDesktopRecordingStep)
      return
    }
    if (isDesktopRecordingStep) {
      setShouldRenderRecordingNotesPanel(false)
      recordingExpandProgress.stopAnimation()
      recordingNotesRevealProgress.stopAnimation()
      recordingNotesRevealProgress.setValue(0)
      Animated.timing(recordingExpandProgress, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (!finished) return
        setShouldRenderRecordingNotesPanel(true)
        Animated.sequence([
          Animated.delay(70),
          Animated.timing(recordingNotesRevealProgress, {
            toValue: 1,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ]).start()
      })
      return
    }

    Animated.sequence([
      Animated.timing(recordingNotesRevealProgress, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(recordingExpandProgress, {
        toValue: 0,
        duration: 260,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() => {
      setShouldRenderRecordingNotesPanel(false)
    })
  }, [
    isDesktopRecordingStep,
    isReducedMotionEnabled,
    limitedMode,
    recordingExpandProgress,
    recordingNotesRevealProgress,
    visible,
  ])

  function saveRecordingNote() {
    const trimmed = recordingNoteDraft.trim()
    if (!trimmed) return
    setRecordingNotes((current) => [...current, { id: createOperationId(), seconds: Math.max(0, displayedRecordingElapsedSeconds), text: trimmed }])
    setRecordingNoteDraft('')
  }

  function handleSelectOption(option: OptionKey) {
    if (option === 'gesprek') {
      setSelectedOptionGroup('gesprek')
      setSelectedOption('gesprek')
      setOpenOptionGroup(null)
      setInputTitle(limitedMode ? buildDefaultInputTitle('gesprek') : 'Voortgangsgesprek')
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
      setInputTitle(limitedMode ? buildDefaultInputTitle('gespreksverslag') : 'Voortgangsverslag')
      if (limitedMode) {
        setStep('recording')
      }
      return
    }
    if (option === 'schrijven') {
      setSelectedOption('schrijven')
      setSelectedOptionGroup('gespreksverslag')
      setOpenOptionGroup(null)
      setInputTitle('Gespreksverslag')
      return
    }
    if (option === 'upload') {
      setSelectedOption('upload')
      setSelectedOptionGroup(null)
      setOpenOptionGroup(null)
      setInputTitle('Bestand uploaden')
    }
  }

  function handlePrimaryActionPress() {
    runPrimaryFooterAction({
      hasRecordingConsent,
      isPrimaryActionDisabled,
      limitedMode,
      selectedClientId,
      selectedClientResolvedId: selectedClient?.id ?? null,
      selectedOption,
      step,
      createAndOpenInput,
      handleClose,
      onOpenGeschrevenGespreksverslag,
      saveSelectedFileToAudioStore,
      setHasRecordingConsent: (value) => setHasRecordingConsent(value),
      setStep,
      clearSubscriptionReturnDraft,
    })
  }

  function handleSelectClient(clientId: string | null) {
    setSelectedClientId(clientId)
    setSelectedTrajectoryId(
      resolveDefaultTrajectoryIdForClient({
        clientId,
        initialTrajectoryId,
        trajectoriesByClientId,
      }),
    )
    setIsClientOpen(false)
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
            selectedClientId,
            selectedTemplateId,
            sessionTitle,
            shouldSaveAudio,
            audioDurationSeconds,
            mimeType: audioForTranscription.mimeType,
            blob: audioForTranscription.blob,
          })
        } catch (error) {
          console.error('[NewInputModal] Failed to persist subscription return draft', error)
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

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (!isClientOpen) return

    const clientTriggerId = 'new-session-client-trigger'
    const clientPanelId = 'new-session-client-panel'

    const isInside = (id: string, target: Node | null) => {
      if (!target) return false
      const element = document.getElementById(id)
      return !!element && element.contains(target)
    }

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (
        isInside(clientTriggerId, target) ||
        isInside(clientPanelId, target)
      ) {
        return
      }
      setIsClientOpen(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isClientOpen])

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
      setUploadFileDurationWarning(buildUploadDurationWarning(detectedDurationSeconds, maxTranscriptionDurationSeconds))
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
      console.error('[NewInputModal] Failed to read billing status', error)
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

  async function createAndOpenInputInternal(
    values: { kind: 'recording' | 'upload' },
    options?: {
      sessionKind?: InputKind
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

    const createdInputId = createInput({
      clientId: selectedClient?.id ?? null,
      trajectoryId: selectedTrajectoryId ?? null,
      title: sessionTitle,
      kind: options?.sessionKind ?? values.kind,
      audioBlobId: null,
      audioDurationSeconds: nextAudioDurationSeconds,
      uploadFileName: values.kind === 'upload' ? selectedAudioFile?.name ?? null : null,
      transcriptionStatus: 'transcribing',
      transcriptionError: null,
    })

    if (!createdInputId) return false
    const now = Date.now()
    const shouldExtractSnippets =
      options?.sessionKind === 'intake' || values.kind === 'recording' || values.kind === 'upload'

    if (values.kind === 'recording' && recordingNotes.length > 0) {
      for (const note of recordingNotes) {
        createNote(createdInputId, {
          title: formatTimeLabel(note.seconds),
          text: note.text,
        })
      }
    }

    try {
      await setPendingPreviewAudio({
        sessionId: createdInputId,
        blob: resolvedAudioForTranscription.blob,
        mimeType: resolvedAudioForTranscription.mimeType,
        shouldSaveAudio: effectiveShouldSaveAudio,
        summaryTemplate: undefined,
      })
    } catch (error) {
      console.error('[NewInputModal] Failed to persist raw audio preview', error)
    }

    const nextAudioForTranscription = resolvedAudioForTranscription
    const realtimeChargeOperationId = isRealtimeModeActive ? (realtimeOperationIdRef.current || createOperationId()) : null
    if (isRealtimeModeActive && realtimeChargeOperationId) {
      realtimeOperationIdRef.current = realtimeChargeOperationId
    }
    onOpenInput(createdInputId)
    void clearSubscriptionReturnDraft()
    handleClose()

                void processRecordedInput({
      sessionId: createdInputId,
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
      updateInput,
      snippetExtraction: {
        enabled: shouldExtractSnippets,
        clientId: selectedClient?.id ?? null,
        trajectoryId: selectedTrajectoryId ?? null,
        itemDate: now,
        onCreatedSnippets: (snippets) => {
          for (const snippet of snippets) {
            createSnippet({
              id: snippet.id,
              trajectoryId: snippet.trajectoryId,
              inputId: snippet.inputId,
              itemId: snippet.itemId ?? snippet.inputId,
              field: snippet.field,
              text: snippet.text,
              date: snippet.date,
              status: snippet.status,
              createdAtUnixMs: snippet.createdAtUnixMs,
              updatedAtUnixMs: snippet.updatedAtUnixMs,
            })
          }
        },
      },
    }).catch((error) => {
      console.error('[NewInputModal] Input audio processing failed', { sessionId: createdInputId, error })
    })
    realtimeOperationIdRef.current = null
    return true
  }

  async function createAndOpenInput(
    values: { kind: 'recording' | 'upload' },
    options?: {
      sessionKind?: InputKind
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
    return createAndOpenInputInternal(values, { ...options, audioForTranscription: resolvedAudioForTranscription })
  }

  const { retryRecordingAfterError } = useRecordingFlow({
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

  const handleMinimizedPauseOrResume = () => {
    if (recorder.status === 'recording') {
      recorder.pause()
      return
    }
    if (recorder.status === 'paused') {
      recorder.resume()
    }
  }

  const handleMinimizedCloseWarningCancel = () => {
    setIsMinimizedCloseWarningVisible(false)
  }

  const handleMinimizedCloseWarningConfirm = () => {
    setIsMinimizedCloseWarningVisible(false)
    handleClose()
  }

  const handleAddClient = () => {
    setIsClientOpen(false)
    onOpenNewClient()
  }

  const handleCancelRecording = () => {
    recorder.reset()
    setStep('select')
  }

  const handleToggleAudioSave = () => {
    setShouldSaveAudio((value) => !value)
  }

  const handleToggleClientDropdown = () => {
    getDropdownMaxHeight({
      defaultDropdownMaxHeight,
      dropdownSafeBottom,
      windowHeight,
      target: clientTriggerRef.current,
      onResolved: setClientDropdownMaxHeight,
    })
    setIsClientOpen((value) => !value)
  }

  const handleToggleConsent = () => {
    setHasRecordingConsent((value) => !value)
  }

  const handleConsentBack = () => {
    if (limitedMode) {
      requestClose()
      return
    }
    setHasRecordingConsent(false)
    setStep('select')
  }

  const handleCloseInsufficientMinutes = () => {
    setIsInsufficientMinutesWarningVisible(false)
  }

  const handleCloseRecordedWarning = () => {
    setIsRecordedCloseWarningVisible(false)
  }

  const handleConfirmRecordedDelete = () => {
    setIsRecordedCloseWarningVisible(false)
    handleClose()
  }

  const handleDownloadAudioForInsufficientMinutes = () => {
    if (!insufficientMinutesContext) return
    downloadCurrentAudio(insufficientMinutesContext.kind)
  }

  return {
    isRendered,
    viewProps: {
      audioDurationSeconds,
      audioPreviewUrl,
      backdropOpacity,
      bars,
      clientDropdownMaxHeight,
      clientOptions,
      clientTriggerRef,
      defaultDropdownMaxHeight,
      displayedRecordingElapsedSeconds,
      displayedRecordingMaxSeconds,
      dropdownSafeBottom,
      expandedRecordingWidth,
      gesprekOptionLabel,
      gespreksverslagOptionLabel,
      handleBackdropPress,
      handleOpenSubscriptionFromInsufficientMinutes,
      handlePrimaryActionPress,
      handleSelectClient,
      handleSelectOption,
      handleAddClient,
      handleCancelRecording,
      handleCloseInsufficientMinutes,
      handleCloseRecordedWarning,
      handleConfirmRecordedDelete,
      handleConsentBack,
      handleDownloadAudioForInsufficientMinutes,
      handleMinimizedCloseWarningCancel,
      handleMinimizedCloseWarningConfirm,
      handleMinimizedPauseOrResume,
      handleToggleAudioSave,
      handleToggleClientDropdown,
      handleToggleConsent,
      hasRecordingConsent,
      insufficientMinutesContext,
      isClientOpen,
      isCompactConsent,
      isCompactFooter,
      isCompactUploadFooter,
      isConsentStep,
      isDesktopRecordingStep,
      isInsufficientMinutesWarningVisible,
      isLimitedFooter,
      isMinimizedCloseWarningVisible,
      isPrimaryActionDisabled,
      isRecordedCloseWarningVisible,
      isRecordingPaused,
      isUploadDragActive,
      isUploadStep,
      limitedMode,
      liveWaveHeights,
      minimizeProgress,
      minimizeScaleX,
      minimizeScaleY,
      minimizeTranslateX,
      minimizeTranslateY,
      modalHeight,
      modalOpacity,
      modalScale,
      modalTranslateY,
      openConsentHelpPage,
      openFilePicker,
      recorder,
      recordingExpandProgress,
      recordingLimitRemainingSeconds,
      recordingNoteDraft,
      recordingNotes,
      recordingNotesRevealProgress,
      requestClose,
      retryRecordingAfterError,
      saveRecordingNote,
      selectedAudioFile,
      selectedClientName: selectedClient?.name ?? unassignedClientLabel,
      selectedOption,
      selectedOptionGroup,
      sessionTitle,
      sessionTitleInputRef,
      setAudioDurationSeconds,
      setIsMinimizedCloseWarningVisible,
      setRecordingNoteDraft,
      setInputTitle,
      setWaveBarCount,
      shouldRenderRecordingNotesPanel,
      shouldSaveAudio,
      shouldShowMinimized,
      shouldShowRecordingLimitWarning,
      showFooter,
      startMinimizeModal,
      startRestoreModal,
      step,
      title,
      uploadDropAreaRef,
      uploadFileDurationWarning,
      waveBarCount,
      windowHeight,
      windowWidth,
    },
  }
}


