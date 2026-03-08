import React, { useEffect, useMemo, useState, useRef } from "react"
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  AppState,
  TextInput,
  Keyboard,
  useWindowDimensions,
} from "react-native"
import { Text } from "./Text"
import { colors, spacing, typography, safeAreaBottom, vibrate, radius } from "./constants"
import { Icon } from "./Icon"
import { useNavigation, useRoute, useIsFocused } from "@react-navigation/native"
import { logger } from "@/utils/logger"
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  type RecordingSource,
  setAudioModeAsync,
} from "expo-audio"

const MAX_VISIBLE_BARS = 50
const MAX_RECORDING_DURATION_MINUTES = 115
const MAX_RECORDING_DURATION_MILLISECONDS = MAX_RECORDING_DURATION_MINUTES * 60 * 1000
const FIGMA_LEFT_PANEL_WIDTH = 747
const FIGMA_RIGHT_PANEL_WIDTH = 437
const FIGMA_PANEL_HEIGHT = 862
const FIGMA_PANEL_GAP = 24
const FIGMA_WAVE_BARS = [
  44, 80, 138, 112, 94, 68, 96, 110, 54, 42, 58, 140, 108, 92, 74, 98, 108, 46, 52, 72, 98, 114, 88, 124, 138, 128,
  112, 116, 98, 76, 104, 114, 92, 64, 50, 74, 120, 86, 106, 98, 72, 46, 58, 60, 140, 108, 86, 98, 110, 62, 56, 68,
]

type RecordingNote = {
  id: string
  date: number
  text: string
  recordingMs: number
}

function AudioBar({ value }: { value: number }) {
  const minHeight = 10
  const maxHeight = 300

  const adjusted = value + 15
  const clamped = Math.max(-60, Math.min(0, adjusted))
  const normalized = (clamped + 60) / 60
  const height = minHeight + normalized * (maxHeight - minHeight)

  return <View style={[styles.audioBar, { height }]} />
}

const MemoizedAudioBar = React.memo(AudioBar)

