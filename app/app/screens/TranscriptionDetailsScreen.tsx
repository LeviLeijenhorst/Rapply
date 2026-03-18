import React, { useEffect, useRef, useState } from "react"
import { View, StyleSheet, Pressable, Keyboard, Modal, KeyboardAvoidingView, Platform, InteractionManager, ActivityIndicator } from "react-native"
import { Text } from "./Text"
import { Input } from "./Input"
import { colors, spacing, typography, radius, safeAreaTop, vibrate } from "./constants"
import { Icon } from "./Icon"
import BackButton from "./BackButton"
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native"
import { writeEncryptedFile, writePlainTextFile, listFiles } from "./EncryptedStorage"
import { createAudioPlayer, setAudioModeAsync } from "expo-audio"
import { Directory, Paths } from "expo-file-system"
import { startTranscription, writeTranscriptionStatus } from "@/services/transcription"
import { Alert } from "react-native"
import { logger } from "@/utils/logger"
import { postToSecureApi } from "@/services/secureApi"
import { getBillingStatus } from "@/services/billing"

export default function TranscriptionDetailsScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const [title, setTitle] = useState(route?.params?.title ?? "")
  const [coachees, setCoachees] = useState<string[]>([])
  const [selectedCoachee, setSelectedCoachee] = useState<string | undefined>(route?.params?.coacheeName)
  const [coacheeDropdownIsExpanded, setCoacheeDropdownIsExpanded] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [newCoachee, setNewCoachee] = useState("")
  const addCoacheeInputRef = useRef<any>(null)

  const [showLeaveWarning, setShowLeaveWarning] = useState(false)
  const initialRecordingType: "spoken_report" | "audio" =
    route?.params?.sessionType === "spoken_report" ? "spoken_report" : "audio"
  const [recordingType, setRecordingType] = useState<"spoken_report" | "audio">(initialRecordingType)
  const [titleEdited, setTitleEdited] = useState(!!((route?.params?.title ?? "").trim().length))
  const [transcriptionAndSummaryIsEnabled, setTranscriptionAndSummaryIsEnabled] = useState(true)
  const [billingRemainingSeconds, setBillingRemainingSeconds] = useState<number | null | undefined>(undefined)
  const [estimatedDurationSeconds, setEstimatedDurationSeconds] = useState<number | null | undefined>(undefined)

  const existingRecordingIdParam: string | undefined = route?.params?.recordingId as string | undefined
  const sourceUriParam: string | undefined = typeof route?.params?.sourceUri === "string" ? (route?.params?.sourceUri as string) : undefined
  const hasSourceUriParam: boolean = typeof sourceUriParam === "string" && sourceUriParam.length > 0
  const isEditingExisting = !!existingRecordingIdParam && !hasSourceUriParam

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    if (showAddModal) {
      timeoutId = setTimeout(() => addCoacheeInputRef.current?.focus(), 180)
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [showAddModal])

  async function refreshCoachees() {
    try {
      const names = await listFiles("coachees")
      setCoachees(Array.isArray(names) ? names : [])
    } catch {
      setCoachees([])
    }
  }

  useEffect(() => {
    if (isEditingExisting) return
    const subscription = navigation.addListener("beforeRemove", (event: any) => {
      if (event?.data?.action?.type === "RESET") return
      event.preventDefault()
      setShowLeaveWarning(true)
    })
    return subscription
  }, [isEditingExisting])

  useEffect(() => {
    refreshCoachees()
  }, [])

  // Reads the available seconds from the backend and combines it with the local duration estimate to decide if transcription is possible.
  useEffect(() => {
    ;(async () => {
      try {
        const status = await getBillingStatus()
        const remainingSecondsRaw = (status as any)?.billingStatus?.remainingSeconds
        const remainingSeconds = Number.isFinite(Number(remainingSecondsRaw)) ? Math.max(0, Math.floor(Number(remainingSecondsRaw))) : 0
        setBillingRemainingSeconds(remainingSeconds)
      } catch {
        setBillingRemainingSeconds(null)
      }
    })()
  }, [])

  // Estimates the duration of the current recording for UI gating only.
  useEffect(() => {
    if (!hasSourceUriParam || isEditingExisting) return
    let cancelled = false
    setEstimatedDurationSeconds(undefined)
    ;(async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false })
        const player = createAudioPlayer({ uri: sourceUriParam as string }, { updateInterval: 250 })
        let attempts = 0
        while (!player.isLoaded && attempts < 50) {
          await new Promise((r) => setTimeout(r, 40))
          attempts += 1
        }
        const durationSeconds = typeof player.duration === "number" ? player.duration : 0
        player.remove()
        if (!cancelled) {
          if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
            setEstimatedDurationSeconds(null)
          } else {
            setEstimatedDurationSeconds(durationSeconds)
          }
        }
      } catch {
        if (!cancelled) setEstimatedDurationSeconds(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [hasSourceUriParam, isEditingExisting, sourceUriParam])

  const transcriptionIsAllowed: boolean | null = (() => {
    if (isEditingExisting) return null
    if (billingRemainingSeconds === undefined) return null
    if (billingRemainingSeconds === null) return null
    if (billingRemainingSeconds <= 0) return false
    if (estimatedDurationSeconds === undefined) return null
    if (estimatedDurationSeconds === null) return true
    const requiredSeconds = Math.max(1, Math.ceil(estimatedDurationSeconds))
    return billingRemainingSeconds >= requiredSeconds
  })()

  const eligibilityIsLoading = !isEditingExisting && (billingRemainingSeconds === undefined || (hasSourceUriParam && estimatedDurationSeconds === undefined))

  // Turns the toggle off when we know transcription is not possible.
  useEffect(() => {
    if (transcriptionIsAllowed !== false) return
    setTranscriptionAndSummaryIsEnabled(false)
  }, [transcriptionIsAllowed])

  useFocusEffect(
    React.useCallback(() => {
      refreshCoachees()
      return () => {}
    }, []),
  )

  function onBack() {
    vibrate()
    if (isEditingExisting) {
      navigation.goBack()
    } else {
      setShowLeaveWarning(true)
    }
  }

  function buildDefaultTitle(type: "spoken_report" | "audio", coacheeName?: string) {
    const name = (coacheeName || "").trim()
    if (!name) return "Naamloze opname"
    return type === "spoken_report" ? `Gesprek met ${name}` : `Gesprek met ${name}`
  }

  useEffect(() => {
    if (!titleEdited && (title || "").trim().length === 0) {
      setTitle(buildDefaultTitle(recordingType, selectedCoachee))
    }
  }, [recordingType, selectedCoachee, titleEdited, title])

  function goBack() {
    const hasCoachee = (selectedCoachee || "").trim().length > 0
    if (hasCoachee) {
      navigation.navigate("CoacheeDetail", {
        coacheeName: selectedCoachee,
      })
    } else {
      navigation.navigate("Welcome")
    }
  }

  async function onSave() {
    vibrate()
    Keyboard.dismiss()

    function slugifyId(value: string) {
      return value.trim().toLowerCase().replace(/\s+/g, "_")
    }

    const sourceUri: string | undefined = route?.params?.sourceUri
    const metering: number[] | undefined = route?.params?.metering
    const notesParam: unknown = route?.params?.notes
    const notesForRecording: Array<{ id: string; date: number; text: string; recordingMs?: number }> = Array.isArray(
      notesParam,
    )
      ? (notesParam as Array<{ id: string; date: number; text: string; recordingMs?: number }>).filter(
          (note) => note && typeof note.text === "string" && note.text.trim().length > 0,
        )
      : []
    const existingRecordingId: string | undefined = route?.params?.recordingId as string | undefined

    if (!sourceUri && existingRecordingId) {
      const oldCoacheeName: string = route?.params?.coacheeName ?? ""
      const oldCoacheeId = oldCoacheeName.trim().length ? slugifyId(oldCoacheeName) : "loose_recordings"
      const newCoacheeName = selectedCoachee ?? ""
      const newCoacheeId = newCoacheeName.trim().length ? slugifyId(newCoacheeName) : "loose_recordings"
      const oldBaseDirectory = `Rapply/coachees/${oldCoacheeId}/${existingRecordingId}`
      const newBaseDirectory = `Rapply/coachees/${newCoacheeId}/${existingRecordingId}`
      const titleToSave = (title || "").trim() || "Naamloze opname"

      try {
        if (oldBaseDirectory !== newBaseDirectory) {
          const parent = new Directory(Paths.document, `Rapply/coachees/${newCoacheeId}`)
          if (!parent.exists) {
            parent.create({ intermediates: true, idempotent: true })
          }

          const fromDir = new Directory(Paths.document, oldBaseDirectory)
          const toDir = new Directory(Paths.document, newBaseDirectory)

          logger.debug("TranscriptionDetails:move:start")

          if (!fromDir.exists) {
            throw new Error("Source directory does not exist")
          }

          if (toDir.exists) {
            toDir.delete()
          }

          fromDir.move(toDir)
          logger.debug("TranscriptionDetails:move:done")
        }
      } catch (error: any) {
        const message = String(error?.message || error)
        logger.warn("TranscriptionDetails:move:error", message)
        Alert.alert("Opslaan mislukt", "Het verplaatsen van deze opname is niet gelukt. Probeer het opnieuw.", [
          { text: "Ok" },
        ])
        return
      }

      try {
        await writeEncryptedFile(newBaseDirectory, "title.txt.enc", titleToSave, "text")
      } catch {}
      try {
        await writeEncryptedFile(newBaseDirectory, "type.txt.enc", recordingType, "text")
      } catch {}

      if (newCoacheeId === "loose_recordings") {
        navigation.navigate("Welcome", { initialList: "looseRecordings" })
      } else {
        navigation.navigate("CoacheeDetail", {
          coacheeName: selectedCoachee ?? "",
        })
      }
      return
    }

    if (!sourceUri) {
      logger.warn("TranscriptionDetails:onSave:missing_source_uri")
      return
    }

    const hasMetering = Array.isArray(metering) && metering.length > 0

    const coacheeId = selectedCoachee?.trim().length ? slugifyId(selectedCoachee!) : "loose_recordings"
    const recordingId = String(Date.now())
    const baseDirectory = `Rapply/coachees/${coacheeId}/${recordingId}`
    const audioFileName = `audio`
    const meteringJson = hasMetering ? JSON.stringify({ samples: metering }) : ""
    const titleToSave = (title || "").trim() || "Naamloze opname"

    try {
      await writeEncryptedFile(baseDirectory, "title.txt.enc", titleToSave, "text")
    } catch {}
    try {
      await writeEncryptedFile(baseDirectory, "type.txt.enc", recordingType, "text")
    } catch {}
    try {
      if (notesForRecording.length > 0) {
        await writeEncryptedFile(baseDirectory, "notes.json.enc", JSON.stringify(notesForRecording), "text")
      }
    } catch {}
    try {
      if (transcriptionAndSummaryIsEnabled) {
        await writeTranscriptionStatus(selectedCoachee, recordingId, "transcribing")
      }
    } catch (error: any) {
      logger.warn("TranscriptionDetails:status:write:error")
    }
    try {
      // Intentionally do not persist sourceUri or cached playback paths to disk.
    } catch {}

    if (coacheeId === "loose_recordings") {
      navigation.navigate("Welcome", { initialList: "looseRecordings" })
    } else {
      navigation.navigate("CoacheeDetail", {
        coacheeName: selectedCoachee ?? "",
      })
    }

    InteractionManager.runAfterInteractions(() => {
      ;(async () => {
        try {
          try {
            await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false })
            const player = createAudioPlayer({ uri: sourceUri }, { updateInterval: 250 })
            let attempts = 0
            while (!player.isLoaded && attempts < 50) {
              await new Promise((r) => setTimeout(r, 40))
              attempts += 1
            }
            const durationSeconds = typeof player.duration === "number" ? player.duration : 0
            const durationMs = durationSeconds > 0 ? Math.floor(durationSeconds * 1000) : 0
            if (durationMs > 0) {
              await writePlainTextFile(baseDirectory, "duration.txt", String(durationMs))
            }
            player.remove()
          } catch {}
          if (hasMetering) {
            await writePlainTextFile(baseDirectory, "metering.json", meteringJson)
          } else {
            try {
              // generate simple synthetic metering samples for imported files without metering
              await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false })
              const player = createAudioPlayer({ uri: sourceUri }, { updateInterval: 250 })
              let attempts = 0
              while (!player.isLoaded && attempts < 50) {
                await new Promise((r) => setTimeout(r, 40))
                attempts += 1
              }
              const durationSeconds = typeof player.duration === "number" ? player.duration : 0
              const durationMs = durationSeconds > 0 ? Math.floor(durationSeconds * 1000) : 120000
              player.remove()
              const totalSamples = 400
              let seed = Number(recordingId) || Date.now()
              function rand() {
                seed = (seed * 1664525 + 1013904223) % 4294967296
                return (seed >>> 0) / 4294967296
              }
              const samples: number[] = []
              for (let i = 0; i < totalSamples; i++) {
                const t = i / totalSamples
                const s1 = Math.sin(Math.PI * 2 * t)
                const s2 = Math.sin(Math.PI * 6 * t + 0.3)
                const noise = (rand() - 0.5) * 0.3
                const amp = Math.max(0, Math.min(1, 0.6 * Math.abs(s1) + 0.4 * Math.abs(s2) + noise))
                const db = -60 + amp * 60
                samples.push(db)
              }
              const gen = JSON.stringify({ samples })
              await writePlainTextFile(baseDirectory, "metering.json", gen)
            } catch {}
          }
          ;(async () => {
            try {
              await writeEncryptedFile(baseDirectory, audioFileName, sourceUri, "audio")
            } catch (err) {
              logger.warn("TranscriptionDetails:write_encrypted:error")
            }
            if (transcriptionAndSummaryIsEnabled) {
              try {
                logger.debug("TranscriptionDetails:startTranscription:calling")
                await startTranscription({
                  coacheeName: selectedCoachee,
                  recordingId,
                  sourceUri,
                })
                logger.debug("TranscriptionDetails:startTranscription:completed")
              } catch (err) {
                const message = typeof (err as any)?.message === "string" ? (err as any).message : ""
                logger.warn("TranscriptionDetails:startTranscription:failed", { message })
              }
            }
          })()
        } catch (error) {
          logger.warn("TranscriptionDetails:save:error")
        }
      })()
    })
  }

  function onAddCoachee() {
    vibrate()
    setShowAddModal(true)
  }

  async function confirmAddCoachee() {
    const name = newCoachee.trim()
    if (!name) return
    try {
      await writeEncryptedFile("coachees", name, name, "text")
    } catch {}
    setCoachees((prev) => (prev.includes(name) ? prev : [name, ...prev]))
    setSelectedCoachee(name)
    setShowAddModal(false)
    setNewCoachee("")
    setCoacheeDropdownIsExpanded(false)
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.headerRow}>
        <BackButton onPress={onBack} />
        <Pressable
          onPress={onSave}
          accessibilityRole="button"
          disabled={eligibilityIsLoading}
          style={({ pressed }) => [
            (eligibilityIsLoading || pressed) && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.save}>Opslaan</Text>
        </Pressable>
      </View>

      {eligibilityIsLoading ? (
        <View style={[styles.card, { alignItems: "center", justifyContent: "center" }]}>
          <ActivityIndicator color={colors.orange} />
          <View style={{ height: spacing.big }} />
          <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary }}>
            Beschikbare minuten controleren…
          </Text>
        </View>
      ) : (
      <View style={styles.card}>
        <Text style={styles.label}>Type opname</Text>
        <View style={styles.toggleRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              vibrate()
              setRecordingType("spoken_report")
            }}
            style={({ pressed }) => [
              styles.toggleButton,
              recordingType === "spoken_report" && styles.toggleButtonSelected,
              pressed && { opacity: 0.95 },
            ]}
          >
            <Text style={[styles.toggleText, recordingType === "spoken_report" && styles.toggleTextSelected]}>Verslag</Text>
          </Pressable>
          <View style={{ width: spacing.small }} />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              vibrate()
              setRecordingType("audio")
            }}
            style={({ pressed }) => [
              styles.toggleButton,
              recordingType === "audio" && styles.toggleButtonSelected,
              pressed && { opacity: 0.95 },
            ]}
          >
            <Text style={[styles.toggleText, recordingType === "audio" && styles.toggleTextSelected]}>Gesprek</Text>
          </Pressable>
        </View>
        <View style={{ height: spacing.big }} />

        <Text style={styles.label}>Naam</Text>
        <Input
          value={title}
          onChangeText={(t) => {
            setTitleEdited(true)
            setTitle(t)
          }}
          placeholder="Naamloze transcriptie"
          onFocus={() => setCoacheeDropdownIsExpanded(false)}
          selectTextOnFocus={!titleEdited}
          style={{ height: 52, borderWidth: 0 }}
        />

        <View style={{ height: spacing.big }} />

        <Text style={styles.label}>Coachee</Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            vibrate()
            setCoacheeDropdownIsExpanded((v) => !v)
          }}
          style={({ pressed }) => [styles.select, pressed && { opacity: 0.95 }]}
        >
          <Text style={styles.selectText}>
            {(selectedCoachee || "").trim().length ? selectedCoachee : "Geen coachee geselecteerd"}
          </Text>
          <Icon name={coacheeDropdownIsExpanded ? "chevronUp" : "chevronDown"} color={colors.textSecondary} />
        </Pressable>

        {coacheeDropdownIsExpanded && (
          <Pressable
            style={styles.dropdownOverlay}
            onPress={() => {
              vibrate()
              setCoacheeDropdownIsExpanded(false)
            }}
          />
        )}

        {coacheeDropdownIsExpanded && (
          <>
            <View style={styles.dropdown}>
              {selectedCoachee && (
                <Pressable
                  style={styles.row}
                  onPress={() => {
                    vibrate()
                    setSelectedCoachee(undefined)
                    setCoacheeDropdownIsExpanded(false)
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.rowText}>Opslaan als losse opname</Text>
                </Pressable>
              )}
              {coachees.map((c) => (
                <Pressable
                  key={c}
                  style={styles.row}
                  onPress={() => {
                    vibrate()
                    setSelectedCoachee(c)
                    setCoacheeDropdownIsExpanded(false)
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.rowText}>{c}</Text>
                </Pressable>
              ))}
              <Pressable style={styles.row} onPress={onAddCoachee} accessibilityRole="button">
                <Text style={[styles.rowText, { color: colors.textOrange }]}>Nieuwe coachee toevoegen</Text>
                <Icon name="personAdd" color={colors.orange} />
              </Pressable>
            </View>
          </>
        )}

        {!isEditingExisting && (
          <>
            <View style={{ height: spacing.big }} />
            {/* Maak een transcriptie toggle */}
            <View style={styles.transcriptionToggleRow}>
              <Text style={[styles.label, transcriptionIsAllowed === false && { opacity: 0.6 }]}>Maak een transcriptie</Text>
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: transcriptionAndSummaryIsEnabled, disabled: transcriptionIsAllowed === false }}
                onPress={() => {
                  if (transcriptionIsAllowed === false) return
                  vibrate()
                  setTranscriptionAndSummaryIsEnabled((value) => !value)
                }}
                style={({ pressed }) => [
                  styles.transcriptionToggleTrack,
                  transcriptionAndSummaryIsEnabled ? styles.transcriptionToggleTrackOn : styles.transcriptionToggleTrackOff,
                  transcriptionIsAllowed === false && { opacity: 0.5 },
                  pressed && { opacity: 0.95 },
                ]}
              >
                <View style={styles.transcriptionToggleThumb} />
              </Pressable>
            </View>
            {transcriptionIsAllowed === false && (
              <>
                <View style={{ height: spacing.small }} />
                {/* Ga naar mijn abonnement knop */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    vibrate()
                    navigation.navigate("Subscription")
                  }}
                  style={({ pressed }) => [
                    {
                      height: 52,
                      borderRadius: radius,
                      backgroundColor: colors.orange,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.white, fontWeight: "700" }}>
                    Ga naar Mijn abonnement
                  </Text>
                </Pressable>
              </>
            )}
          </>
        )}
      </View>
      )}

      {/* Leave warning modal */}
      <Modal transparent visible={showLeaveWarning} animationType="fade" onRequestClose={() => setShowLeaveWarning(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowLeaveWarning(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Opname verwijderen</Text>
              <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary }}>
                Je opname wordt permanent verwijderd. Deze actie kan niet ongedaan worden gemaakt.
              </Text>
            </View>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  vibrate()
                  setShowLeaveWarning(false)
                }}
                style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.modalCancel}>Annuleren</Text>
              </Pressable>
              <View style={styles.modalDivider} />
              <Pressable
                onPress={() => {
                  vibrate()
                  setShowLeaveWarning(false)
                  goBack()
                }}
                style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.modalConfirm}>Verwijderen</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add coachee modal */}
      <Modal transparent visible={showAddModal} animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAddModal(false)} />
          <KeyboardAvoidingView
            style={styles.modalAvoid}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={spacing.big * 2}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Nieuwe coachee</Text>
                <Input
                  ref={addCoacheeInputRef}
                  value={newCoachee}
                  onChangeText={setNewCoachee}
                  placeholder="Naam coachee"
                />
              </View>
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => {
                    vibrate()
                    setShowAddModal(false)
                  }}
                  style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.modalCancel}>Annuleren</Text>
                </Pressable>
                <View style={styles.modalDivider} />
                <Pressable
                  onPress={() => {
                    vibrate()
                    confirmAddCoachee()
                  }}
                  style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.modalConfirm}>Opslaan</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
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
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.big,
  },
  save: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textOrange, fontWeight: "700" },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius,
    borderTopRightRadius: radius,
    padding: spacing.big,
  },
  label: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary, marginBottom: spacing.small },
  toggleRow: { flexDirection: "row" },
  toggleButton: {
    height: 52,
    borderRadius: radius,
    backgroundColor: colors.orange + "0D",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonSelected: { backgroundColor: colors.orange },
  toggleText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary },
  toggleTextSelected: { color: colors.white, fontWeight: "700" },
  transcriptionToggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  transcriptionToggleTrack: {
    width: 56,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: "center",
  },
  transcriptionToggleTrackOn: { backgroundColor: colors.orange, alignItems: "flex-end" },
  transcriptionToggleTrackOff: { backgroundColor: colors.textSecondary + "33", alignItems: "flex-start" },
  transcriptionToggleThumb: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.white },
  select: {
    height: 52,
    paddingHorizontal: spacing.big,
    borderRadius: radius,
    backgroundColor: colors.orange + "0D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary },
  dropdown: {
    marginTop: spacing.small,
    borderRadius: radius,
    overflow: "hidden",
    backgroundColor: colors.orange + "0D",
    zIndex: 2,
  },
  dropdownOverlay: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, zIndex: 1 },
  row: {
    height: 48,
    paddingHorizontal: spacing.big,
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.textSecondary + "22",
  },
  rowText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.big,
  },
  modalBackdrop: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius,
    padding: 0,
    overflow: "hidden",
  },
  modalAvoid: { flex: 1, alignItems: "center", justifyContent: "center", width: "100%", padding: spacing.big },
  modalContent: { padding: spacing.big },
  modalTitle: { fontFamily: typography.fontFamily, fontSize: 18, color: colors.textPrimary, marginBottom: spacing.small },
  modalActions: {
    marginTop: spacing.big,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.textSecondary + "22",
  },
  modalBtn: { flex: 1, height: 48, alignItems: "center", justifyContent: "center" },
  modalDivider: { width: StyleSheet.hairlineWidth, height: 48, backgroundColor: colors.textSecondary + "22" },
  modalCancel: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary },
  modalConfirm: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textOrange, fontWeight: "700" },
})
