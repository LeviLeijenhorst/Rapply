import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, useWindowDimensions } from 'react-native'

import { useBrowserAudioRecorder } from '../../../audio/recording/useBrowserAudioRecorder'
import { useLiveAudioWaveformBars } from '../../../audio/recording/useLiveAudioWaveformBars'
import { useReducedMotion } from '../../../hooks/useReducedMotion'
import { useLocalAppData } from '../../../storage/LocalAppDataProvider'
import { useE2ee } from '../../../security/providers/E2eeProvider'
import { unassignedClientLabel } from '../../../types/client'
import { setPendingPreviewAudio } from '../../../audio/pendingPreviewStore'
import { createPipelineInput } from '../../../api/pipeline/pipelineApi'
import { processRecordedInput } from '../../../api/transcription/recorded/processRecordedSession'
import { fetchBillingStatus } from '../../../api/billing/billingApi'
import {
  appendMeetingRecordingChunkRemote,
  cancelMeetingRecordingRemote,
  MeetingRecordingApiError,
  startMeetingRecordingRemote,
  stopMeetingRecordingRemote,
} from '../../../api/meetingRecordings/meetingRecordingsApi'
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
import { useNewInputModalState } from './useNewSessionModalState'
import { useRecordingFlow } from './useRecordingFlow'
import {
  buildDefaultInputTitle,
  createOperationId,
  draftOptionToOptionKey,
  type DraftOptionKey,
  formatTimeLabel,
  getAudioMimeTypeFromFile,
  getDocumentMimeTypeFromFile,
  isAudioFile,
  isSupportedDocumentFile,
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
import { createId } from '../../../utils/createId'
import { markSidebarProcessingItemDone, removeSidebarProcessingItem, upsertSidebarProcessingItem } from '../../../app/shell/sidebarProcessingStore'

const BASE_RECORDING_MODAL_WIDTH = 747
const NOTES_PANEL_WIDTH = 437
const RECORDING_PANEL_GAP = 24
const BASE_RECORDING_MODAL_HEIGHT = 862
const MAX_DOCUMENT_UPLOAD_BYTES = 12 * 1024 * 1024
type InputKind = 'recording' | 'upload' | 'intake'
type ActiveMeetingRecording = {
  meetingRecordingId: string
  sessionId: string
  ingestToken: string
  nextChunkIndex: number
  nextStartMilliseconds: number
  uploadError: string | null
}

function mapMeetingRecordingErrorMessage(error: unknown): string {
  if (error instanceof MeetingRecordingApiError) {
    if (error.code === 'permission_denied') return 'Geen toegang tot opnemen. Log opnieuw in en probeer opnieuw.'
    if (error.code === 'network_error') return 'Netwerkfout tijdens opnemen. Controleer je verbinding en probeer opnieuw.'
    if (error.code === 'invalid_token') return 'De opname-token is ongeldig of verlopen. Start de opname opnieuw.'
    if (error.code === 'already_stopped') return 'Deze opname was al gestopt.'
    if (error.code === 'not_found') return 'De opname is niet gevonden op de server.'
    return error.message
  }
  if (error instanceof Error) return error.message
  return 'Video-opname mislukt. Probeer opnieuw.'
}

function draftOptionFromSelection({
  selectedOption,
  insufficientMinutesKind,
}: {
  selectedOption: OptionKey | null
  insufficientMinutesKind: 'recording' | 'upload' | null
}): DraftOptionKey {
  if (selectedOption === 'upload_audio' || selectedOption === 'upload_document' || insufficientMinutesKind === 'upload') return 'uploaded_audio'
  if (selectedOption === 'schrijven') return 'written_recap'
  if (selectedOption === 'gespreksverslag') return 'spoken_recap'
  return 'recorded_session'
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      reject(new Error('Bestandsupload is niet ondersteund in deze omgeving.'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('Bestand lezen is mislukt.'))
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const separatorIndex = result.indexOf(',')
      resolve(separatorIndex >= 0 ? result.slice(separatorIndex + 1) : result)
    }
    reader.readAsDataURL(file)
  })
}

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
  initialQuickAction = null,
}: NewInputModalArgs) {
  const isReducedMotionEnabled = useReducedMotion()
  const { data, createNote, createInput, createSnippet, updateInput, refreshAppData } = useLocalAppData()
  const e2ee = useE2ee()
  const { showErrorToast } = useToast()
  const activeMeetingRecordingRef = useRef<ActiveMeetingRecording | null>(null)
  const isMeetingRecordingFinalizingRef = useRef(false)
  const recorder = useBrowserAudioRecorder({
    onChunk: async ({ blob, durationSeconds }) => {
      const activeMeetingRecording = activeMeetingRecordingRef.current
      if (!activeMeetingRecording) return
      if (activeMeetingRecording.uploadError) return
      const chunkIndex = activeMeetingRecording.nextChunkIndex
      const startMilliseconds = activeMeetingRecording.nextStartMilliseconds
      const durationMilliseconds = Math.max(1, Math.round(durationSeconds * 1000))
      activeMeetingRecording.nextChunkIndex += 1
      activeMeetingRecording.nextStartMilliseconds += durationMilliseconds
      try {
        const arrayBuffer = await blob.arrayBuffer()
        await appendMeetingRecordingChunkRemote({
          meetingRecordingId: activeMeetingRecording.meetingRecordingId,
          ingestToken: activeMeetingRecording.ingestToken,
          chunkIndex,
          startMilliseconds,
          durationMilliseconds,
          chunkBytes: new Uint8Array(arrayBuffer),
        })
      } catch (error) {
        const message = mapMeetingRecordingErrorMessage(error)
        activeMeetingRecording.uploadError = message
        showErrorToast(message, 'Uploaden van video-opname is mislukt.')
      }
    },
  })

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
    isRecordingCloseWarningVisible,
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
    recordingShiftProgress,
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
    setIsRecordingCloseWarningVisible,
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
  const [editingRecordingNoteId, setEditingRecordingNoteId] = useState<string | null>(null)
  const [isVideoTabSelectionPending, setIsVideoTabSelectionPending] = useState(false)
  const shouldAnimateRecordingLayoutRef = useRef(true)

  const enterRecordingStep = useCallback(() => {
    shouldAnimateRecordingLayoutRef.current = true
    if (!limitedMode) {
      setShouldRenderRecordingNotesPanel(true)
      recordingExpandProgress.setValue(0)
      recordingShiftProgress.setValue(0)
      recordingNotesRevealProgress.setValue(0)
    }
    setStep('recording')
  }, [limitedMode, recordingExpandProgress, recordingNotesRevealProgress, recordingShiftProgress, setShouldRenderRecordingNotesPanel, setStep])

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
    setIsRecordingCloseWarningVisible(false)
    setHasRecordingConsent(false)
    setIsUploadDragActive(false)
    setClientDropdownMaxHeight(null)
    setRecordingNotes([])
    setRecordingNoteDraft('')
    setEditingRecordingNoteId(null)
    setIsVideoTabSelectionPending(false)
    setShouldRenderRecordingNotesPanel(false)
    recordingExpandProgress.setValue(0)
    recordingShiftProgress.setValue(0)
    recordingNotesRevealProgress.setValue(0)
    skipRecordingReadyAnimationRef.current = false
    shouldAnimateRecordingLayoutRef.current = true
    hasAutoStartedRecordingRef.current = false
    hasAutoSubmittedRecordingRef.current = false
    activeMeetingRecordingRef.current = null
    isMeetingRecordingFinalizingRef.current = false
  }, [initialTrajectoryId, visible])

  useEffect(() => {
    if (!visible) return
    if (!limitedMode) return
    if (!initialOption) return
    if (restoreDraftFromSubscriptionReturn) return
    setSelectedOption(initialOption)
    setInputTitle(buildDefaultInputTitle(initialOption))
    if (initialOption === 'gespreksverslag') {
      enterRecordingStep()
      setSelectedOptionGroup('gespreksverslag')
      return
    }
    setSelectedOptionGroup('gesprek')
    setHasRecordingConsent(false)
    setStep('consent')
  }, [enterRecordingStep, initialOption, limitedMode, restoreDraftFromSubscriptionReturn, visible])
  useEffect(() => {
    if (!visible) return
    if (!initialQuickAction) return
    if (restoreDraftFromSubscriptionReturn) return

    if (initialQuickAction === 'record-session') {
      setSelectedOption('gesprek')
      setSelectedOptionGroup('gesprek')
      setOpenOptionGroup(null)
      setInputTitle(limitedMode ? buildDefaultInputTitle('gesprek') : 'Voortgangsgesprek')
      setHasRecordingConsent(false)
      setStep('consent')
      return
    }

    if (initialQuickAction === 'record-summary') {
      setSelectedOption('gespreksverslag')
      setSelectedOptionGroup('gespreksverslag')
      setOpenOptionGroup(null)
      setInputTitle(limitedMode ? buildDefaultInputTitle('gespreksverslag') : 'Voortgangsverslag')
      enterRecordingStep()
      return
    }

    if (initialQuickAction === 'write-report') {
      setSelectedOption('schrijven')
      setSelectedOptionGroup(null)
      setOpenOptionGroup(null)
      setInputTitle('Samenvatting')
      void createAndOpenWrittenInput()
      return
    }

    if (initialQuickAction === 'record-video') {
      setSelectedOption('record-video')
      setSelectedOptionGroup('gesprek')
      setOpenOptionGroup(null)
      setInputTitle('Video call')
      setHasRecordingConsent(false)
      setStep('consent')
      return
    }

    if (initialQuickAction === 'import-audio') {
      setSelectedOption('upload_audio')
      setSelectedOptionGroup(null)
      setOpenOptionGroup(null)
      setInputTitle('Audio uploaden')
      setStep('upload')
      return
    }

    if (initialQuickAction === 'import-document') {
      setSelectedOption('upload_document')
      setSelectedOptionGroup(null)
      setOpenOptionGroup(null)
      setInputTitle('Document uploaden')
      setStep('upload')
    }
  }, [enterRecordingStep, initialQuickAction, limitedMode, restoreDraftFromSubscriptionReturn, setHasRecordingConsent, setInputTitle, setOpenOptionGroup, setSelectedOption, setSelectedOptionGroup, setStep, visible])

  useEffect(() => {
    if (!visible) return
    if (!restoreDraftFromSubscriptionReturn) return
    let isCancelled = false

    void (async () => {
      try {
        const draft = await readAndClearSubscriptionReturnDraft()
        if (isCancelled) return
        if (!draft) return

        const restoredOption = draftOptionToOptionKey(normalizeDraftOption(draft.selectedOption))
        setSelectedOption(restoredOption)
        setSelectedOptionGroup(restoredOption === 'gespreksverslag' ? 'gespreksverslag' : restoredOption === 'gesprek' ? 'gesprek' : null)
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
    if (isSupportedDocumentFile(file) && file.size > MAX_DOCUMENT_UPLOAD_BYTES) {
      showErrorToast('Dit document is te groot. Gebruik een bestand tot 12 MB.')
      return
    }
    const isDocumentMode = selectedOption === 'upload_document'
    if (isDocumentMode) {
      if (!isSupportedDocumentFile(file)) {
        showErrorToast('Alleen PDF, DOC en DOCX worden ondersteund.')
        return
      }
      setSelectedAudioFile(file)
      setSelectedUploadFileDurationSeconds(null)
      setUploadFileDurationWarning(null)
      return
    }
    if (isSupportedDocumentFile(file)) {
      showErrorToast('Kies een audiobestand voor deze optie.')
      return
    }
    if (!isAudioFile(file)) {
      showErrorToast('Alleen audiobestanden worden ondersteund.')
      return
    }
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
      const isRecordingLike = step === 'recording' || step === 'recording_finishing' || step === 'recording_canceling'
      if (isRecordingLike) {
        if (step === 'recording_finishing' || step === 'recording_canceling' || recorder.status === 'stopping') return
        startMinimizeModal()
        return
      }
      handleClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleClose, recorder.status, startMinimizeModal, step, visible])

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

  useEffect(() => {
    if (!visible) return
    if (selectedOption !== 'record-video') return
    if (selectedClientId) return
    const fallbackClientId = String(activeClients[0]?.id || '').trim()
    if (!fallbackClientId) return
    setSelectedClientId(fallbackClientId)
    setSelectedTrajectoryId(
      resolveDefaultTrajectoryIdForClient({
        clientId: fallbackClientId,
        initialTrajectoryId,
        trajectoriesByClientId,
      }),
    )
  }, [activeClients, initialTrajectoryId, selectedClientId, selectedOption, setSelectedClientId, setSelectedTrajectoryId, trajectoriesByClientId, visible])

  const clientOptions = useMemo(() => {
    return [{ id: null, name: unassignedClientLabel }, ...activeClients]
  }, [activeClients])

  const bars = useMemo(() => Array.from({ length: waveBarCount }, (_, index) => index), [waveBarCount])
  const isRealtimeModeActive = transcriptionMode === 'azure-realtime-live'
  const shouldUseRealtimeForRecording = isRealtimeModeActive || selectedOption === 'record-video'
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
  const isRecordingStep = step === 'recording'
  const isRecordingFinishingStep = step === 'recording_finishing'
  const isRecordingCancelingStep = step === 'recording_canceling'
  const isRecordingLayoutStep = isRecordingStep || isRecordingFinishingStep || isRecordingCancelingStep
  const isRecordingTransitioning = isRecordingFinishingStep || isRecordingCancelingStep || recorder.status === 'stopping'
  const shouldShowMinimized = isRecordingLayoutStep && isMinimized && !isRestoringFromMinimized
  const isRecordingBusy =
    visible &&
    (isRecordingLayoutStep ||
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
          : isRecordingLayoutStep
            ? 'Opnemen'
            : selectedOption === 'gesprek'
              ? 'Gesprek opgenomen'
              : selectedOption === 'record-video'
                ? 'Video call opgenomen'
              : selectedOption === 'intake'
                ? 'Intake opgenomen'
              : 'Verslag opgenomen'
  const isDesktopRecordingStep = !limitedMode && isRecordingLayoutStep
  const showFooter = limitedMode ? step === 'consent' || step === 'recorded' || step === 'upload' : !isRecordingLayoutStep
  const isUploadStep = step === 'upload'
  const isConsentStep = step === 'consent'
  const isLimitedFooter = limitedMode && (step === 'consent' || step === 'recorded')
  const isCompactUploadFooter = isUploadStep && windowWidth <= 700
  const isCompactFooter = limitedMode || windowWidth <= 520
  const isCompactConsent = limitedMode || (step === 'consent' && windowWidth <= 520)
  const gesprekOptionLabel = 'Gesprek opnemen'
  const gespreksverslagOptionLabel = 'Samenvatting opnemen'
  const isInputTitleEmpty = sessionTitle.trim().length === 0
  const selectedUploadIsDocument = selectedOption === 'upload_document' || isSupportedDocumentFile(selectedAudioFile)
  const isVideoRecordingUnsupported = selectedOption === 'record-video' && (!recorder.isSupported || !recorder.isDisplayCaptureSupported)
  const isPrimaryActionDisabled =
    (step === 'upload' && (!selectedAudioFile || !!uploadFileDurationWarning)) ||
    (!selectedOption && step === 'select' && !limitedMode) ||
    (step === 'select' && selectedOption === 'record-video' && !selectedClient?.id) ||
    (step === 'consent' && selectedOption === 'record-video' && isVideoTabSelectionPending) ||
    (step === 'select' && isVideoRecordingUnsupported) ||
    (step === 'consent' && !hasRecordingConsent) ||
    (step === 'recorded' && ((selectedUploadIsDocument ? false : !audioForTranscription) || isInputTitleEmpty)) ||
    isRecordingTransitioning
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
      recordingShiftProgress.setValue(isDesktopRecordingStep ? 1 : 0)
      recordingExpandProgress.setValue(isDesktopRecordingStep ? 1 : 0)
      recordingNotesRevealProgress.setValue(isDesktopRecordingStep ? 1 : 0)
      setShouldRenderRecordingNotesPanel(isDesktopRecordingStep)
      return
    }
    if (isDesktopRecordingStep) {
      if (!shouldAnimateRecordingLayoutRef.current) {
        recordingShiftProgress.setValue(1)
        recordingExpandProgress.setValue(1)
        recordingNotesRevealProgress.setValue(1)
        setShouldRenderRecordingNotesPanel(true)
        shouldAnimateRecordingLayoutRef.current = true
        return
      }
      recordingShiftProgress.stopAnimation()
      recordingExpandProgress.stopAnimation()
      recordingNotesRevealProgress.stopAnimation()
      recordingShiftProgress.setValue(0)
      recordingExpandProgress.setValue(0)
      recordingNotesRevealProgress.setValue(0)
      setShouldRenderRecordingNotesPanel(true)
      Animated.parallel([
        Animated.timing(recordingShiftProgress, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(recordingExpandProgress, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(recordingNotesRevealProgress, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start()
      return
    }
    recordingShiftProgress.setValue(0)
    recordingExpandProgress.setValue(0)
    recordingNotesRevealProgress.setValue(0)
    setShouldRenderRecordingNotesPanel(false)
  }, [
    isDesktopRecordingStep,
    isReducedMotionEnabled,
    limitedMode,
    recordingExpandProgress,
    recordingShiftProgress,
    recordingNotesRevealProgress,
    visible,
  ])

  function saveRecordingNote() {
    const trimmed = recordingNoteDraft.trim()
    if (!trimmed) return
    if (editingRecordingNoteId) {
      setRecordingNotes((current) =>
        current.map((note) => (note.id === editingRecordingNoteId ? { ...note, text: trimmed } : note)),
      )
      setEditingRecordingNoteId(null)
      setRecordingNoteDraft('')
      return
    }
    setRecordingNotes((current) => [...current, { id: createOperationId(), seconds: Math.max(0, displayedRecordingElapsedSeconds), text: trimmed }])
    setRecordingNoteDraft('')
  }

  function editRecordingNote(noteId: string) {
    const note = recordingNotes.find((item) => item.id === noteId)
    if (!note) return
    setEditingRecordingNoteId(noteId)
    setRecordingNoteDraft(note.text)
  }

  function deleteRecordingNote(noteId: string) {
    setRecordingNotes((current) => current.filter((note) => note.id !== noteId))
    if (editingRecordingNoteId === noteId) {
      setEditingRecordingNoteId(null)
      setRecordingNoteDraft('')
    }
  }

  function cancelEditingRecordingNote() {
    setEditingRecordingNoteId(null)
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
        enterRecordingStep()
      }
      return
    }
    if (option === 'record-video') {
      setSelectedOptionGroup('gesprek')
      setSelectedOption('record-video')
      setOpenOptionGroup(null)
      setInputTitle('Video call')
      return
    }
    if (option === 'schrijven') {
      setSelectedOption('schrijven')
      setSelectedOptionGroup(null)
      setOpenOptionGroup(null)
      setInputTitle('Samenvatting')
      return
    }
    if (option === 'upload_audio') {
      setSelectedOption('upload_audio')
      setSelectedOptionGroup(null)
      setOpenOptionGroup(null)
      setInputTitle('Audio uploaden')
      return
    }
    if (option === 'upload_document') {
      setSelectedOption('upload_document')
      setSelectedOptionGroup(null)
      setOpenOptionGroup(null)
      setInputTitle('Document uploaden')
    }
  }

  function startVideoMeetingRecordingFromConsent() {
    if (isVideoTabSelectionPending) return
    setIsVideoTabSelectionPending(true)
    hasAutoStartedRecordingRef.current = true
    void startVideoMeetingRecording().catch((error) => {
      setIsVideoTabSelectionPending(false)
      hasAutoStartedRecordingRef.current = false
      activeMeetingRecordingRef.current = null
      const message = mapMeetingRecordingErrorMessage(error)
      showErrorToast(message, 'Starten van video-opname is mislukt.')
      setStep('consent')
    })
  }

  function handlePrimaryActionPress() {
    runPrimaryFooterAction({
      hasRecordingConsent,
      isRecordingTransitioning,
      isPrimaryActionDisabled,
      limitedMode,
      selectedClientId,
      selectedClientResolvedId: selectedClient?.id ?? null,
      selectedOption,
      step,
      createAndOpenInput,
      createAndOpenWrittenInput,
      handleClose,
      onOpenGeschrevenGespreksverslag,
      saveSelectedFileToAudioStore,
      startVideoMeetingRecordingFromConsent,
      setHasRecordingConsent: (value) => setHasRecordingConsent(value),
      setStep: (nextStep) => {
        if (nextStep === 'recording') {
          enterRecordingStep()
          return
        }
        setStep(nextStep)
      },
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
      const selectedOptionForRestore = draftOptionFromSelection({
        selectedOption,
        insufficientMinutesKind: insufficientMinutesContext?.kind ?? null,
      })
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
      onOpenMySubscription({ returnClientId: selectedClient?.id ?? selectedClientId })
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
    const isDocumentMode = selectedOption === 'upload_document'
    input.accept = isDocumentMode
      ? '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'audio/*,.mp3,.m4a,.mp4,.aac,.wav,.ogg,.opus,.webm,.flac'
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
    if (isSupportedDocumentFile(selectedAudioFile)) {
      setSelectedUploadFileDurationSeconds(null)
      setUploadFileDurationWarning(null)
      setAudioDurationSeconds(null)
      setAudioForTranscription(null)
      setAudioPreviewUrl(null)
      setStep('recorded')
      return
    }
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
    if (activeMeetingRecordingRef.current) {
      void cancelVideoMeetingRecording()
    }
    setIsVideoTabSelectionPending(false)
    recorder.reset()
    setAudioPreviewUrl(null)
    setSelectedAudioFile(null)
    setShouldSaveAudio(false)
    setAudioForTranscription(null)
    setIsMinimizedCloseWarningVisible(false)
    setIsRecordedCloseWarningVisible(false)
    setIsRecordingCloseWarningVisible(false)
    skipRecordingReadyAnimationRef.current = false
    void clearSubscriptionReturnDraft()
    onClose()
  }

  function shouldConfirmRecordedClose() {
    if (step !== 'recorded') return false
    return Boolean(audioForTranscription || selectedAudioFile || audioPreviewUrl)
  }

  function requestClose() {
    if (isRecordingTransitioning) return
    if (shouldConfirmRecordedClose()) {
      setIsRecordedCloseWarningVisible(true)
      return
    }
    handleClose()
  }

  function handleBackdropPress() {
    if (isRecordingLayoutStep) {
      if (isRecordingTransitioning) return
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

  async function createAndOpenDocumentInput(documentFile: File): Promise<boolean> {
    if (!selectedClient?.id) {
      showErrorToast('Kies eerst een client voor dit document.')
      return false
    }
    const now = Date.now()
    const processingId = createId('document-processing')
    upsertSidebarProcessingItem({
      id: processingId,
      kind: 'document',
      label: sessionTitle.trim() || documentFile.name || 'Document uploaden',
      status: 'processing',
    })
    try {
      const documentBase64 = await readFileAsBase64(documentFile)
      const response = await createPipelineInput({
        clientId: selectedClient.id,
        trajectoryId: selectedTrajectoryId ?? null,
        title: sessionTitle,
        inputType: 'uploaded_document',
        uploadFileName: documentFile.name,
        sourceMimeType: getDocumentMimeTypeFromFile(documentFile),
        documentBase64,
        createdAtUnixMs: now,
        updatedAtUnixMs: now,
      })
      await refreshAppData()
      void clearSubscriptionReturnDraft()
      handleClose()
      markSidebarProcessingItemDone(processingId)
      return true
    } catch (error) {
      console.error('[NewInputModal] Documentverwerking mislukt', error)
      showErrorToast(error instanceof Error ? error.message : 'Document uploaden is mislukt. Probeer opnieuw.')
      removeSidebarProcessingItem(processingId)
      return false
    }
  }

  async function createAndOpenInputInternal(
    values: { kind: 'recording' | 'upload' | 'written' },
    options?: {
      sessionKind?: InputKind
      overrideShouldSaveAudio?: boolean
      audioForTranscription?: { blob: Blob; mimeType: string }
      recordingDurationSeconds?: number | null
    },
  ): Promise<boolean> {
    if (values.kind === 'written') {
      const createdInputId = createInput({
        clientId: selectedClient?.id ?? null,
        trajectoryId: selectedTrajectoryId ?? null,
        title: sessionTitle,
        kind: 'written',
        audioBlobId: null,
        audioDurationSeconds: null,
        uploadFileName: null,
        transcriptionStatus: 'idle',
        transcriptionError: null,
      })

      if (!createdInputId) return false
      onOpenInput(createdInputId)
      void clearSubscriptionReturnDraft()
      handleClose()
      return true
    }

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
      const bundledNotesText = [...recordingNotes]
        .sort((left, right) => left.seconds - right.seconds)
        .map((note) => `[${formatTimeLabel(note.seconds)}] ${note.text}`)
        .join('\n\n')
      const recordingName = sessionTitle.trim() || 'de opname'
      createNote(createdInputId, {
        title: `Notities tijdens ${recordingName}`,
        text: bundledNotesText,
      })
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
    const realtimeTranscript = shouldUseRealtimeForRecording ? liveTranscriptText.trim() : ''
    const realtimeChargeOperationId = shouldUseRealtimeForRecording ? (realtimeOperationIdRef.current || createOperationId()) : null
    if (shouldUseRealtimeForRecording && realtimeChargeOperationId) {
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
      transcriptOverride: shouldUseRealtimeForRecording ? realtimeTranscript : null,
      realtimeCharge:
        shouldUseRealtimeForRecording
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
    values: { kind: 'recording' | 'upload' | 'written' },
    options?: {
      sessionKind?: InputKind
      overrideShouldSaveAudio?: boolean
      audioForTranscription?: { blob: Blob; mimeType: string }
      recordingDurationSeconds?: number | null
    },
  ): Promise<boolean> {
    if (values.kind === 'written') {
      return createAndOpenInputInternal(values, options)
    }

    if (values.kind === 'upload' && selectedAudioFile && isSupportedDocumentFile(selectedAudioFile)) {
      return createAndOpenDocumentInput(selectedAudioFile)
    }

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

  async function createAndOpenWrittenInput(): Promise<boolean> {
    return createAndOpenInput({ kind: 'written' })
  }

  const startVideoMeetingRecording = useCallback(async () => {
    if (!selectedClient?.id) {
      showErrorToast('Kies eerst een client voordat je een videogesprek opneemt.')
      setStep('select')
      return
    }
    if (!isRealtimeModeActive) {
      showErrorToast('Realtime transcriptie staat uit. Zet transcription mode op "azure-realtime-live" om een videogesprek op te nemen.')
      setStep('consent')
      return
    }
    const captureStarted = recorder.startWithCaptureMode
      ? await recorder.startWithCaptureMode('display-with-audio-fallback')
      : await recorder.start()
    if (!captureStarted) {
      throw new Error('Het starten van schermdeling is geannuleerd.')
    }
    const started = await startMeetingRecordingRemote({
      sessionId: null,
      clientId: selectedClient.id,
      trajectoryId: selectedTrajectoryId ?? null,
      title: sessionTitle,
      languageCode: 'nl',
      mimeType: 'video/webm',
      sourceApp: 'web',
      provider: 'browser',
    })
    activeMeetingRecordingRef.current = {
      meetingRecordingId: started.meetingRecordingId,
      sessionId: started.sessionId,
      ingestToken: started.ingestToken,
      nextChunkIndex: 0,
      nextStartMilliseconds: 0,
      uploadError: null,
    }
    hasAutoSubmittedRecordingRef.current = false
  }, [hasAutoSubmittedRecordingRef, isRealtimeModeActive, recorder, selectedClient?.id, selectedTrajectoryId, sessionTitle, setStep, showErrorToast])

  const stopVideoMeetingRecordingDraft = useCallback(async () => {
    if (isMeetingRecordingFinalizingRef.current) return
    const activeMeetingRecording = activeMeetingRecordingRef.current
    if (!activeMeetingRecording) return
    isMeetingRecordingFinalizingRef.current = true
    try {
      await stopMeetingRecordingRemote({
        meetingRecordingId: activeMeetingRecording.meetingRecordingId,
        endedAtUnixMs: Date.now(),
        reason: 'user_stop',
      })
      activeMeetingRecordingRef.current = null
    } catch (error) {
      const message = mapMeetingRecordingErrorMessage(error)
      console.warn('[NewInputModal] Stoppen van video-opname is mislukt', { error: message })
      showErrorToast(message, 'Stoppen van video-opname is mislukt.')
    } finally {
      isMeetingRecordingFinalizingRef.current = false
    }
  }, [showErrorToast])

  const cancelVideoMeetingRecording = useCallback(async () => {
    const activeMeetingRecording = activeMeetingRecordingRef.current
    if (!activeMeetingRecording) return
    try {
      await cancelMeetingRecordingRemote({ meetingRecordingId: activeMeetingRecording.meetingRecordingId })
    } catch (error) {
      const message = mapMeetingRecordingErrorMessage(error)
      showErrorToast(message, 'Annuleren van video-opname is mislukt.')
    } finally {
      activeMeetingRecordingRef.current = null
    }
  }, [showErrorToast])

  const animateRecordingLayoutExit = useCallback((onComplete: () => void) => {
    shouldAnimateRecordingLayoutRef.current = false
    recordingNotesRevealProgress.stopAnimation()
    recordingExpandProgress.stopAnimation()
    recordingShiftProgress.stopAnimation()

    Animated.parallel([
      Animated.timing(recordingNotesRevealProgress, {
        toValue: 0,
        duration: 220,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(recordingExpandProgress, {
        toValue: 0,
        duration: 220,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(recordingShiftProgress, {
        toValue: 0,
        duration: 220,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (!finished) return
      setShouldRenderRecordingNotesPanel(false)
      onComplete()
    })
  }, [recordingExpandProgress, recordingNotesRevealProgress, recordingShiftProgress, setShouldRenderRecordingNotesPanel])

  const recordingFinishTransitionRef = useRef(0)
  const skipRecordingReadyAnimationRef = useRef(false)

  const handleRecordingReady = useCallback((_payload: { blob: Blob; mimeType: string; durationSeconds: number }) => {
    const skipAnimation = skipRecordingReadyAnimationRef.current
    skipRecordingReadyAnimationRef.current = false
    if (selectedOption === 'record-video') {
      void stopVideoMeetingRecordingDraft()
      setStep('recorded')
      return
    }
    const transitionToken = recordingFinishTransitionRef.current + 1
    recordingFinishTransitionRef.current = transitionToken

    const finalizeToRecorded = () => {
      if (recordingFinishTransitionRef.current !== transitionToken) return
      setStep('recorded')
    }

    if (skipAnimation || !visible || limitedMode || isReducedMotionEnabled || isMinimized) {
      setShouldRenderRecordingNotesPanel(false)
      recordingNotesRevealProgress.setValue(0)
      recordingExpandProgress.setValue(0)
      recordingShiftProgress.setValue(0)
      finalizeToRecorded()
      return
    }

    animateRecordingLayoutExit(() => {
      if (recordingFinishTransitionRef.current !== transitionToken) return
      finalizeToRecorded()
    })
  }, [
    animateRecordingLayoutExit,
    isReducedMotionEnabled,
    isMinimized,
    limitedMode,
    selectedOption,
    setStep,
    stopVideoMeetingRecordingDraft,
    visible,
  ])

  const handleStopRecording = useCallback(() => {
    if (isRecordingTransitioning) return
    if (step !== 'recording') return
    skipRecordingReadyAnimationRef.current = true
    recorder.stop()
  }, [isRecordingTransitioning, recorder, setStep, step])

  const { retryRecordingAfterError } = useRecordingFlow({
    hasAutoStartedRecordingRef,
    hasAutoSubmittedRecordingRef,
    isRealtimeModeActive: shouldUseRealtimeForRecording,
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
    onRecordingReady: handleRecordingReady,
    includeSpeakerLabelsInRealtimeTranscript: selectedOption !== 'gespreksverslag',
    useDisplayCapture: selectedOption === 'record-video',
    disableAutoStart: selectedOption === 'record-video',
    step,
    visible,
  })

  useEffect(() => {
    if (!visible) return
    if (!isVideoTabSelectionPending) return
    if (selectedOption !== 'record-video') {
      setIsVideoTabSelectionPending(false)
      return
    }
    if (step !== 'consent') return
    if (recorder.status === 'recording') {
      setIsVideoTabSelectionPending(false)
      enterRecordingStep()
      return
    }
    if (recorder.status === 'error') {
      setIsVideoTabSelectionPending(false)
      hasAutoStartedRecordingRef.current = false
      void cancelVideoMeetingRecording()
      setStep('consent')
    }
  }, [cancelVideoMeetingRecording, enterRecordingStep, isVideoTabSelectionPending, recorder.status, selectedOption, setStep, step, visible])

  useEffect(() => {
    if (!visible) return
    if (step !== 'recording') return
    if (selectedOption !== 'record-video') return
    if (hasAutoStartedRecordingRef.current) return
    if (recorder.status !== 'idle') return
    hasAutoStartedRecordingRef.current = true
    void startVideoMeetingRecording().catch((error) => {
      hasAutoStartedRecordingRef.current = false
      activeMeetingRecordingRef.current = null
      const message = mapMeetingRecordingErrorMessage(error)
      showErrorToast(message, 'Starten van video-opname is mislukt.')
      setStep('consent')
    })
  }, [hasAutoStartedRecordingRef, recorder.status, selectedOption, setStep, showErrorToast, startVideoMeetingRecording, step, visible])

  useEffect(() => {
    if (!visible) return
    if (step !== 'recording' && step !== 'recording_finishing' && step !== 'recording_canceling') {
      setIsMinimized(false)
      setEditingRecordingNoteId(null)
    }
  }, [step, visible])

  useEffect(() => {
    if (!visible) return
    if (step !== 'recorded') return
    const focusRaf = requestAnimationFrame(() => {
      focusTimeout = setTimeout(() => sessionTitleInputRef.current?.focus(), 80)
    })
    let focusTimeout: ReturnType<typeof setTimeout> | null = null
    return () => {
      cancelAnimationFrame(focusRaf)
      if (focusTimeout) clearTimeout(focusTimeout)
    }
  }, [sessionTitleInputRef, step, visible])

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

  const performCancelRecording = () => {
    if (isRecordingTransitioning) return
    if (selectedOption === 'record-video') {
      void cancelVideoMeetingRecording()
    }
    recorder.reset()
    setEditingRecordingNoteId(null)
    if (limitedMode || isReducedMotionEnabled) {
      setShouldRenderRecordingNotesPanel(false)
      recordingNotesRevealProgress.setValue(0)
      recordingExpandProgress.setValue(0)
      recordingShiftProgress.setValue(0)
      setStep('select')
      return
    }
    setStep('recording_canceling')
    animateRecordingLayoutExit(() => {
      setStep('select')
    })
  }

  const handleCancelRecording = () => {
    if (isRecordingTransitioning) return
    setIsRecordingCloseWarningVisible(true)
  }

  const handleCloseRecordingWarning = () => {
    setIsRecordingCloseWarningVisible(false)
  }

  const handleConfirmRecordingCancel = () => {
    setIsRecordingCloseWarningVisible(false)
    performCancelRecording()
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
    setIsVideoTabSelectionPending(false)
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
      handleCloseRecordingWarning,
      handleCloseRecordedWarning,
      handleConfirmRecordingCancel,
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
      isRecordingCloseWarningVisible,
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
      recordingShiftProgress,
      recordingLimitRemainingSeconds,
      editingRecordingNoteId,
      recordingNoteDraft,
      recordingNotes,
      recordingNotesRevealProgress,
      requestClose,
      retryRecordingAfterError,
      saveRecordingNote,
      editRecordingNote,
      deleteRecordingNote,
      cancelEditingRecordingNote,
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
      isRecordingTransitioning,
      shouldShowMinimized,
      shouldShowRecordingLimitWarning,
      showFooter,
      handleStopRecording,
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



