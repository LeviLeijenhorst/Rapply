import React, { useEffect, useMemo, useState, useRef } from "react"
import { View, StyleSheet, Pressable, Modal, ScrollView, AppState } from "react-native"
import { Text } from "./Text"
import { colors, spacing, typography, safeAreaTop, safeAreaBottom, vibrate, radius } from "./constants"
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

  type MeterSample = { id: number; value: number }
  const [visibleMetering, setVisibleMetering] = useState<MeterSample[]>([])

  const isFocused = useIsFocused()

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

  const lastRenderAtRef = useRef(0)

  const scrollRef = useRef<ScrollView | null>(null)
  const hasStartedRef = useRef(false)
  const hasStoppedRef = useRef(false)
  const latestMeteringRef = useRef<number | undefined>(undefined)
  const smoothedMeteringRef = useRef<number>(-60)
  const tickCounterRef = useRef(0)

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
      } catch (error) {
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
      tickCounterRef.current += 1
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
        const sample = { id: nextSampleIdRef.current++, value: sampleDb }
        if (nextLength <= MAX_VISIBLE_BARS) {
          return [...prev, sample]
        }
        const sliced = prev.slice(1)
        sliced.push(sample)
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
    } catch (error) {
      logger.warn("RecordingScreen:reset_audio_mode:error")
    }

    const sessionType = mode

    navigation.navigate("TranscriptionDetails", {
      coacheeName,
      sessionType,
      sourceUri,
      metering: fullMeteringRef.current,
      title,
    })
  }

  useEffect(() => {
    if (!isFocused || isRecordingPaused) return
    if (!hasStartedRef.current || hasStoppedRef.current) return
    if ((recorderState.durationMillis ?? 0) < MAX_RECORDING_DURATION_MILLISECONDS) return
    void handleStopButtonPress()
  }, [handleStopButtonPress, isFocused, isRecordingPaused, recorderState.durationMillis])

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
      } catch (error) {
        logger.warn("RecordingScreen:toggle_record_pause:error")
      }
      return next
    })
  }

  return (
    <View style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{dateText}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={handleCloseButtonPress}>
          <Icon name="closeCircle" />
        </Pressable>
      </View>

      {/* CENTER CONTENT (METERING BARS OVER TIME) */}
      <View style={styles.timerCenterWrap}>
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
        ) : null}
      </View>

      {/* BOTTOM CARD */}
      <View style={styles.bottomCard}>
        <Text style={styles.timer}>{formattedTimeText}</Text>
        <View style={styles.controlsRow}>
          <Pressable accessibilityRole="button" onPress={handleCloseButtonPress} style={({ pressed }) => [styles.smallButton, pressed && styles.smallButtonPressed]}>
            <Icon name="close" color={colors.orange} size={40} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={handleStopButtonPress} style={({ pressed }) => [styles.bigButton, pressed && styles.bigButtonPressed]}>
            <Icon name="stop" color={colors.white} size={48} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={handleTogglePauseButtonPress} style={({ pressed }) => [styles.smallButton, pressed && styles.smallButtonPressed]}>
            {isRecordingPaused ? (
              <Icon name="play" color={colors.orange} size={18} />
            ) : (
              <Icon name="pause" color={colors.orange} size={22} />
            )}
          </Pressable>
        </View>
      </View>

      {/* CLOSE CONFIRMATION MODAL */}
      <Modal
        transparent
        visible={isCloseConfirmationVisible}
        animationType="fade"
        onRequestClose={() => setIsCloseConfirmationVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsCloseConfirmationVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Opname sluiten?</Text>
              <Text style={styles.modalMessage}>
                Weet je zeker dat je de opname wilt sluiten? De opname wordt niet opgeslagen.
              </Text>
            </View>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  vibrate()
                  setIsCloseConfirmationVisible(false)
                }}
                style={({ pressed }) => [
                  styles.modalButton,
                  pressed && styles.modalButtonPressed,
                ]}
              >
                {({ pressed }) => (
                  <>
                    {pressed && <View style={styles.modalButtonOverlay} />}
                    <Text style={styles.modalCancel}>Annuleren</Text>
                  </>
                )}
              </Pressable>
              <View style={styles.modalDivider} />
              <Pressable
                onPress={() => {
                  vibrate()
                  setIsCloseConfirmationVisible(false)
                  navigation.goBack()
                }}
                style={({ pressed }) => [
                  styles.modalButton,
                  pressed && styles.modalButtonPressed,
                ]}
              >
                {({ pressed }) => (
                  <>
                    {pressed && <View style={styles.modalButtonOverlay} />}
                    <Text style={styles.modalConfirm}>Sluiten</Text>
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
  safeArea: { flex: 1, backgroundColor: colors.backgroundLight, paddingTop: safeAreaTop },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.big,
    paddingTop: spacing.small,
  },
  title: { fontFamily: typography.fontFamily, fontSize: 22, color: colors.textPrimary },
  subtitle: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary, marginTop: 2 },

  timerCenterWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    justifyContent: 'flex-end',
  },

  audioBarStart: {
    justifyContent: "flex-start",
    flexGrow: 1,
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

  bottomCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius,
    borderTopRightRadius: radius,
    paddingTop: spacing.big,
    paddingBottom: 12 + safeAreaBottom,
    alignItems: "center",
  },
  timer: {
    fontFamily: typography.monospaceFontFamily,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: "center",
  },

  controlsRow: {
    marginTop: spacing.small,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: 240,
  },
  smallButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orange + "0D",
  },
  smallButtonPressed: {
    backgroundColor: colors.orange + "20",
  },
  bigButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orange,
  },
  bigButtonPressed: {
    backgroundColor: colors.orange + "E6",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.big,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius,
    padding: 0,
    overflow: "hidden",
  },
  modalContent: { padding: spacing.big },
  modalTitle: { fontFamily: typography.fontFamily, fontSize: 18, color: colors.textPrimary, marginBottom: spacing.small },
  modalMessage: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary },
  modalActions: {
    marginTop: spacing.big,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.textSecondary + "22",
  },
  modalButton: { flex: 1, height: 44, alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" },
  modalButtonPressed: {},
  modalButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.pressedOverlay,
  },
  modalDivider: { width: StyleSheet.hairlineWidth, height: 44, backgroundColor: colors.textSecondary + "22" },
  modalCancel: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary, includeFontPadding: false, textAlignVertical: "center" },
  modalConfirm: {
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    color: colors.textOrange,
    fontWeight: "700",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
})