export default function RecordingScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const coacheeName: string | undefined = route?.params?.coacheeName
  const mode: "conversation" | "spoken_report" | undefined = route?.params?.mode

  const shouldShowAudioBars = false

  const [isRecordingPaused, setIsRecordingPaused] = useState(false)
  const [isCloseConfirmationVisible, setIsCloseConfirmationVisible] = useState(false)
  const [noteDraft, setNoteDraft] = useState("")
  const [notes, setNotes] = useState<RecordingNote[]>([])

  type MeterSample = { id: number; value: number }
  const [visibleMetering, setVisibleMetering] = useState<MeterSample[]>([])

  const isFocused = useIsFocused()
  const window = useWindowDimensions()

  const recorderConfig = useMemo(
    () => ({
      ...RecordingPresets.HIGH_QUALITY,
      numberOfChannels: 1,
      isMeteringEnabled: true,
      android: { ...RecordingPresets.HIGH_QUALITY.android, audioSource: "unprocessed" as RecordingSource },
      ios: { ...RecordingPresets.HIGH_QUALITY.ios, audioSource: "unprocessed" as RecordingSource },
    }),
    []
  )
  const audioRecorder = useAudioRecorder(recorderConfig)
  const recorderState = useAudioRecorderState(audioRecorder, 100)

  const noteInputRef = useRef<TextInput | null>(null)
  const scrollRef = useRef<ScrollView | null>(null)
  const hasStartedRef = useRef(false)
  const hasStoppedRef = useRef(false)
  const latestMeteringRef = useRef<number | undefined>(undefined)
  const smoothedMeteringRef = useRef<number>(-60)

  const fullMeteringRef = useRef<number[]>([])
  const nextSampleIdRef = useRef(1)
  const startedAtRef = useRef<Date | null>(null)

  function setAudioModeForRecording() {
    return setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
      shouldPlayInBackground: true,
      allowsBackgroundRecording: true,
      interruptionMode: "doNotMix",
    })
  }

  function setAudioModeForNotRecording() {
    return setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      shouldPlayInBackground: false,
      allowsBackgroundRecording: false,
      interruptionMode: "mixWithOthers",
    })
  }

  function pad(number: number) {
    return number < 10 ? `0${number}` : `${number}`
  }

  function formatShortTime(ms: number) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000))
    const seconds = totalSeconds % 60
    const minutes = Math.floor(totalSeconds / 60)
    return `${pad(minutes)}:${pad(seconds)}`
  }

  const title =
    coacheeName?.trim().length && mode === "conversation"
      ? `Gesprek met ${coacheeName}`
      : coacheeName?.trim().length && mode === "spoken_report"
      ? `Gesprek met ${coacheeName}`
      : "Naamloze opname"

  const dateText = useMemo(() => {
    const startedAt = startedAtRef.current ?? new Date()
    return `${pad(startedAt.getDate())}/${pad(startedAt.getMonth() + 1)}/${String(startedAt.getFullYear()).slice(
      2
    )} - ${pad(startedAt.getHours())}:${pad(startedAt.getMinutes())}`
  }, [pad])

  // ---------- START / STOP RECORDING ----------
  useEffect(() => {
    let isCancelled = false
    const startRecording = async () => {
      if (!isFocused || hasStartedRef.current) return
      hasStoppedRef.current = false
      try {
        const permissionResponse = await requestRecordingPermissionsAsync()
        if (!permissionResponse.granted || isCancelled) return

        await setAudioModeForRecording()
        await audioRecorder.prepareToRecordAsync()
        if (!isCancelled) {
          audioRecorder.record()
          hasStartedRef.current = true
          startedAtRef.current = startedAtRef.current ?? new Date()
        }
      } catch {
        logger.warn("RecordingScreen:start_recording:error")
      }
    }
    startRecording()

    return () => {
      isCancelled = true
      if (hasStartedRef.current && !hasStoppedRef.current) {
        hasStoppedRef.current = true
        Promise.resolve()
          .then(() => audioRecorder.stop())
          .catch(() => {})
      }
      Promise.resolve()
        .then(() => setAudioModeForNotRecording())
        .catch(() => {})
      hasStartedRef.current = false
    }
  }, [isFocused])

  // ---------- READ METERING FROM RECORDER ----------
  useEffect(() => {
    if (typeof recorderState.metering === "number") {
      latestMeteringRef.current = recorderState.metering as number
    }
  }, [recorderState.metering])

  // ---------- TIMER & METERING SAMPLES ----------
  useEffect(() => {
    if (isRecordingPaused) return

    const id = setInterval(() => {
      let sample = latestMeteringRef.current
      if (typeof sample !== "number") return

      if (!Number.isFinite(sample)) {
        sample = smoothedMeteringRef.current
      }
      if (sample < -120) {
        sample = smoothedMeteringRef.current
      }

      const alpha = 0.35
      smoothedMeteringRef.current = smoothedMeteringRef.current + alpha * (sample - smoothedMeteringRef.current)
      const sampleDb = smoothedMeteringRef.current

      fullMeteringRef.current.push(sampleDb)

      if (!shouldShowAudioBars) return

      setVisibleMetering((prev) => {
        const nextLength = prev.length + 1
        const nextSample = { id: nextSampleIdRef.current++, value: sampleDb }
        if (nextLength <= MAX_VISIBLE_BARS) {
          return [...prev, nextSample]
        }
        const sliced = prev.slice(1)
        sliced.push(nextSample)
        return sliced
      })
    }, 100)

    return () => clearInterval(id)
  }, [isRecordingPaused, shouldShowAudioBars])

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      logger.debug("RecordingScreen:app_state_change", {
        state,
        isRecording: recorderState.isRecording,
      })
    })
    return () => subscription.remove()
  }, [recorderState.durationMillis, recorderState.isRecording])

  // ---------- AUTO SCROLL ----------
  useEffect(() => {
    if (shouldShowAudioBars && !isRecordingPaused) {
      scrollRef.current?.scrollToEnd({ animated: false })
    }
  }, [visibleMetering, isRecordingPaused, shouldShowAudioBars])

  // ---------- TIME DISPLAY ----------
  const formattedTimeText = useMemo(() => {
    const elapsedDeciSecondsFromRecorder = Math.max(0, Math.floor((recorderState.durationMillis ?? 0) / 100))
    const deciseconds = elapsedDeciSecondsFromRecorder % 10
    const totalSeconds = Math.floor(elapsedDeciSecondsFromRecorder / 10)
    const seconds = totalSeconds % 60
    const totalMinutes = Math.floor(totalSeconds / 60)
    const minutes = totalMinutes % 60
    const hours = Math.floor(totalMinutes / 60)

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(deciseconds)}`
  }, [pad, recorderState.durationMillis])

  function addNoteWithText(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    const now = Date.now()
    const recordingMs = Math.max(0, recorderState.durationMillis ?? 0)
    const nextNote: RecordingNote = {
      id: `${now}-${Math.random().toString(36).slice(2, 6)}`,
      date: now,
      text: trimmed,
      recordingMs,
    }
    setNotes((prev) => [nextNote, ...prev])
    setNoteDraft("")
    Keyboard.dismiss()
  }

  // ---------- BUTTON HANDLERS ----------
  function handleCloseButtonPress() {
    vibrate()
    setIsCloseConfirmationVisible(true)
  }

  async function handleStopButtonPress() {
    vibrate()

    let sourceUri: string | undefined

    try {
      if (hasStartedRef.current && !hasStoppedRef.current) {
        hasStoppedRef.current = true
        await audioRecorder.stop()
      }
      sourceUri = audioRecorder.uri ?? undefined
    } catch (error) {
      const message = String((error as any)?.message ?? error)
      if (!message.includes("already released")) {
        logger.warn("RecordingScreen:stop_recording:error")
      }
    }

    try {
      await setAudioModeForNotRecording()
    } catch {
      logger.warn("RecordingScreen:reset_audio_mode:error")
    }

    navigation.navigate("TranscriptionDetails", {
      coacheeName,
      sessionType: mode,
      sourceUri,
      metering: fullMeteringRef.current,
      title,
      notes,
    })
  }

  useEffect(() => {
    if (!isFocused || isRecordingPaused) return
    if (!hasStartedRef.current || hasStoppedRef.current) return
    if ((recorderState.durationMillis ?? 0) < MAX_RECORDING_DURATION_MILLISECONDS) return
    void handleStopButtonPress()
  }, [isFocused, isRecordingPaused, recorderState.durationMillis])

  function handleTogglePauseButtonPress() {
    vibrate()
    if (hasStoppedRef.current || !hasStartedRef.current) return
    setIsRecordingPaused((prev) => {
      const next = !prev
      try {
        if (!next) {
          audioRecorder.record()
        } else {
          audioRecorder.pause()
        }
      } catch {
        logger.warn("RecordingScreen:toggle_record_pause:error")
      }
      return next
    })
  }

  const horizontalInset = Math.max(spacing.big, 24)
  const modalWidth = Math.min(window.width - horizontalInset * 2, 1120)
  const modalHeight = Math.min(window.height - 56, FIGMA_PANEL_HEIGHT)
  const figmaTotalWidth = FIGMA_LEFT_PANEL_WIDTH + FIGMA_RIGHT_PANEL_WIDTH + FIGMA_PANEL_GAP
  const scale = Math.min(1, modalWidth / figmaTotalWidth)
  const leftPanelWidth = FIGMA_LEFT_PANEL_WIDTH * scale
  const rightPanelWidth = FIGMA_RIGHT_PANEL_WIDTH * scale
  const panelsGap = FIGMA_PANEL_GAP * scale

  return (
    <View style={styles.root}>
      <Pressable style={styles.modalBackdrop} onPress={handleCloseButtonPress} />
      <View style={[styles.modalContainer, { width: modalWidth, height: modalHeight }]}>
        <View style={[styles.recordingPanel, { width: leftPanelWidth }]}>
          <View style={styles.panelHeader}>
            <View style={styles.headerIdentityRow}>
              <View style={styles.headerAvatar} />
              <View>
                <Text style={styles.panelTitle} numberOfLines={1}>{coacheeName?.trim() || "Naamloze opname"}</Text>
                <Text style={styles.panelSubtitle}>Sessie #9</Text>
              </View>
            </View>
            <Pressable accessibilityRole="button" onPress={handleCloseButtonPress} style={styles.moreButton}>
              <Icon name="more" color={colors.textPrimary} size={18} />
            </Pressable>
          </View>

          <View style={styles.waveContainer}>
            {shouldShowAudioBars ? (
              <ScrollView
                style={styles.audioScroll}
                ref={scrollRef}
                horizontal
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.audioContentContainer}
              >
                <View style={[styles.audioBarContainer, styles.audioBarEnd]}>
                  {visibleMetering.map((item) => (
                    <MemoizedAudioBar key={item.id} value={item.value} />
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.waveBarsRow}>
                {FIGMA_WAVE_BARS.map((height, index) => (
                  <View key={`figma-wave-${index}`} style={[styles.waveBar, { height }]} />
                ))}
              </View>
            )}
          </View>

          <View style={styles.controlsWrap}>
            <Text style={styles.timer}>{formattedTimeText}</Text>
            <View style={styles.controlsRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  vibrate()
                  if (noteDraft.trim()) {
                    addNoteWithText(noteDraft)
                  } else {
                    noteInputRef.current?.focus()
                  }
                }}
                style={({ pressed }) => [styles.smallButton, pressed && styles.smallButtonPressed]}
              >
                <View style={styles.rotatedPlusIcon}>
                  <Icon name="plus" color={colors.orange} size={34} />
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={handleStopButtonPress}
                style={({ pressed }) => [styles.bigButton, pressed && styles.bigButtonPressed]}
              >
                <Icon name="stop" color={colors.white} size={48} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={handleTogglePauseButtonPress}
                style={({ pressed }) => [styles.smallButton, pressed && styles.smallButtonPressed]}
              >
                {isRecordingPaused ? (
                  <Icon name="play" color={colors.orange} size={20} />
                ) : (
                  <Icon name="pause" color={colors.orange} size={22} />
                )}
              </Pressable>
            </View>
          </View>
        </View>

        <View style={[styles.notesPanel, { width: rightPanelWidth, marginLeft: panelsGap }]}>
          <View style={styles.notesHeader}>
            <Text style={styles.notesTitle}>Notities</Text>
          </View>

          <ScrollView
            style={styles.notesScroll}
            contentContainerStyle={styles.notesScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {notes.map((note) => (
              <View key={note.id} style={styles.noteCard}>
                <View style={styles.noteTimeChip}>
                  <Text style={styles.noteTime}>{formatShortTime(note.recordingMs)}</Text>
                </View>
                <Text style={styles.noteText}>{note.text}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.noteComposerRow, { paddingBottom: 12 + safeAreaBottom / 2 }]}>
            <TextInput
              ref={noteInputRef}
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder=""
              placeholderTextColor={colors.textSecondary}
              style={styles.noteInput}
              multiline
              maxLength={500}
            />
            <Pressable
              accessibilityRole="button"
              disabled={!noteDraft.trim()}
              onPress={() => {
                vibrate()
                addNoteWithText(noteDraft)
              }}
              style={({ pressed }) => [styles.sendButton, !noteDraft.trim() && styles.sendButtonDisabled, pressed && styles.sendButtonPressed]}
            >
              <Icon name="send" color={colors.white} size={16} />
            </Pressable>
          </View>
        </View>
      </View>

      <Modal
        transparent
        visible={isCloseConfirmationVisible}
        animationType="fade"
        onRequestClose={() => setIsCloseConfirmationVisible(false)}
      >
        <Pressable style={styles.confirmationOverlay} onPress={() => setIsCloseConfirmationVisible(false)}>
          <Pressable style={styles.confirmationCard} onPress={() => {}}>
            <View style={styles.confirmationContent}>
              <Text style={styles.confirmationTitle}>Opname sluiten?</Text>
              <Text style={styles.confirmationMessage}>
                Weet je zeker dat je de opname wilt sluiten? De opname wordt niet opgeslagen.
              </Text>
            </View>
            <View style={styles.confirmationActions}>
              <Pressable
                onPress={() => {
                  vibrate()
                  setIsCloseConfirmationVisible(false)
                }}
                style={({ pressed }) => [styles.confirmationButton, pressed && styles.confirmationButtonPressed]}
              >
                {({ pressed }) => (
                  <>
                    {pressed && <View style={styles.confirmationButtonOverlay} />}
                    <Text style={styles.confirmationCancel}>Annuleren</Text>
                  </>
                )}
              </Pressable>
              <View style={styles.confirmationDivider} />
              <Pressable
                onPress={() => {
                  vibrate()
                  setIsCloseConfirmationVisible(false)
                  navigation.goBack()
                }}
                style={({ pressed }) => [styles.confirmationButton, pressed && styles.confirmationButtonPressed]}
              >
                {({ pressed }) => (
                  <>
                    {pressed && <View style={styles.confirmationButtonOverlay} />}
                    <Text style={styles.confirmationConfirm}>Sluiten</Text>
                  </>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(29,10,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.big,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "center",
  },
  recordingPanel: {
    backgroundColor: colors.white,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: "#DFE0E2",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    overflow: "hidden",
  },
  panelHeader: {
    height: 88,
    borderBottomWidth: 1,
    borderBottomColor: "#DFE0E2",
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIdentityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8D5DD",
    marginRight: 12,
  },
  panelTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  panelSubtitle: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: "#93858D",
    marginTop: 2,
  },
  moreButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  waveContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 42,
  },
  waveBarsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 160,
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: "#E5B4D5",
  },
  controlsWrap: {
    alignItems: "center",
    paddingBottom: 42,
  },
  timer: {
    fontFamily: typography.fontFamily,
    fontSize: 48,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: 260,
  },
  smallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4D5E8",
  },
  rotatedPlusIcon: {
    transform: [{ rotate: "-45deg" }],
  },
  smallButtonPressed: {
    opacity: 0.85,
  },
  bigButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orange,
  },
  bigButtonPressed: {
    opacity: 0.88,
  },
  notesPanel: {
    backgroundColor: colors.white,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: "#DFE0E2",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    overflow: "hidden",
  },
  notesHeader: {
    height: 88,
    justifyContent: "center",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#DFE0E2",
  },
  notesTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 24,
    lineHeight: 34,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  notesScroll: {
    flex: 1,
  },
  notesScrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  noteCard: {
    borderWidth: 1,
    borderColor: "#DFE0E2",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: "#F9FAFB",
  },
  noteTimeChip: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#EDF6FF",
    marginBottom: 8,
  },
  noteTime: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    lineHeight: 16,
    color: "#0065F4",
    fontWeight: "700",
  },
  noteText: {
    fontFamily: typography.fontFamily,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  noteComposerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  noteInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: "#DFE0E2",
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: 16,
    textAlignVertical: "center",
    marginRight: 10,
  },
  sendButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  sendButtonPressed: {
    opacity: 0.85,
  },
  audioScroll: {
    width: "100%",
  },
  audioContentContainer: {
    flexGrow: 1,
  },
  audioBarContainer: {
    width: "100%",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  audioBarEnd: {
    justifyContent: "flex-end",
    flexGrow: 1,
    minWidth: "100%",
  },
  audioBar: {
    width: 10,
    borderRadius: 20,
    backgroundColor: colors.orange,
    marginLeft: 2,
  },
  confirmationOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.big,
  },
  confirmationCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius,
    padding: 0,
    overflow: "hidden",
  },
  confirmationContent: { padding: spacing.big },
  confirmationTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  confirmationMessage: {
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    color: colors.textSecondary,
  },
  confirmationActions: {
    marginTop: spacing.big,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.textSecondary + "22",
  },
  confirmationButton: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  confirmationButtonPressed: {},
  confirmationButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.pressedOverlay,
  },
  confirmationDivider: {
    width: StyleSheet.hairlineWidth,
    height: 44,
    backgroundColor: colors.textSecondary + "22",
  },
  confirmationCancel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    color: colors.textSecondary,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  confirmationConfirm: {
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    color: colors.textOrange,
    fontWeight: "700",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
})
