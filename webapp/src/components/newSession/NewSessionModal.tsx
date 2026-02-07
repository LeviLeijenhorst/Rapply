import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'

import { AnimatedDropdownPanel } from '../AnimatedDropdownPanel'
import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { useBrowserAudioRecorder } from '../../hooks/useBrowserAudioRecorder'
import { useLiveAudioWaveformBars } from '../../hooks/useLiveAudioWaveformBars'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useLocalAppData } from '../../local/LocalAppDataProvider'
import { useE2ee } from '../../e2ee/E2eeProvider'
import { createAudioBlobRemote } from '../../services/audioBlobs'
import { transcribeAudio } from '../../services/transcription'
import { generateSummary } from '../../services/summary'
import { colors } from '../../theme/colors'
import { webTransitionSmooth, webTransitionSlow } from '../../theme/webTransitions'
import { Text } from '../Text'
import { MicrophoneSmallIcon } from '../icons/MicrophoneSmallIcon'
import { ChevronDownIcon } from '../icons/ChevronDownIcon'
import { ModalCloseDarkIcon } from '../icons/ModalCloseDarkIcon'
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
import { unassignedCoacheeLabel } from '../../utils/coachee'

type Step = 'select' | 'upload' | 'recording' | 'recorded'
type OptionKey = 'gesprek' | 'verslag' | 'upload' | 'schrijven'

type Props = {
  visible: boolean
  onClose: () => void
  onStartWrittenReport: () => void
  onOpenSession: (sessionId: string) => void
  onOpenNewCoachee: () => void
  initialCoacheeId?: string | null
  newlyCreatedCoacheeId?: string | null
  onNewlyCreatedCoacheeHandled: () => void
}

