import { useRef, useState } from 'react'
import { Animated, TextInput, View } from 'react-native'

import type { RealtimeTranscriberInput, TranscriptionMode } from '../../../api/transcription/realtime/transcribeAudioRealtime'
import type { NewInputStep } from '../types'
import { buildDefaultInputTitle, type OptionKey } from '../utils'

export function useNewInputModalState(visible: boolean) {
  const [isRendered, setIsRendered] = useState(visible)
  const [step, setStep] = useState<NewInputStep>('select')
  const [selectedOption, setSelectedOption] = useState<OptionKey | null>(null)
  const [selectedOptionGroup, setSelectedOptionGroup] = useState<'gesprek' | 'gespreksverslag' | null>(null)
  const [, setOpenOptionGroup] = useState<'gesprek' | 'gespreksverslag' | null>(null)
  const [isClientOpen, setIsClientOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedTrajectoryId, setSelectedTrajectoryId] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [sessionTitle, setInputTitle] = useState(() => buildDefaultInputTitle(null))
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
  const clientTriggerRef = useRef<any>(null)
  const hasAutoStartedRecordingRef = useRef(false)
  const hasAutoSubmittedRecordingRef = useRef(false)
  const [clientDropdownMaxHeight, setClientDropdownMaxHeight] = useState<number | null>(null)
  const [recordingNotes, setRecordingNotes] = useState<Array<{ id: string; seconds: number; text: string }>>([])
  const [recordingNoteDraft, setRecordingNoteDraft] = useState('')

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
  const liveTranscriberRef = useRef<RealtimeTranscriberInput | null>(null)
  const realtimeOperationIdRef = useRef<string | null>(null)
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const modalOpacity = useRef(new Animated.Value(0)).current
  const modalScale = useRef(new Animated.Value(0.98)).current
  const modalTranslateY = useRef(new Animated.Value(10)).current
  const recordingExpandProgress = useRef(new Animated.Value(0)).current
  const recordingShiftProgress = useRef(new Animated.Value(0)).current
  const recordingNotesRevealProgress = useRef(new Animated.Value(0)).current
  const minimizeProgress = useRef(new Animated.Value(0)).current
  const [isMinimizeAnimating, setIsMinimizeAnimating] = useState(false)
  const [isRestoringFromMinimized, setIsRestoringFromMinimized] = useState(false)
  const [shouldRenderRecordingNotesPanel, setShouldRenderRecordingNotesPanel] = useState(false)
  const [waveBarCount, setWaveBarCount] = useState(64)

  return {
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
  }
}