function formatTimeLabel(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function NewSessionModal({
  visible,
  onClose,
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

  const [isRendered, setIsRendered] = useState(visible)
  const [step, setStep] = useState<Step>('select')
  const [selectedOption, setSelectedOption] = useState<OptionKey | null>(null)
  const [isCoacheeOpen, setIsCoacheeOpen] = useState(false)
  const [selectedCoacheeId, setSelectedCoacheeId] = useState<string | null>(null)
  const [isReportTypeOpen, setIsReportTypeOpen] = useState(false)
  const [selectedReportTypeLabel, setSelectedReportTypeLabel] = useState('Standaard verslag')
  const [sessionTitle, setSessionTitle] = useState('Sessie #3 (naamloos)')
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null)
  const [isUploadDragActive, setIsUploadDragActive] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isCloseWarningVisible, setIsCloseWarningVisible] = useState(false)
  const sessionTitleInputRef = useRef<TextInput | null>(null)
  const uploadDropAreaRef = useRef<View | null>(null)
  const isUploadDragActiveRef = useRef(false)
  const coacheeTriggerRef = useRef<any>(null)
  const reportTypeTriggerRef = useRef<any>(null)
  const [coacheeDropdownMaxHeight, setCoacheeDropdownMaxHeight] = useState<number | null>(null)
  const [reportTypeDropdownMaxHeight, setReportTypeDropdownMaxHeight] = useState<number | null>(null)

  const [audioBlobId, setAudioBlobId] = useState<string | null>(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null)
  const [isSavingAudio, setIsSavingAudio] = useState(false)
  const [audioForTranscription, setAudioForTranscription] = useState<{ blob: Blob; mimeType: string } | null>(null)
  const { height: windowHeight } = useWindowDimensions()

  const backdropOpacity = useRef(new Animated.Value(0)).current
  const modalOpacity = useRef(new Animated.Value(0)).current
  const modalScale = useRef(new Animated.Value(0.98)).current
  const modalTranslateY = useRef(new Animated.Value(10)).current

  useEffect(() => {
    if (!visible) return
    recorder.reset()
    setStep('select')
    setSelectedOption(null)
    setIsCoacheeOpen(false)
    setIsReportTypeOpen(false)
    setSelectedCoacheeId(null)
    setSelectedReportTypeLabel('Standaard verslag')
    setSessionTitle('Sessie #3 (naamloos)')
    setSelectedAudioFile(null)
    setAudioBlobId(null)
    setAudioPreviewUrl(null)
    setIsSavingAudio(false)
    setAudioForTranscription(null)
    setIsMinimized(false)
    setIsCloseWarningVisible(false)
    setIsUploadDragActive(false)
    setCoacheeDropdownMaxHeight(null)
    setReportTypeDropdownMaxHeight(null)
  }, [visible])

  useEffect(() => {
    if (!audioPreviewUrl) return
    return () => {
      URL.revokeObjectURL(audioPreviewUrl)
    }
  }, [audioPreviewUrl])


  useEffect(() => {
    if (visible) setIsRendered(true)
  }, [visible])

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
  const liveWaveHeights = useLiveAudioWaveformBars({
    mediaStream: recorder.mediaStream,
    barCount: waveBarCount,
    isActive: step === 'recording' && (recorder.status === 'recording' || recorder.status === 'paused'),
  })
  const isRecordingPaused = recorder.status === 'paused'
  const shouldShowMinimized = step === 'recording' && isMinimized


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
    step === 'select' ? 'Nieuwe sessie' : step === 'upload' ? 'MP3 bestand uploaden' : step === 'recording' ? 'Opnemen' : 'Gesprek opgenomen'
  const showFooter = step !== 'recording'
  const isUploadStep = step === 'upload'
  const modalHeight = Math.min(533, windowHeight * 0.9)
  const modalTop = (windowHeight - modalHeight) / 2
  const dropdownSafeBottom = 12
  const defaultDropdownMaxHeight = Math.max(120, windowHeight - modalTop - 72 - dropdownSafeBottom)

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
    input.accept = 'audio/mpeg,.mp3'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      setSelectedAudioFile(file)
    }
    input.click()
  }

  function isMp3File(file: File) {
    if (!file) return false
    if (file.type === 'audio/mpeg') return true
    return file.name.toLowerCase().endsWith('.mp3')
  }

  function handleDroppedFile(file: File | null) {
    if (!file) return
    if (!isMp3File(file)) return
    setSelectedAudioFile(file)
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
    setIsSavingAudio(true)
    try {
      const mimeType = selectedAudioFile.type || 'audio/mpeg'
      const encryptedBlob = await e2ee.encryptAudioBlobForStorage({ audioBlob: selectedAudioFile, mimeType })
      const created = await createAudioBlobRemote({ audioBlob: encryptedBlob, mimeType: 'application/octet-stream' })
      const nextId = String(created.audioBlobId || '').trim()
      if (!nextId) {
        throw new Error('Geen audio id teruggekregen van de server.')
      }
      setAudioBlobId(nextId)
      setAudioForTranscription({ blob: selectedAudioFile, mimeType })
      setAudioPreviewUrl(URL.createObjectURL(selectedAudioFile))
      setStep('recorded')
    } catch (error) {
      console.error('[NewSessionModal] Failed to save uploaded audio file', error)
    } finally {
      setIsSavingAudio(false)
    }
  }

  function handleClose() {
    recorder.reset()
    setAudioPreviewUrl(null)
    setAudioBlobId(null)
    setSelectedAudioFile(null)
    setIsSavingAudio(false)
    setAudioForTranscription(null)
    onClose()
  }

  function handleBackdropPress() {
    setIsCloseWarningVisible(true)
  }

  async function createAndOpenSession(values: { kind: 'recording' | 'upload' }) {
    if (!audioBlobId) return
    if (isSavingAudio) return
    if (!audioForTranscription) return

    const createdSessionId = createSession({
      coacheeId: selectedCoachee?.id ?? null,
      title: sessionTitle,
      kind: values.kind,
      audioBlobId,
      uploadFileName: values.kind === 'upload' ? selectedAudioFile?.name ?? null : null,
    })

    if (!createdSessionId) return

    updateSession(createdSessionId, { transcriptionStatus: 'transcribing' })

    const nextAudioForTranscription = audioForTranscription
    onOpenSession(createdSessionId)
    handleClose()

    void (async () => {
      try {
        const { transcript, summary } = await transcribeAudio({
          audioBlob: nextAudioForTranscription.blob,
          mimeType: nextAudioForTranscription.mimeType,
          languageCode: 'nl',
        })
        const cleanedSummary = String(summary || '').trim()
        if (cleanedSummary) {
          updateSession(createdSessionId, {
            transcript,
            summary: cleanedSummary,
            transcriptionStatus: 'done',
            transcriptionError: null,
          })
        } else {
          updateSession(createdSessionId, {
            transcript,
            transcriptionStatus: 'generating',
            transcriptionError: null,
          })
          const generatedSummary = await generateSummary({ transcript, templateKey: 'standaard' })
          updateSession(createdSessionId, {
            summary: generatedSummary,
            transcriptionStatus: 'done',
            transcriptionError: null,
          })
        }
      } catch (error) {
        console.error('[NewSessionModal] Transcription failed:', error)
        const rawMessage = error instanceof Error ? error.message : 'Unknown error'
        const isTooLarge = rawMessage.toLowerCase().includes('too large')
        updateSession(createdSessionId, {
          transcriptionStatus: 'error',
          transcriptionError: isTooLarge ? 'Audio bestand is te groot voor transcriptie.' : rawMessage,
        })
      }
    })()
  }

  useEffect(() => {
    if (!visible) return
    if (step !== 'recording') return
    if (recorder.status === 'recording' || recorder.status === 'paused' || recorder.status === 'requesting') return
    recorder.start()
  }, [recorder, step, visible])

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
    if (isSavingAudio) return

    setIsSavingAudio(true)
    ;(async () => {
      try {
        const blob = recorder.recordedBlob as Blob
        const mimeType = recorder.recordedMimeType as string
        const encryptedBlob = await e2ee.encryptAudioBlobForStorage({ audioBlob: blob, mimeType })
        const created = await createAudioBlobRemote({ audioBlob: encryptedBlob, mimeType: 'application/octet-stream' })
        const nextId = String(created.audioBlobId || '').trim()
        if (!nextId) {
          throw new Error('Geen audio id teruggekregen van de server.')
        }
        setAudioBlobId(nextId)
        setAudioForTranscription({ blob, mimeType })
        setAudioPreviewUrl(URL.createObjectURL(recorder.recordedBlob as Blob))
        setStep('recorded')
      } catch (error) {
        console.error('[NewSessionModal] Failed to save recorded audio', error)
      } finally {
        setIsSavingAudio(false)
      }
    })()
  }, [isSavingAudio, recorder.recordedBlob, recorder.recordedMimeType, recorder.status, step])

  if (!isRendered) return null

  if (shouldShowMinimized) {
    return (
      <View style={styles.minimizedOverlay} pointerEvents="box-none">
        {/* Minimized recording bar */}
        <Pressable onPress={() => setIsMinimized(false)} style={styles.minimizedBar}>
          <View style={styles.minimizedInfo}>
            {/* Recording time */}
            <View style={styles.minimizedTimeContainer}>
              <Text isSemibold style={styles.minimizedTimeText}>
                {formatTimeLabel(recorder.elapsedSeconds)}
              </Text>
            </View>
            {/* Recording waveform */}
            <View style={styles.minimizedWaveform}>
              {bars.map((index) => {
                const rawHeight = liveWaveHeights[index] ?? 6
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
                handleClose()
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
            transform: [{ translateY: modalTranslateY }, { scale: modalScale }],
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
                  onPress={() => setIsMinimized(true)}
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

            <Pressable
              onPress={handleClose}
              style={({ hovered, pressed }) => [
                styles.iconButton,
                webTransitionSmooth,
                hovered ? styles.iconButtonHovered : undefined,
                pressed ? styles.iconButtonPressed : undefined,
              ]}
            >
              {/* Close */}
              {({ pressed }) => (
                <>
                  {pressed && <View style={styles.iconButtonOverlay} />}
                  <ModalCloseDarkIcon />
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* Modal body */}
        <View style={styles.body}>
          {step === 'select' ? (
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
                label="MP3 bestand uploaden"
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
          ) : null}

          {step === 'upload' ? (
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
                  </View>
                </Pressable>
              </View>
            </View>
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
                  const height = liveWaveHeights[index] ?? 16
                  return <View key={index} style={[styles.waveBar, { height }]} />
                })}
              </View>

              {/* Recording timer */}
              <Text isSemibold style={styles.timerText}>
                {formatTimeLabel(recorder.elapsedSeconds)}
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
                  onPress={() => recorder.stop()}
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

              {recorder.errorMessage ? (
                <View style={styles.recordingErrorCard}>
                  {/* Recording error */}
                  <Text style={styles.recordingErrorText}>{recorder.errorMessage}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {step === 'recorded' ? (
            <View style={styles.recordedBody}>
              {audioPreviewUrl ? (
                <View style={styles.audioPreviewCard}>
                  {/* Audio preview */}
                  <audio controls src={audioPreviewUrl} style={{ width: '100%' }} />
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
                  placeholder="Sessie naam..."
                  placeholderTextColor="#656565"
                  style={[styles.sessionTitleInput, ({ outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any)]}
                />
              </Pressable>

              <View style={[styles.dropdownArea, isCoacheeOpen ? styles.dropdownAreaRaised : undefined]}>
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
                      {/* Add coachee */}
                      <ProfileCircleIcon />
                      <Text style={styles.coacheeItemAddText}>+ Nieuwe coachee</Text>
                    </Pressable>
                  </ScrollView>
                </AnimatedDropdownPanel>
              </View>

              <View style={[styles.dropdownArea, isReportTypeOpen ? styles.dropdownAreaRaised : undefined]}>
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
                    {selectedReportTypeLabel}
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
                    {['Standaard verslag', 'Voorbereiding', "Thema's", 'Gespreksplan'].map((label, index, items) => {
                      const isFirst = index === 0
                      const isLast = index === items.length - 1
                      return (
                        <Pressable
                          key={label}
                          onPress={() => {
                            setSelectedReportTypeLabel(label)
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
                          <Text style={styles.reportTypeItemText}>{label}</Text>
                        </Pressable>
                      )
                    })}
                  </ScrollView>
                </AnimatedDropdownPanel>
              </View>
            </View>
          ) : null}
        </View>

        {/* Modal footer */}
        {showFooter ? (
          <View style={[step === 'recorded' ? styles.footerInline : styles.footerFloating, isUploadStep ? styles.footerSplit : undefined]}>
            {step === 'upload' ? (
              <Pressable
                onPress={openFilePicker}
                style={({ hovered }) => [
                  styles.footerButtonBase,
                  styles.footerButtonSecondary,
                  styles.footerButtonLeft,
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
            <View style={[styles.footerRightGroup, isUploadStep ? undefined : styles.footerRightGroupAlignEnd]}>
              <Pressable
                onPress={() => setIsCloseWarningVisible(true)}
                style={({ hovered, pressed }) => [
                  styles.footerButtonBase,
                  styles.footerButtonSecondary,
                  isUploadStep ? styles.footerButtonMiddle : styles.footerButtonLeft,
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

                  if (!selectedOption) return
                  if (selectedOption === 'schrijven') {
                    onStartWrittenReport()
                    return
                  }
                  if (selectedOption === 'upload') {
                    setStep('upload')
                    return
                  }
                  setStep('recording')
                }}
                style={({ hovered, pressed }) => [
                  styles.footerButtonBase,
                  styles.footerButtonPrimary,
                  styles.footerButtonRight,
                  step === 'upload' && !selectedAudioFile ? styles.primaryButtonDisabled : undefined,
                  !selectedOption && step === 'select' ? styles.primaryButtonDisabled : undefined,
                  step === 'recorded' && isSavingAudio ? styles.primaryButtonDisabled : undefined,
                  hovered && (step === 'select' ? !!selectedOption : step === 'upload' ? !!selectedAudioFile : step === 'recorded' ? !!audioBlobId : false)
                    ? styles.footerButtonPrimaryHovered
                    : undefined,
                  pressed && !(step === 'upload' && !selectedAudioFile) && !(!selectedOption && step === 'select') && !(step === 'recorded' && isSavingAudio)
                    ? styles.footerButtonPrimaryPressed
                    : undefined,
                ]}
              >
                {/* Continue */}
                <Text isBold style={styles.footerButtonPrimaryText}>
                  {step === 'recorded' ? 'Sessie aanmaken' : 'Doorgaan'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Animated.View>

      <AnimatedOverlayModal
        visible={isCloseWarningVisible}
        onClose={() => setIsCloseWarningVisible(false)}
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
              onPress={() => setIsCloseWarningVisible(false)}
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
                setIsCloseWarningVisible(false)
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  footerRightGroupAlignEnd: {
    marginLeft: 'auto',
  },
  footerButtonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  footerButtonSecondaryHovered: {
    backgroundColor: colors.hoverBackground,
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
  recordingErrorCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.hoverBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  recordingErrorText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
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
    backgroundColor: colors.hoverBackground,
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
  audioPreviewCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.pageBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  uploadBody: {
    width: '100%',
    gap: 16,
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

