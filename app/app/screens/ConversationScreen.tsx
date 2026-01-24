import React, { useEffect, useMemo, useRef, useState } from "react"
import { View, StyleSheet, Pressable, ScrollView, TextInput, Keyboard, TouchableWithoutFeedback, ActivityIndicator, Platform, Animated as RNAnimated, Dimensions, InteractionManager, FlatList } from "react-native"
import { Text } from "./Text"
import { Tab } from "./Tab"
import { colors, radius, safeAreaBottom, safeAreaTop, spacing, typography, vibrate } from "./constants"
import { Icon } from "./Icon"
import BackButton from "./BackButton"
import { readEncryptedFile, listFiles, readPlainTextFile, writePlainTextFile, writeEncryptedFile } from "./EncryptedStorage"
import { createAudioPlayer, setAudioModeAsync } from "expo-audio"
import * as FileSystem from "expo-file-system"
import { deleteDecryptedAudioCacheFile, ensureDecryptedFile, isSegmentedAudioDecryptionAvailable } from "../services/audioCache"
import { Directory, Paths, File } from "expo-file-system"
import { encryptToSegmentedWithKey, segmentInfo } from "expo-segmented-audio"
import { registerToken as playerRegisterToken, load as playerLoad, play as playerPlay, pause as playerPause, seekTo as playerSeekTo, unload as playerUnload, addListener as addPlayerListener } from "@/services/csAudioPlayer"
import { getOrCreateLocalEncryptionKey } from "@/services/encryptionKey"
const LinearGradientMaybe = (() => {
  try {
    return require("expo-linear-gradient").LinearGradient
  } catch {
    return null
    return null
    return null
  }
})()

import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from "react-native-reanimated"

import { ensureSummaryExists, readTranscriptionStatus, startTranscription, transcriptFileExists } from "@/services/transcription"
import { AskAiChat } from "./AskAiChat"
import { logger } from "@/utils/logger"
import { postToSecureApi } from "@/services/secureApi"
import { getBillingStatus, invalidateBillingStatusCache, prefetchBillingStatus } from "@/services/billing"
import { isLikelyNoConnectionError } from "@/utils/networkErrors"

import { useNavigation, useRoute } from "@react-navigation/native"
type Note = { id: string; date: number; text: string } //Note: There is only one type declared here. This makes it seems a little messy. I think it's better if all types are declared in one place.

const WaveBar = React.memo(function WaveBar({
  height,
  barIndex,
  totalBars,
  durationSv,
  playedMsSv,
}: {
  height: number
  barIndex: number
  totalBars: number
  durationSv: any
  playedMsSv: any
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const totalDurationMs = durationSv.value || 0
    const playedMs = playedMsSv.value || 0
    const timeAtBar = (barIndex / Math.max(1, totalBars)) * totalDurationMs
    return {
      backgroundColor: playedMs > timeAtBar ? colors.orange : colors.textSecondary + "55",
    }
  }, [])
  return <Animated.View style={[styles.bar, { height }, animatedStyle]} />
})

export default function ConversationScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const titleFromRoute: string | undefined = route?.params?.title
  const coacheeName: string = route?.params?.coacheeName || ""
  const conversationId: string | undefined = route?.params?.conversationId
  const sessionType: string = route?.params?.sessionType
  const isFullConversation = true
  const isAudioRecording = sessionType === "audio" || sessionType === "spoken_report"
  const isReport = sessionType === "written_report" || sessionType === "spoken_report"
  const showTranscriptTab = sessionType === "audio"
  const showAskAiTab = sessionType === "audio"

  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showDeleteWarning, setShowDeleteWarning] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playerPosition, setPlayerPosition] = useState(0)
  const playerPositionRef = useRef(0)
  const [duration, setDuration] = useState<number | null>(null)
  const [barHeights, setBarHeights] = useState<number[]>([])
  const [barsReady, setBarsReady] = useState(false)
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)
  const [isSummaryGenerating, setIsSummaryGenerating] = useState(false)
  const [summaryUiInitializing, setSummaryUiInitializing] = useState(true)
  const [hasCheckedSummary, setHasCheckedSummary] = useState(false)
  const [hasTranscript, setHasTranscript] = useState(false)
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false)
  const [hasCheckedTranscriptAvailability, setHasCheckedTranscriptAvailability] = useState(false)
  const [isTranscriptParsing, setIsTranscriptParsing] = useState(false)

  const [activeTab, setActiveTab] = useState<"summary" | "transcript" | "askai" | "notes">("summary")
  const [uiActiveTab, setUiActiveTab] = useState<"summary" | "transcript" | "askai" | "notes">("summary")
  const [editMode, setEditMode] = useState(false)
  const [summary, setSummary] = useState("")
  const [savedSummary, setSavedSummary] = useState("")
  const [isSavingSummary, setIsSavingSummary] = useState(false)
  const [showUnsavedSummaryWarning, setShowUnsavedSummaryWarning] = useState(false)
  const pendingLeaveActionRef = useRef<any | null>(null)
  const [headerTitle, setHeaderTitle] = useState(titleFromRoute || "")
  const [notes, setNotes] = useState<Note[]>([])
  const [addingNote, setAddingNote] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")
  const [notesSelectMode, setNotesSelectMode] = useState(false)
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([])
  const [showDeleteNotesWarning, setShowDeleteNotesWarning] = useState(false)
  const previousNotesSelectionCountRef = useRef(0)
  const tabsRef = useRef<any>(null)
  const tabPositionsRef = useRef<Record<string, number>>({})
  const [transcript, setTranscript] = useState("")
  const [transcriptSegments, setTranscriptSegments] = useState<{ id: string; start: number; speaker: string; text: string }[]>([])
  const [transcriptSearchText, setTranscriptSearchText] = useState("")
  const [transcriptSearchFocused, setTranscriptSearchFocused] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const allowLeaveRef = useRef(false)
  const backupPlayerRef = useRef<any>(null)
  const backupTickTimerRef = useRef<any>(null)
  const segmentedFileUriRef = useRef<string | null>(null)
  const decryptedFileUriRef = useRef<string | null>(null)
  const scrubbingRef = useRef(false)
  const [scrubbing, setScrubbing] = useState(false)
  const playedMsSv = useSharedValue(0)
  const waveWidthSv = useSharedValue(0)
  const durationSv = useSharedValue(0)
  const scrubLastUiUpdateAtSv = useSharedValue(0)
  const desiredIsPlayingRef = useRef(false)
  const [useNativePlayer, setUseNativePlayer] = useState(false)
  const nativeTickTimerRef = useRef<any>(null)
  const nativeTickStartWallClockRef = useRef<number>(0)
  const nativeTickStartPositionRef = useRef<number>(0)
  const nativePlayerListenerSubscriptionsRef = useRef<Array<{ remove: () => void }>>([])
  const [audioErrorMessage, setAudioErrorMessage] = useState<string | null>(null)
  const resumeTranscriptionInFlightRef = useRef(false)
  const transcriptionStartInFlightRef = useRef(false)
  const [transcriptionRemainingSeconds, setTranscriptionRemainingSeconds] = useState<number | null>(null)
  const transcriptionRemainingSecondsInFlightRef = useRef(false)
  const [transcriptionRemainingSecondsError, setTranscriptionRemainingSecondsError] = useState<"offline" | null>(null)
  const [transcriptionStartStep, setTranscriptionStartStep] = useState<string | null>(null)
  const [transcriptionRemainingSecondsReloadId, setTranscriptionRemainingSecondsReloadId] = useState(0)

  const barScale = useRef(new RNAnimated.Value(1)).current
  const summaryScrollRef = useRef<ScrollView | null>(null)
  const [isBackupPlayerLoading, setIsBackupPlayerLoading] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [isNativePlayerInitializing, setIsNativePlayerInitializing] = useState(false)
  const hasLoggedLoadedRef = useRef(false)
  const screenWidth = useRef(Dimensions.get("window").width).current
  const tabsSeq = useMemo(() => {
    const seq: Array<"summary" | "transcript" | "askai" | "notes"> = ["summary"]
    if (isFullConversation && showTranscriptTab) seq.push("transcript")
    if (isFullConversation && showAskAiTab) seq.push("askai")
    seq.push("notes")
    return seq
  }, [isFullConversation, showTranscriptTab, showAskAiTab])

  function tabIndex(t: "summary" | "transcript" | "askai" | "notes") {
    return tabsSeq.indexOf(t)
  }
  const pagerX = useRef(new RNAnimated.Value(0)).current
  const audioPlayerVisibilityAnim = useRef(new RNAnimated.Value(1)).current
  const [audioPlayerHeight, setAudioPlayerHeight] = useState(0)
  const [summaryFocused, setSummaryFocused] = useState(false)
  const [notesFocused, setNotesFocused] = useState(false)
  const newNoteInputRef = useRef<TextInput | null>(null)
  const editingNoteInputRef = useRef<TextInput | null>(null)
  const summaryInputRef = useRef<TextInput | null>(null)
  const transcriptSearchInputRef = useRef<TextInput | null>(null)
  const summaryValueRef = useRef("")
  const savedSummaryValueRef = useRef("")
  const skipAutoSaveSummaryOnBlurRef = useRef(false)
  const activeTabRef = useRef<"summary" | "transcript" | "askai" | "notes">("summary")
  const lastPosUpdateAtRef = useRef(0)
  const lastIsPlayingRef = useRef(false)
  const [isTabSwitching, setIsTabSwitching] = useState(false)
  const [pendingTab, setPendingTab] = useState<"summary" | "transcript" | "askai" | "notes" | null>(null)
  const transcriptLoadRequestIdRef = useRef(0)

  const transcriptListRef = useRef<FlatList<any> | null>(null)
  const transcriptScrolledDownRef = useRef(false)
  const [transcriptIsScrolledDown, setTranscriptIsScrolledDown] = useState(false)
  const transcriptScrollToTopOpacity = useRef(new RNAnimated.Value(0)).current

  const hasUnsavedSummaryChanges = useMemo(() => {
    return (summary || "") !== (savedSummary || "")
  }, [summary, savedSummary])

  function setSummaryValue(next: string) {
    summaryValueRef.current = next || ""
    setSummary(next)
  }

  function setPlayerPositionSafe(next: number) {
    playerPositionRef.current = next
    setPlayerPosition(next)
  }

  function getBaseDirectoryForConversation() {
    const id = (conversationId || "").trim()
    if (!id) return null
    const name = (coacheeName || "").trim()
    const coacheeId = name ? slugifyId(name) : "loose_recordings"
    return `CoachScribe/coachees/${coacheeId}/${id}`
  }

  function setSummaryAndMarkSaved(value: string) {
    const next = value || ""
    savedSummaryValueRef.current = next
    summaryValueRef.current = next
    setSavedSummary(next)
    setSummary(next)
  }

  async function saveSummary() {
    const baseDirectory = getBaseDirectoryForConversation()
    if (!baseDirectory) return
    if (isSavingSummary) return
    setIsSavingSummary(true)
    try {
      const value = summaryValueRef.current || ""
      await writeEncryptedFile(baseDirectory, "summary.txt.enc", value, "text")
      savedSummaryValueRef.current = value
      setSavedSummary(value)
    } catch (e: any) {
      logger.warn("Conversation:summary:save:error")
    } finally {
      setIsSavingSummary(false)
    }
  }

  function slugifyId(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, "_")
  }

  function clearNativePlayerListenerSubscriptions() {
    const subs = nativePlayerListenerSubscriptionsRef.current
    nativePlayerListenerSubscriptionsRef.current = []
    for (const sub of subs) {
      try {
        sub.remove()
      } catch {}
    }
  }

  function resetPlaybackState() {
    desiredIsPlayingRef.current = false
    scrubbingRef.current = false
    lastIsPlayingRef.current = false
    setScrubbing(false)
    setIsPreparing(false)
    setIsBackupPlayerLoading(false)
    setIsPlaying(false)
    setAudioErrorMessage(null)
    setIsSummaryGenerating(false)
    setPlayerPositionSafe(0)
    playedMsSv.value = 0
    clearNativePlayerListenerSubscriptions()
    if (nativeTickTimerRef.current) {
      clearInterval(nativeTickTimerRef.current)
      nativeTickTimerRef.current = null
    }
    if (backupTickTimerRef.current) {
      clearInterval(backupTickTimerRef.current)
      backupTickTimerRef.current = null
    }
    if (backupPlayerRef.current) {
      try { backupPlayerRef.current.remove() } catch {}
      backupPlayerRef.current = null
    }
    try { playerUnload().catch(() => {}) } catch {}
    const segUri = segmentedFileUriRef.current
    segmentedFileUriRef.current = null
    setUseNativePlayer(false)
  }

  function computeBarHeightsFromSamples(samples: number[], desiredBars: number) {
    if (!samples || samples.length === 0 || desiredBars <= 0) return []
    const heights: number[] = []
    const minHeight = 10
    const maxHeight = 44

    for (let i = 0; i < desiredBars; i++) {
      const start = Math.floor((i / desiredBars) * samples.length)
      const end = Math.floor(((i + 1) / desiredBars) * samples.length)
      const safeStart = Math.min(start, samples.length - 1)
      const safeEnd = Math.max(safeStart + 1, end)
      const chunk = samples.slice(safeStart, safeEnd)
      if (chunk.length === 0) {
        heights.push(minHeight)
        continue
      }
      const average = chunk.reduce((sum, v) => sum + v, 0) / chunk.length
      const adjusted = average + 15
      const clamped = Math.max(-60, Math.min(0, adjusted))
      const normalized = (clamped + 60) / 60
      const height = minHeight + normalized * (maxHeight - minHeight)
      heights.push(height)
    }

    return heights
  }

  function handleSetActiveTab(tab: "summary" | "transcript" | "askai" | "notes") {
    if (tab === activeTab && tab === uiActiveTab) return
    const to = tabIndex(tab)
    if (to < 0) return
    Keyboard.dismiss()

    if (uiActiveTab === "notes" && tab !== "notes") {
      setNotesSelectMode(false)
      setSelectedNoteIds([])
      setShowDeleteNotesWarning(false)
    }

    if (tab !== "transcript") {
      transcriptScrolledDownRef.current = false
      setTranscriptIsScrolledDown(false)
    }

    setUiActiveTab(tab)
    setPendingTab(tab)
    setIsTabSwitching(true)
    try { (pagerX as any).stopAnimation?.() } catch {}
    requestAnimationFrame(() => {
      setActiveTab(tab)
      pagerX.setValue(-to * screenWidth)
      requestAnimationFrame(() => {
        setIsTabSwitching(false)
        setPendingTab(null)
      })
    })
  }

  useEffect(() => {
    if (!isAudioRecording) return
    const id = (conversationId || "").trim()
    if (!id) return
    resetPlaybackState()
  }, [isAudioRecording, conversationId])

  useEffect(() => {
    if (sessionType !== "audio") return
    const id = (conversationId || "").trim()
    if (!id) return
    let cancelled = false
    setHasCheckedTranscriptAvailability(false)
    ;(async () => {
      try {
        const exists = await transcriptFileExists(coacheeName, id)
        if (cancelled) return
        setHasTranscript(exists)
        if (!exists) {
          try {
            const status = await readTranscriptionStatus(coacheeName, id)
            if (cancelled) return
            setIsTranscribing(status === "transcribing")
          } catch {}
        } else {
          setIsTranscribing(false)
        }
      } finally {
        if (!cancelled) setHasCheckedTranscriptAvailability(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sessionType, coacheeName, conversationId])

  useEffect(() => {
    const sub = navigation.addListener("beforeRemove", (e: any) => {
      if (e?.data?.action?.type === "RESET") return
      if (allowLeaveRef.current) return
      if (!hasUnsavedSummaryChanges) return
      e.preventDefault()
      pendingLeaveActionRef.current = e?.data?.action ?? null
      setShowUnsavedSummaryWarning(true)
    })
    return sub
  }, [navigation, hasUnsavedSummaryChanges])

  

  

  // Computes audio duration in seconds from a local file, used only for client-side gating and UI decisions.
  async function computeAudioDurationSeconds(fileUri: string): Promise<number | null> {
    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false })
      const player = createAudioPlayer({ uri: fileUri }, { updateInterval: 250 })
      let attempts = 0
      while (!player.isLoaded && attempts < 50) {
        await new Promise((r) => setTimeout(r, 40))
        attempts += 1
      }
      const durationSeconds = typeof player.duration === "number" ? player.duration : 0
      player.remove()
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return null
      return durationSeconds
    } catch {
      return null
    }
  }

  function clampNonNegativeInt(value: any): number {
    const n = typeof value === "number" ? value : Number(value)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.floor(n))
  }

  function computeRequiredSecondsFromDurationMs(durationMs: number | null): number | null {
    const ms = typeof durationMs === "number" ? durationMs : 0
    if (!Number.isFinite(ms) || ms <= 0) return null
    const seconds = ms / 1000
    return Math.max(1, Math.ceil(seconds))
  }

  function computeCanAffordTranscription(params: { remainingSeconds: number | null; durationMs: number | null }): boolean | null {
    const { remainingSeconds, durationMs } = params
    if (remainingSeconds === null) return null
    if (remainingSeconds <= 0) return false
    const requiredSeconds = computeRequiredSecondsFromDurationMs(durationMs)
    if (requiredSeconds === null) return null
    return remainingSeconds >= requiredSeconds
  }

  // Loads remaining seconds for client-side gating only.
  useEffect(() => {
    if (uiActiveTab !== "transcript") return
    if (sessionType !== "audio") return
    if (!conversationId) return
    if (hasTranscript) return
    if (transcriptionRemainingSecondsInFlightRef.current) return
    transcriptionRemainingSecondsInFlightRef.current = true
    let cancelled = false
    setTranscriptionRemainingSecondsError(null)
    ;(async () => {
      try {
        const status = await getBillingStatus()
        const remainingSeconds = clampNonNegativeInt(status?.billingStatus?.remainingSeconds ?? 0)
        if (!cancelled) {
          setTranscriptionRemainingSeconds(remainingSeconds)
          setTranscriptionRemainingSecondsError(null)
        }
      } catch (error) {
        if (!cancelled) {
          setTranscriptionRemainingSeconds(null)
          setTranscriptionRemainingSecondsError(isLikelyNoConnectionError(error) ? "offline" : null)
        }
      } finally {
        transcriptionRemainingSecondsInFlightRef.current = false
      }
    })()
    return () => {
      cancelled = true
    }
  }, [uiActiveTab, sessionType, conversationId, hasTranscript, transcriptionRemainingSecondsReloadId])

  async function startTranscriptionProcess() {
    if (sessionType !== "audio") return
    if (isTranscribing) return
    const id = (conversationId || "").trim()
    if (!id) return
    if (transcriptionStartInFlightRef.current) return
    transcriptionStartInFlightRef.current = true
    setTranscriptionStartStep("Beschikbare minuten controleren…")
    try {
      setAudioErrorMessage(null)
      let preflight: any = null
      try {
        preflight = await postToSecureApi("/transcription/preflight", {})
      } catch {
        setTranscriptionStartStep(null)
        setAudioErrorMessage("We kunnen je beschikbare minuten nu niet controleren. Probeer het opnieuw.")
        return
      }
      if (!preflight?.allowed) {
        setTranscriptionStartStep(null)
        setTranscriptionRemainingSeconds(0)
        navigation.navigate("Subscription")
        return
      }
      if (!isSegmentedAudioDecryptionAvailable()) {
        setTranscriptionStartStep(null)
        setAudioErrorMessage("Transcriptie werkt pas nadat je de app opnieuw hebt geïnstalleerd (nieuwe dev build).")
        return
      }
      setTranscriptionStartStep("Audio voorbereiden…")
      const sourceUri = await ensureDecryptedFile(
        coacheeName,
        id,
        async (dir) => await listFiles(dir),
        async (dir, fileName) => await readEncryptedFile(dir, fileName),
      )
      if (!sourceUri) {
        setTranscriptionStartStep(null)
        setAudioErrorMessage("De audio kan niet worden ontsleuteld voor transcriptie.")
        return
      }
      try {
        const remainingSeconds = clampNonNegativeInt(preflight?.remainingSeconds ?? 0)
        const durationSeconds = await computeAudioDurationSeconds(sourceUri)
        const requiredSeconds = durationSeconds ? Math.max(1, Math.ceil(durationSeconds)) : null
        if (requiredSeconds !== null && remainingSeconds > 0 && remainingSeconds < requiredSeconds) {
          setTranscriptionStartStep(null)
          setTranscriptionRemainingSeconds(remainingSeconds)
          navigation.navigate("Subscription")
          return
        }
        setTranscriptionRemainingSeconds(remainingSeconds)

        setTranscriptionStartStep("Transcriptie starten…")
        setIsTranscribing(true)
        await startTranscription({ coacheeName, recordingId: id, sourceUri })
        try {
          invalidateBillingStatusCache()
          await prefetchBillingStatus()
        } catch {}
      } catch (e: any) {
        setTranscriptionStartStep(null)
        const message = String(e?.message || "")
        if (message.includes("Mistral API key is not configured")) {
          setAudioErrorMessage("Transcriptie staat nog niet aan op je server. Voeg MISTRAL_API_KEY toe en start de server opnieuw.")
        } else if (message.toLowerCase().includes("network request failed")) {
          setAudioErrorMessage("Geen verbinding met de server. Controleer of adb reverse aan staat (54321 en 8787) en probeer het opnieuw.")
        } else {
        setAudioErrorMessage("Transcriptie is mislukt. Probeer het opnieuw.")
        }
      } finally {
        await deleteDecryptedAudioCacheFile(sourceUri)
      }

      const hasTranscriptFile = await transcriptFileExists(coacheeName, id)
      setHasTranscript(hasTranscriptFile)
      if (hasTranscriptFile) {
        const name = coacheeName.trim()
        const coacheeId = name ? slugifyId(name) : "loose_recordings"
        const baseDirectory = `CoachScribe/coachees/${coacheeId}/${id}`
        const txt = await readEncryptedFile(baseDirectory, "transcript.txt.enc")
        setTranscript(txt)
      }
    } finally {
      transcriptionStartInFlightRef.current = false
      setIsTranscribing(false)
      setTranscriptionStartStep(null)
    }
  }

  useEffect(() => {
    if (uiActiveTab !== "transcript") return
    setIsTranscriptParsing(true)
    const task = InteractionManager.runAfterInteractions(() => {
      const startedAt = Date.now()
      const lines = (transcript || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
      const rx = /^\[(\d{2}):(\d{2})\.(\d)\]\s+([^:]+):\s*(.*)$/
      const items: { id: string; start: number; speaker: string; text: string }[] = []
      for (const l of lines) {
        const m = l.match(rx)
        if (!m) continue
        const mm = parseInt(m[1], 10)
        const ss = parseInt(m[2], 10)
        const ds = parseInt(m[3], 10)
        const start = mm * 60 + ss + ds / 10
        items.push({ id: `${start}-${items.length}`, start, speaker: m[4], text: m[5] })
      }
      if (items.length > 0) {
        setTranscriptSegments(items)
        try {
          logger.debug("Conversation:transcript:parse:done", { milliseconds: Date.now() - startedAt, segments: items.length })
        } catch {}
        setIsTranscriptParsing(false)
        return
      }
      const raw = (transcript || "").trim()
      if (raw) {
        setTranscriptSegments([{ id: "0-0", start: 0, speaker: "transcript", text: raw }])
        try {
          logger.debug("Conversation:transcript:parse:done", { milliseconds: Date.now() - startedAt, segments: 1 })
        } catch {}
        setIsTranscriptParsing(false)
        return
      }
      setTranscriptSegments([])
      try {
        logger.debug("Conversation:transcript:parse:done", { milliseconds: Date.now() - startedAt, segments: 0 })
      } catch {}
      setIsTranscriptParsing(false)
    })
    return () => {
      setIsTranscriptParsing(false)
      task.cancel?.()
    }
  }, [uiActiveTab, transcript])

  

  useEffect(() => {
    const onShow = (e: any) => {
      const h = e?.endCoordinates?.height ?? 0
      const shouldAffect = summaryFocused || notesFocused
      if (shouldAffect) setKeyboardHeight(h)
    }
    const onHide = () => {
      const shouldAffect = summaryFocused || notesFocused || transcriptSearchFocused
      if (shouldAffect) setKeyboardHeight(0)
      if (Platform.OS === "android") {
        try {
          summaryInputRef.current?.blur?.()
        } catch {}
        try {
          newNoteInputRef.current?.blur?.()
        } catch {}
        try {
          editingNoteInputRef.current?.blur?.()
        } catch {}
        try {
          transcriptSearchInputRef.current?.blur?.()
        } catch {}
        setSummaryFocused(false)
        setNotesFocused(false)
        setTranscriptSearchFocused(false)
      }
    }
    const showSub = Keyboard.addListener("keyboardDidShow", onShow as any)
    const hideSub = Keyboard.addListener("keyboardDidHide", onHide as any)
    return () => {
      showSub.remove?.()
      hideSub.remove?.()
    }
  }, [summaryFocused, notesFocused, transcriptSearchFocused])

  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  useEffect(() => {
    const shouldShow = uiActiveTab === "transcript" && transcriptIsScrolledDown
    RNAnimated.timing(transcriptScrollToTopOpacity, {
      toValue: shouldShow ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start()
  }, [uiActiveTab, transcriptIsScrolledDown, transcriptScrollToTopOpacity])

  useEffect(() => {
    const toValue = uiActiveTab === "askai" || summaryFocused || notesFocused || transcriptSearchFocused ? 0 : 1
    RNAnimated.timing(audioPlayerVisibilityAnim, {
      toValue,
      duration: 180,
      useNativeDriver: false,
    }).start()
  }, [uiActiveTab, summaryFocused, notesFocused, transcriptSearchFocused, audioPlayerVisibilityAnim])

  useEffect(() => {
    if (!summaryFocused) return
    requestAnimationFrame(() => {
      summaryScrollRef.current?.scrollTo?.({ y: 0, animated: false })
    })
  }, [summaryFocused])

  

  useEffect(() => {
    if (!isAudioRecording) return
    const id = (conversationId || "").trim()
    if (!id) return
    let cancelled = false
    const run = async () => {
      try {
        setIsNativePlayerInitializing(true)
        setAudioErrorMessage(null)
        logger.debug("native:init:start")
        await new Promise((resolve) => setTimeout(resolve, 0))
        if (cancelled) return
        const name = coacheeName.trim()
        const coacheeId = name ? name.toLowerCase().replace(/\s+/g, "_") : "loose_recordings"
        const baseDirectory = `CoachScribe/coachees/${coacheeId}/${id}`
        const toFileSystemPath = (uri: string) => (uri.startsWith("file://") ? uri.slice(7) : uri)
        const keyBase64 = await getOrCreateLocalEncryptionKey()
        async function findAudioFileName() {
          const files = await listFiles(baseDirectory)
          return files.find((n) => {
            const lower = n.toLowerCase()
            if (!lower.startsWith("audio.")) return false
            if (!lower.endsWith(".csg1")) return false
            return true
          })
        }

        let audioFileName = await findAudioFileName()
        const startedAt = Date.now()
        while (!audioFileName && !cancelled && Date.now() - startedAt < 8000) {
          await new Promise((resolve) => setTimeout(resolve, 250))
          if (cancelled) return
          audioFileName = await findAudioFileName()
        }

        logger.debug("native:init:audio_file", { found: !!audioFileName })
        if (!audioFileName || cancelled) {
          if (!cancelled) {
            setUseNativePlayer(false)
            setIsPreparing(false)
            setAudioErrorMessage("De audio-opname ontbreekt.")
          }
          setIsNativePlayerInitializing(false)
          return
        }
        const segmentedDirectory = new Directory(Paths.document, baseDirectory)
        const segmentedFile = new File(segmentedDirectory, audioFileName)
        segmentedFileUriRef.current = segmentedFile.uri
        logger.debug("native:init:segFile")
        await new Promise((resolve) => setTimeout(resolve, 0))
        if (cancelled) return
        const verifyFile = new File(segmentedFile.uri)
        if (!verifyFile.exists) {
          throw new Error("Segmented file was not created")
        }
        const actualSegSize = verifyFile.size
        logger.debug("native:init:segFile:size", { size: actualSegSize, exists: verifyFile.exists })
        try {
          const segmentMetadata = await segmentInfo(toFileSystemPath(segmentedFile.uri))
          logger.debug("native:init:segInfo")
          const headerSize = 28
          const expectedMinSize = headerSize + (segmentMetadata.segmentCount * 16)
          if (actualSegSize < expectedMinSize) {
            logger.debug("native:init:segFile:incomplete")
            throw new Error(`Segmented file appears incomplete: ${actualSegSize} < ${expectedMinSize}`)
          }
        } catch (e: any) {
          logger.warn("native:init:segInfo:error")
          throw e
        }
        logger.debug("native:init:encrypted")
        const originalForMime = audioFileName.replace(/\.csg1$/i, "")
        const registrationOk = await playerRegisterToken(id, toFileSystemPath(segmentedFile.uri), keyBase64, 64 * 1024, "gcm", originalForMime)
        logger.debug("native:init:registerToken", { ok: registrationOk })
        setUseNativePlayer(true)
        logger.debug("native:useNativePlayer:true")
        clearNativePlayerListenerSubscriptions()
        nativePlayerListenerSubscriptionsRef.current.push(addPlayerListener("player_buffering", () => {
          setIsPreparing(true)
          logger.debug("native:event:buffering")
        }))
        nativePlayerListenerSubscriptionsRef.current.push(addPlayerListener("player_ready", () => {
          setIsPreparing(false)
          logger.debug("native:event:ready")
          if (desiredIsPlayingRef.current) {
            playerPlay().catch(() => {})
            if (nativeTickTimerRef.current) clearInterval(nativeTickTimerRef.current)
            nativeTickStartWallClockRef.current = Date.now()
            nativeTickStartPositionRef.current = playerPositionRef.current || 0
            nativeTickTimerRef.current = setInterval(() => {
              const d = duration ?? 0
              const elapsed = Date.now() - nativeTickStartWallClockRef.current
              const base = nativeTickStartPositionRef.current
              const next = Math.min(d || Number.MAX_SAFE_INTEGER, base + elapsed)
              setPlayerPositionSafe(next)
              playedMsSv.value = next
              if (d && next >= d) {
                clearInterval(nativeTickTimerRef.current)
                nativeTickTimerRef.current = null
                desiredIsPlayingRef.current = false
                setIsPlaying(false)
                setPlayerPositionSafe(0)
                playedMsSv.value = 0
              }
            }, 250)
          }
        }))
        nativePlayerListenerSubscriptionsRef.current.push(addPlayerListener("player_ended", () => {
          logger.debug("native:event:ended")
          setIsPlaying(false)
          desiredIsPlayingRef.current = false
          if (nativeTickTimerRef.current) {
            clearInterval(nativeTickTimerRef.current)
            nativeTickTimerRef.current = null
          }
          setPlayerPositionSafe(0)
          playedMsSv.value = 0
        }))
        nativePlayerListenerSubscriptionsRef.current.push(addPlayerListener("player_error", (e?: any) => {
          logger.warn("native:event:error")
          setIsPreparing(false)
          setIsPlaying(false)
          const reason = (e && (e.message || e.reason || e.error)) ? String(e.message || e.reason || e.error) : ""
          const trimmed = reason.trim()
          const suffix = trimmed ? ` (${trimmed.slice(0, 160)})` : ""
          setAudioErrorMessage(`De audio-speler kon niet laden.${suffix}`)
          logger.warn("player_error")
        }))
        const loadOk = await playerLoad(id)
        logger.debug("native:init:load", { ok: loadOk })
        setIsNativePlayerInitializing(false)
      } catch (e: any) {
        logger.warn("native:init:error")
        const reason = e && e.message ? String(e.message) : e ? String(e) : ""
        const trimmed = reason.trim()
        const suffix = trimmed ? ` (${trimmed.slice(0, 160)})` : ""
        if (!cancelled) setAudioErrorMessage(`De audio-speler kon niet laden.${suffix}`)
        setIsNativePlayerInitializing(false)
      }
    }
    const task = InteractionManager.runAfterInteractions(run)
    return () => {
      cancelled = true
      setIsNativePlayerInitializing(false)
      decryptedFileUriRef.current = null
      // @ts-ignore
      task?.cancel?.()
      clearNativePlayerListenerSubscriptions()
    }
  }, [isAudioRecording, coacheeName, conversationId])

  useEffect(() => {
    let isCancelled = false

    async function loadAudioAndMetering() {
      try {
        logger.debug("Conversation:init:start")
        if (!isAudioRecording) return
        const id = (conversationId || "").trim()
        if (!id) return

        const name = coacheeName.trim()
        const coacheeId = name ? slugifyId(name) : "loose_recordings"
        const baseDirectory = `CoachScribe/coachees/${coacheeId}/${id}`

        try {
          const exists = await transcriptFileExists(coacheeName, id)
          if (!isCancelled) {
            setHasTranscript(exists)
            setIsTranscribing(!exists && (await readTranscriptionStatus(coacheeName, id)) === "transcribing")
          }
        } catch (e: any) {
          logger.warn("Conversation:transcript:error")
        }

        // Defer summary read slightly to keep first paint responsive
        setTimeout(async () => {
          if (isCancelled) return
          try {
            const files = await listFiles(baseDirectory)
            if (files.includes("summary.txt.enc")) {
              if (!isCancelled) setIsSummaryGenerating(false)
              if (!isCancelled) setIsSummaryLoading(true)
              const s = await readEncryptedFile(baseDirectory, "summary.txt.enc")
              if (!isCancelled) setSummaryAndMarkSaved(s)
              if (!isCancelled) setIsSummaryLoading(false)
              if (!isCancelled) setHasCheckedSummary(true)
            } else if (files.includes("transcript.txt.enc")) {
              if (!isCancelled) setIsSummaryLoading(false)
              if (!isCancelled) setIsSummaryGenerating(true)
              if (!isCancelled) setHasCheckedSummary(true)
            } else {
              if (!isCancelled) setIsSummaryLoading(false)
              if (!isCancelled) setIsSummaryGenerating(false)
              if (!isCancelled) setHasCheckedSummary(true)
            }
          } catch {
            if (!isCancelled) setIsSummaryLoading(false)
            if (!isCancelled) setIsSummaryGenerating(false)
            if (!isCancelled) setHasCheckedSummary(true)
          }
        }, 200)

        // Defer metering read a bit as well
        setTimeout(async () => {
          if (isCancelled) return
          let samples: number[] | undefined
          try {
            const meteringJsonPlain = await readPlainTextFile(baseDirectory, "metering.json")
            const parsed = JSON.parse(meteringJsonPlain) as { samples?: number[] }
            if (Array.isArray(parsed.samples)) {
              samples = parsed.samples
            }
          } catch {}
          if (samples && samples.length > 0) {
            const heights = computeBarHeightsFromSamples(samples, 80)
            if (!isCancelled) {
              setBarHeights(heights)
              logger.debug("Conversation:bars:ready", { count: heights.length })
            }
          } else {
            if (!isCancelled) setBarHeights([])
          }
          if (!isCancelled) setBarsReady(true)
        }, 250)

        // Defer duration read slightly
        setTimeout(async () => {
          try {
            const name = coacheeName.trim()
            const coacheeId = name ? slugifyId(name) : "loose_recordings"
            const baseDirectory = `CoachScribe/coachees/${coacheeId}/${id}`
            const dTxt = await readPlainTextFile(baseDirectory, "duration.txt")
            const dNum = parseInt((dTxt || "").trim(), 10)
            if (!Number.isNaN(dNum)) {
              setDuration(dNum)
              durationSv.value = dNum
              logger.debug("Conversation:duration:prefetched")
            }
          } catch (e: any) {
            logger.warn("Conversation:duration:error")
          }
        }, 300)

        if (!isCancelled) setSummaryUiInitializing(false)
        logger.debug("Conversation:init:end")
      } catch (e: any) {
        logger.warn("Conversation:init:error")
      }
    }

    const task = InteractionManager.runAfterInteractions(() => {
      if (!isCancelled) loadAudioAndMetering()
    })

    return () => {
      isCancelled = true
      task?.cancel?.()
      cleanupBackupPlayerAndDecryptedAudio()
      try { playerUnload().catch(() => {}) } catch {}
      if (nativeTickTimerRef.current) {
        clearInterval(nativeTickTimerRef.current)
        nativeTickTimerRef.current = null
      }
      const segUri = segmentedFileUriRef.current
      segmentedFileUriRef.current = null
    }
  }, [isAudioRecording, coacheeName, conversationId])

  useEffect(() => {
    if (!isAudioRecording) return
    const id = (conversationId || "").trim()
    if (!id) return
    let cancelled = false
    resumeTranscriptionInFlightRef.current = false
    const task = InteractionManager.runAfterInteractions(async () => {
      if (resumeTranscriptionInFlightRef.current) return
      resumeTranscriptionInFlightRef.current = true
      try {
        const name = coacheeName.trim()
        const coacheeId = name ? slugifyId(name) : "loose_recordings"
        const baseDirectory = `CoachScribe/coachees/${coacheeId}/${id}`
        const files = await listFiles(baseDirectory)
        const hasTranscriptFile = files.includes("transcript.txt.enc")
        const hasSummaryFile = files.includes("summary.txt.enc")
        const status = await readTranscriptionStatus(coacheeName, id)

        if (!hasTranscriptFile && status === "transcribing") {
          logger.debug("Conversation:resume:transcription:already_running")
          if (!cancelled) setIsTranscribing(true)
          resumeTranscriptionInFlightRef.current = false
          return
        }

        if (hasTranscriptFile && !hasSummaryFile) {
          logger.debug("Conversation:resume:summary:start")
          if (!cancelled) setIsSummaryLoading(false)
          if (!cancelled) setIsSummaryGenerating(true)
          const summaryCreated = await ensureSummaryExists(coacheeName, id)
          if (summaryCreated) {
            try {
              const s = await readEncryptedFile(baseDirectory, "summary.txt.enc")
              if (!cancelled) setSummaryAndMarkSaved(s)
            } catch {}
            if (!cancelled) setIsSummaryLoading(false)
            if (!cancelled) setIsSummaryGenerating(false)
            resumeTranscriptionInFlightRef.current = false
          } else {
            let pollAttempts = 0
            const maxPollAttempts = 60
            const pollInterval = 2000
            while (!cancelled && pollAttempts < maxPollAttempts) {
              await new Promise((resolve) => setTimeout(resolve, pollInterval))
              if (cancelled) break
              const checkFiles = await listFiles(baseDirectory)
              if (checkFiles.includes("summary.txt.enc")) {
                try {
                  const s = await readEncryptedFile(baseDirectory, "summary.txt.enc")
                  if (!cancelled) setSummaryAndMarkSaved(s)
                } catch {}
                if (!cancelled) setIsSummaryLoading(false)
                if (!cancelled) setIsSummaryGenerating(false)
                resumeTranscriptionInFlightRef.current = false
                break
              }
              pollAttempts += 1
            }
            if (!cancelled && pollAttempts >= maxPollAttempts) {
              setIsSummaryLoading(false)
              setIsSummaryGenerating(false)
            }
            resumeTranscriptionInFlightRef.current = false
          }
        } else {
          resumeTranscriptionInFlightRef.current = false
        }
      } catch (e: any) {
        logger.warn("Conversation:resume:error")
        resumeTranscriptionInFlightRef.current = false
      }
    })
    return () => {
      cancelled = true
      resumeTranscriptionInFlightRef.current = false
      // @ts-ignore
      task?.cancel?.()
    }
  }, [isAudioRecording, coacheeName, conversationId])

  useEffect(() => {
    if (!isAudioRecording) return
    const id = (conversationId || "").trim()
    if (!id) return
    let cancelled = false
    let timer: any
    let attempts = 0
    const maxAttempts = 120

    async function pollStatusAndFiles() {
      attempts += 1
      try {
        const status = await readTranscriptionStatus(coacheeName, id)
        if (cancelled) return

        if (status === "transcribing") {
          setIsTranscribing(true)
        }

        if (status === "done") {
          setIsTranscribing(false)
          const hasTranscriptFile = await transcriptFileExists(coacheeName, id)
          if (cancelled) return
          if (hasTranscriptFile) {
            setHasTranscript(true)
          }
          return
        }

        if (status === "error") {
          setIsTranscribing(false)
          return
        }
      } catch {}

      if (attempts < maxAttempts) {
        timer = setTimeout(pollStatusAndFiles, 1000)
      }
    }

    if (!hasTranscript) {
      pollStatusAndFiles()
    }

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [isAudioRecording, coacheeName, conversationId, hasTranscript])

  useEffect(() => {
    if (uiActiveTab !== "transcript" && uiActiveTab !== "askai") return
    if (sessionType !== "audio") return
    const id = (conversationId || "").trim()
    if (!id) return
    if (!hasTranscript) return
    if ((transcript || "").trim()) return
    let cancelled = false
    const requestId = transcriptLoadRequestIdRef.current + 1
    transcriptLoadRequestIdRef.current = requestId
    setIsTranscriptLoading(true)
    const task = InteractionManager.runAfterInteractions(async () => {
      const startedAt = Date.now()
      try {
        const name = coacheeName.trim()
        const coacheeId = name ? slugifyId(name) : "loose_recordings"
        const baseDirectory = `CoachScribe/coachees/${coacheeId}/${id}`
        const txt = await readEncryptedFile(baseDirectory, "transcript.txt.enc")
        if (!cancelled) setTranscript(txt)
        try {
          logger.debug("Conversation:transcript:load:done", { milliseconds: Date.now() - startedAt })
        } catch {}
      } catch {}
      if (!cancelled && transcriptLoadRequestIdRef.current === requestId) {
        setIsTranscriptLoading(false)
      }
    })
    return () => {
      cancelled = true
      // @ts-ignore
      task?.cancel?.()
      if (transcriptLoadRequestIdRef.current === requestId) {
        setIsTranscriptLoading(false)
      }
    }
  }, [uiActiveTab, sessionType, coacheeName, conversationId, hasTranscript, transcript])

  useEffect(() => {
    if (sessionType !== "audio") return
    const id = (conversationId || "").trim()
    if (!id) return
    let isCancelled = false
    let timer: any
    async function poll() {
      try {
        const hasTranscript = await transcriptFileExists(coacheeName, id)
        if (isCancelled) return
        if (hasTranscript) {
          setHasTranscript(true)
          const name = coacheeName.trim()
          const coacheeId = name ? slugifyId(name) : "loose_recordings"
          const baseDirectory = `CoachScribe/coachees/${coacheeId}/${id}`
          const txt = await readEncryptedFile(baseDirectory, "transcript.txt.enc")
          if (isCancelled) return
          setTranscript(txt)
          setIsTranscribing(false)
          return
        }
        const status = await readTranscriptionStatus(coacheeName, id)
        if (isCancelled) return
        setIsTranscribing(status === "transcribing")
      } catch {}
      timer = setTimeout(poll, 2500)
    }
    if (isTranscribing) {
      poll()
    }
    return () => {
      isCancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [isTranscribing, sessionType, coacheeName, conversationId])

  useEffect(() => {
    if (isAudioRecording) return
    const id = (conversationId || "").trim()
    if (!id) return
    let isCancelled = false
    ;(async () => {
      try {
        const name = coacheeName.trim()
        const coacheeId = name ? slugifyId(name) : "loose_recordings"
        const baseDirectory = `CoachScribe/coachees/${coacheeId}/${id}`
        const files = await listFiles(baseDirectory)
        if (isCancelled) return
        if (files.includes("summary.txt.enc")) {
          setIsSummaryLoading(true)
          const s = await readEncryptedFile(baseDirectory, "summary.txt.enc")
          if (isCancelled) return
          setSummaryAndMarkSaved(s)
          setIsSummaryLoading(false)
        }
        if (files.includes("notes.json.enc")) {
          await loadNotes()
        }
      } catch {}
      if (!isCancelled) {
        setIsSummaryLoading(false)
        setSummaryUiInitializing(false)
        setHasCheckedSummary(true)
      }
    })()
    return () => {
      isCancelled = true
    }
  }, [isAudioRecording, coacheeName, conversationId])

  useEffect(() => {
    if (!isAudioRecording) return
    const id = (conversationId || "").trim()
    if (!id) return
    let isCancelled = false
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const baseDirectory = getBaseDirectoryForConversation()
        if (!baseDirectory || isCancelled) return
        const files = await listFiles(baseDirectory)
        if (isCancelled) return
        if (files.includes("notes.json.enc")) {
          await loadNotes()
        }
      } catch {}
    })
    return () => {
      isCancelled = true
      // @ts-ignore
      task?.cancel?.()
    }
  }, [isAudioRecording, coacheeName, conversationId])

  useEffect(() => {
    if (sessionType !== "audio") return
    const id = (conversationId || "").trim()
    if (!id) return
    let isCancelled = false
    let timer: any
    async function poll() {
      try {
        const name = coacheeName.trim()
        const coacheeId = name ? slugifyId(name) : "loose_recordings"
        const baseDirectory = `CoachScribe/coachees/${coacheeId}/${id}`
        const files = await listFiles(baseDirectory)
        if (isCancelled) return
        if (files.includes("summary.txt.enc")) {
          const s = await readEncryptedFile(baseDirectory, "summary.txt.enc")
          if (isCancelled) return
          setSummaryAndMarkSaved(s)
          return
        }
      } catch {}
      timer = setTimeout(poll, 2500)
    }
    if ((transcript || "").trim() && !(summary || "").trim()) {
      poll()
    }
    return () => {
      isCancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [sessionType, coacheeName, conversationId, transcript, summary])

  function onBack() {
    vibrate()
    if (editMode) {
      setEditMode(false)
      return
    }
    navigation.goBack?.()
  }

  async function seekToSecondsAbsolute(seconds: number) {
    vibrate()
    if (useNativePlayer) {
      try {
        const targetMs = Math.max(0, Math.floor(seconds * 1000))
        await playerSeekTo(targetMs)
        setPlayerPositionSafe(targetMs)
        playedMsSv.value = targetMs
        nativeTickStartWallClockRef.current = Date.now()
        nativeTickStartPositionRef.current = targetMs
      } catch {}
      return
    }
    try {
      const player = backupPlayerRef.current
      if (!player) return
      const targetSeconds = Math.max(0, seconds)
      const targetMs = Math.max(0, Math.floor(targetSeconds * 1000))
      await player.seekTo(targetSeconds)
      setPlayerPositionSafe(targetMs)
      playedMsSv.value = targetMs
    } catch {}
  }

  async function ensureBackupPlayerLoaded() {
    if (useNativePlayer) return
    if (backupPlayerRef.current) return
    if (!isAudioRecording) return
    const id = (conversationId || "").trim()
    if (!id) return
    if (isBackupPlayerLoading) return
    setIsBackupPlayerLoading(true)
    setAudioErrorMessage(null)
    try {
      try {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false })
      } catch {}
      let fileUri = await ensureDecryptedFile(
        coacheeName,
        id,
        async (dir) => await listFiles(dir),
        async (dir, name) => await readEncryptedFile(dir, name),
      )
      if (!fileUri) {
        for (let i = 0; i < 12; i++) {
          await new Promise((r) => setTimeout(r, 150))
          fileUri = await ensureDecryptedFile(
            coacheeName,
            id,
            async (dir) => await listFiles(dir),
            async (dir, name) => await readEncryptedFile(dir, name),
          )
          if (fileUri) break
        }
      }
      if (!fileUri) {
        setAudioErrorMessage("De audio-opname ontbreekt.")
        return
      }
      decryptedFileUriRef.current = fileUri
      const player = createAudioPlayer({ uri: fileUri }, { updateInterval: 250 })
      try { player.muted = false } catch {}
      try { player.volume = 1.0 } catch {}
      backupPlayerRef.current = player
      let attempts = 0
      while (!player.isLoaded && attempts < 50) {
        await new Promise((r) => setTimeout(r, 40))
        attempts += 1
      }
      const durationSeconds = typeof player.duration === "number" ? player.duration : 0
      const durationMs = durationSeconds > 0 ? Math.floor(durationSeconds * 1000) : 0
      if (durationMs > 0) {
        setDuration(durationMs)
        durationSv.value = durationMs
      }
    } finally {
      setIsBackupPlayerLoading(false)
    }
  }

  function cleanupBackupPlayerAndDecryptedAudio() {
    if (backupTickTimerRef.current) {
      clearInterval(backupTickTimerRef.current)
      backupTickTimerRef.current = null
    }
    if (backupPlayerRef.current) {
      try { backupPlayerRef.current.pause() } catch {}
      try { backupPlayerRef.current.remove() } catch {}
      backupPlayerRef.current = null
    }
    deleteDecryptedAudioCacheFile(decryptedFileUriRef.current).catch(() => {})
    decryptedFileUriRef.current = null
  }

  async function togglePlayPause() {
    vibrate()
    logger.debug("playback:path", useNativePlayer ? "native" : "expo-audio")
    logger.debug("ui:toggle:start")
    const wantPlay = !isPlaying
    desiredIsPlayingRef.current = wantPlay
    if (useNativePlayer) {
      if (wantPlay) {
        try { setIsPreparing(true) } catch {}
        try {
          logger.debug("native:play:calling")
          try {
            await playerSeekTo(Math.max(0, Math.floor(playerPositionRef.current)))
          } catch {}
          const ok = await playerPlay()
          logger.debug("native:play:result", { ok })
        } catch (e: any) {
          logger.warn("native:play:error")
        }
        setIsPreparing(false)
        setIsPlaying(true)
        logger.debug("native:play:setPlaying")
        if (nativeTickTimerRef.current) clearInterval(nativeTickTimerRef.current)
        nativeTickStartWallClockRef.current = Date.now()
        nativeTickStartPositionRef.current = playerPositionRef.current || 0
        logger.debug("native:tick:start")
        nativeTickTimerRef.current = setInterval(() => {
          const d = duration ?? 0
          const elapsed = Date.now() - nativeTickStartWallClockRef.current
          const base = nativeTickStartPositionRef.current
          const next = Math.min(d || Number.MAX_SAFE_INTEGER, base + elapsed)
          setPlayerPositionSafe(next)
          playedMsSv.value = next
          if (d && next >= d) {
            clearInterval(nativeTickTimerRef.current)
            nativeTickTimerRef.current = null
            desiredIsPlayingRef.current = false
            setIsPlaying(false)
            setPlayerPositionSafe(0)
            playedMsSv.value = 0
            logger.debug("native:tick:end:complete")
          }
        }, 250)
      } else {
        try {
          logger.debug("native:pause:calling")
          const ok = await playerPause()
          logger.debug("native:pause:result", { ok })
        } catch (e: any) {
          logger.warn("native:pause:error")
        }
        setIsPlaying(false)
        if (nativeTickTimerRef.current) {
          clearInterval(nativeTickTimerRef.current)
          nativeTickTimerRef.current = null
        }
      }
      return
    }
    if (wantPlay) {
      if (isPreparing || isBackupPlayerLoading) return
      setIsPreparing(true)
      try {
        await ensureBackupPlayerLoaded()
        const player = backupPlayerRef.current
        if (!player) return
        const durationSeconds = typeof player.duration === "number" ? player.duration : 0
        const currentSeconds = typeof player.currentTime === "number" ? player.currentTime : 0
        if (durationSeconds > 0 && currentSeconds >= durationSeconds - 0.01) {
          try { await player.seekTo(0) } catch {}
          setPlayerPositionSafe(0)
          playedMsSv.value = 0
        }
        try { player.play() } catch {}
        setIsPlaying(true)
        if (backupTickTimerRef.current) clearInterval(backupTickTimerRef.current)
        backupTickTimerRef.current = setInterval(() => {
          const p = backupPlayerRef.current
          if (!p) return
          const curSeconds = typeof p.currentTime === "number" ? p.currentTime : 0
          const durSeconds = typeof p.duration === "number" ? p.duration : 0
          const curMs = Math.max(0, Math.floor(curSeconds * 1000))
          const durMs = durSeconds > 0 ? Math.floor(durSeconds * 1000) : 0
          setPlayerPositionSafe(curMs)
          playedMsSv.value = curMs
          if (durMs > 0 && curMs >= durMs) {
            desiredIsPlayingRef.current = false
            setIsPlaying(false)
            setPlayerPositionSafe(0)
            playedMsSv.value = 0
            cleanupBackupPlayerAndDecryptedAudio()
          }
        }, 250)
      } finally {
        setIsPreparing(false)
      }
    } else {
      setIsPlaying(false)
      cleanupBackupPlayerAndDecryptedAudio()
    }
  }

  async function seekBySeconds(offsetSeconds: number) {
    vibrate()
    if (useNativePlayer) {
      const dur = duration ?? 0
      const current = playerPositionRef.current
      let target = current + offsetSeconds * 1000
      if (target < 0) target = 0
      if (dur && target > dur) target = dur
      try {
        const targetMs = Math.floor(target)
        await playerSeekTo(targetMs)
        setPlayerPositionSafe(targetMs)
        playedMsSv.value = targetMs
        nativeTickStartWallClockRef.current = Date.now()
        nativeTickStartPositionRef.current = targetMs
      } catch {}
      return
    }
    const player = backupPlayerRef.current
    if (!player) return
    try {
      const durationSeconds = typeof player.duration === "number" ? player.duration : 0
      const currentSeconds = typeof player.currentTime === "number" ? player.currentTime : 0
      let targetSeconds = currentSeconds + offsetSeconds
      if (targetSeconds < 0) targetSeconds = 0
      if (durationSeconds > 0 && targetSeconds > durationSeconds) targetSeconds = durationSeconds
      await player.seekTo(targetSeconds)
      const targetMs = Math.max(0, Math.floor(targetSeconds * 1000))
      setPlayerPositionSafe(targetMs)
      playedMsSv.value = targetMs
    } catch {}
  }

  function onMore() {
    vibrate()
    setShowMoreMenu((v) => !v)
    setShowShareMenu(false)
  }

  function onShare() {
    vibrate()
    setShowShareMenu((v) => !v)
    setShowMoreMenu(false)
  }

  async function shareSummary() {
    vibrate()
    setShowShareMenu(false)
  }

  function seekToMs(milliseconds: number) {
    if (useNativePlayer) {
      const targetMs = Math.max(0, Math.floor(milliseconds))
      playerSeekTo(targetMs).catch(() => {})
      setPlayerPositionSafe(targetMs)
      playedMsSv.value = targetMs
      nativeTickStartWallClockRef.current = Date.now()
      nativeTickStartPositionRef.current = targetMs
      return
    }
    const player = backupPlayerRef.current
    if (!player) return
    const seconds = Math.max(0, milliseconds / 1000)
    player.seekTo(seconds).catch(() => {})
    const targetMs = Math.max(0, Math.floor(milliseconds))
    setPlayerPositionSafe(targetMs)
    playedMsSv.value = targetMs
  }

  function renderAudioPlayer() {
    if (!isAudioRecording) return null
    const isReady = (useNativePlayer ? !isBackupPlayerLoading && !isPreparing && !isNativePlayerInitializing : !!backupPlayerRef.current && !isBackupPlayerLoading && !isPreparing)
    return (
      <View style={styles.playerCard}>
        <GestureDetector
          gesture={
            Gesture.Pan()
              .shouldCancelWhenOutside(false)
              .onStart(() => {
                scrubbingRef.current = true
                runOnJS(setScrubbing)(true)
                scrubLastUiUpdateAtSv.value = 0
              })
              .onUpdate((ev) => {
                const width = waveWidthSv.value || 0
                if (!width || durationSv.value <= 0) return
                const clampedX = Math.max(0, Math.min(ev.x, width))
                const percent = clampedX / width
                const positionMs = Math.max(0, Math.floor(percent * durationSv.value))
                playedMsSv.value = positionMs

                const now = Date.now()
                if (now - (scrubLastUiUpdateAtSv.value || 0) >= 50) {
                  scrubLastUiUpdateAtSv.value = now
                  runOnJS(setPlayerPositionSafe)(positionMs)
                }
              })
              .onEnd((ev) => {
                const width = waveWidthSv.value || 0
                const totalDurationMs = durationSv.value || 0
                if (!width || totalDurationMs <= 0) return
                const clampedX = Math.max(0, Math.min(ev.x, width))
                const percent = clampedX / width
                const positionMs = percent * totalDurationMs
                runOnJS(setPlayerPositionSafe)(positionMs)
                playedMsSv.value = positionMs
                runOnJS(seekToMs)(positionMs)
              })
              .onFinalize(() => {
                scrubbingRef.current = false
                runOnJS(setScrubbing)(false)
              })
          }
        >
        <RNAnimated.View
          style={styles.waveWrap}
          pointerEvents="box-only"
          onLayout={(e) => {
            const width = e.nativeEvent.layout.width
            waveWidthSv.value = width
            const totalDurationMs = duration ?? 0
            if (totalDurationMs > 0) {
              const percent = playerPosition / totalDurationMs
              playedMsSv.value = percent * totalDurationMs
            }
          }}
        >
          {audioErrorMessage ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={styles.audioErrorText}>{audioErrorMessage}</Text>
            </View>
          ) : barsReady && isReady ? (
            <View style={styles.waveBars}>
              {barHeights.map((height, i, array) => (
                <WaveBar
                  key={i}
                  height={height}
                  barIndex={i}
                  totalBars={array.length}
                  durationSv={durationSv}
                  playedMsSv={playedMsSv}
                />
              ))}
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color={colors.orange} />
            </View>
          )}
        </RNAnimated.View>
        </GestureDetector>
        <View style={styles.playerRow}>
          <Text style={[styles.time, styles.timeLeft]}>
            {`${String(Math.floor(playerPosition / 60000)).padStart(2, "0")}:${String(
              Math.floor((playerPosition / 1000) % 60),
            ).padStart(2, "0")}`}
            {`/${String(Math.floor(((duration ?? 0) / 60000))).padStart(2, "0")}:${String(
              Math.floor(((duration ?? 0) / 1000) % 60),
            ).padStart(2, "0")}`}
          </Text>
          <View style={styles.controls}>
            <Pressable
              accessibilityRole="button"
              style={styles.ctrlBtn}
              onPress={() => {
                seekBySeconds(-10)
              }}
            >
              <Icon name="backward10" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={[styles.playBtn, (isBackupPlayerLoading || isPreparing || isNativePlayerInitializing) && { opacity: 0.6 }]}
              disabled={!!audioErrorMessage || (useNativePlayer ? (isNativePlayerInitializing || isPreparing) : (isBackupPlayerLoading || isPreparing))}
              onPress={togglePlayPause}
            >
              {((!useNativePlayer && (isPreparing || isBackupPlayerLoading)) || (useNativePlayer && isNativePlayerInitializing)) ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Icon name={isPlaying ? "pause" : "play"} color={colors.white} />
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={styles.ctrlBtn}
              onPress={() => {
                seekBySeconds(10)
              }}
            >
              <Icon name="forward10" />
            </Pressable>
          </View>
        </View>
      </View>
    )
  }

  function onDelete() {
    vibrate()
    setShowMoreMenu(false)
    setShowDeleteWarning(true)
  }

  function formatDate(date: Date) {
    const dd = date.getDate().toString().padStart(2, "0")
    const mm = (date.getMonth() + 1).toString().padStart(2, "0")
    const yy = date.getFullYear().toString().slice(2)
    const hh = date.getHours().toString().padStart(2, "0")
    const min = date.getMinutes().toString().padStart(2, "0")
    return `${dd}/${mm}/${yy} ${hh}:${min}`
  }
  function formatHms(totalSeconds: number) {
    const total = Math.max(0, Math.floor(totalSeconds))
    const hh = Math.floor(total / 3600)
    const mm = Math.floor((total % 3600) / 60)
    const ss = total % 60
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
  }

  function normalizeSpeakerId(speakerId: string) {
    return String(speakerId || "")
      .trim()
      .toLowerCase()
      .replace(/:$/, "")
      .replace(/\s+/g, "_")
  }

  const speakerIndexById = useMemo(() => {
    const map = new Map<string, number>()
    let nextIndex = 0
    for (const segment of transcriptSegments) {
      const key = normalizeSpeakerId(segment.speaker)
      if (!key) continue
      if (map.has(key)) continue
      map.set(key, nextIndex)
      nextIndex += 1
    }
    return map
  }, [transcriptSegments])

  function isSecondSpeaker(speakerId: string) {
    const key = normalizeSpeakerId(speakerId)
    const index = speakerIndexById.get(key) ?? 0
    return index % 2 === 1
  }

  function renderHighlightedMatchText(params: { text: string; query: string; textStyle: any }) {
    const { text, query, textStyle } = params
    const normalizedQuery = (query || "").trim()
    const normalizedText = String(text || "")
    if (!normalizedQuery) {
      return normalizedText
    }
    const queryLower = normalizedQuery.toLowerCase()
    const textLower = normalizedText.toLowerCase()
    if (!queryLower || !textLower) {
      return normalizedText
    }
    if (!textLower.includes(queryLower)) {
      return normalizedText
    }

    const parts: React.ReactNode[] = []
    let fromIndex = 0
    while (fromIndex < normalizedText.length) {
      const matchIndex = textLower.indexOf(queryLower, fromIndex)
      if (matchIndex === -1) {
        const tail = normalizedText.slice(fromIndex)
        if (tail) parts.push(tail)
        break
      }

      const before = normalizedText.slice(fromIndex, matchIndex)
      if (before) parts.push(before)

      const match = normalizedText.slice(matchIndex, matchIndex + normalizedQuery.length)
      if (match) {
        parts.push(
          <Text key={`${matchIndex}`} style={[textStyle, styles.transcriptMatchHighlight]}>
            {match}
          </Text>,
        )
      }

      fromIndex = matchIndex + Math.max(1, normalizedQuery.length)
    }

    return parts
  }

  async function saveNotes(notesToSave: Note[]) {
    const baseDirectory = getBaseDirectoryForConversation()
    if (!baseDirectory) return
    try {
      const json = JSON.stringify(notesToSave)
      await writeEncryptedFile(baseDirectory, "notes.json.enc", json, "text")
    } catch (e: any) {
      logger.warn("Conversation:notes:save:error")
    }
  }

  async function commitEditingNote(noteId: string, nextText: string) {
    try {
      const trimmed = nextText.trim()
      const nextNotes = notes.map((x) => (x.id === noteId ? { ...x, text: trimmed } : x))
      setNotes(nextNotes)
      await saveNotes(nextNotes)
    } finally {
      setNotesFocused(false)
      if (editingNoteId === noteId) {
        setEditingNoteId(null)
        setEditingText("")
      }
    }
  }

  function blurNotesInputs() {
    try {
      newNoteInputRef.current?.blur?.()
    } catch {}
    try {
      editingNoteInputRef.current?.blur?.()
    } catch {}
    Keyboard.dismiss()
    setNotesFocused(false)
  }

  function blurAllInputs() {
    if (uiActiveTab === "notes" && notesSelectMode) {
      exitNotesSelectMode()
      return
    }
    try {
      summaryInputRef.current?.blur?.()
    } catch {}
    try {
      transcriptSearchInputRef.current?.blur?.()
    } catch {}
    try {
      newNoteInputRef.current?.blur?.()
    } catch {}
    try {
      editingNoteInputRef.current?.blur?.()
    } catch {}
    Keyboard.dismiss()
    setSummaryFocused(false)
    setNotesFocused(false)
    setTranscriptSearchFocused(false)
  }

  async function loadNotes() {
    const baseDirectory = getBaseDirectoryForConversation()
    if (!baseDirectory) return
    try {
      const json = await readEncryptedFile(baseDirectory, "notes.json.enc")
      const parsed = JSON.parse(json) as Note[]
      if (Array.isArray(parsed)) {
        setNotes(parsed)
      }
    } catch (e: any) {
      logger.warn("Conversation:notes:load:error")
    }
  }

  async function saveNewNote() {
    const text = newNote.trim()
    if (!text) {
      setAddingNote(false)
      setNewNote("")
      return
    }
    const now = Date.now()
    const item: Note = { id: `${now}-${Math.random().toString(36).slice(2, 6)}`, date: now, text }
    const next = [item, ...notes]
    setNotes(next)
    await saveNotes(next)
    setNewNote("")
    setAddingNote(false)
  }

  function toggleNoteSelection({ noteId, force = false }: { noteId: string; force?: boolean }) {
    if (!notesSelectMode && !force) return
    if (!force) vibrate()
    setSelectedNoteIds((previous) => (previous.includes(noteId) ? previous.filter((value) => value !== noteId) : [...previous, noteId]))
  }

  function enterNotesSelectMode() {
    vibrate()
    setNotesSelectMode(true)
    setShowMoreMenu(false)
    setSelectedNoteIds([])
    setEditingNoteId(null)
    setEditingText("")
  }

  function exitNotesSelectMode() {
    vibrate()
    Keyboard.dismiss()
    setNotesFocused(false)
    setNotesSelectMode(false)
    setSelectedNoteIds([])
  }

  function requestDeleteSelectedNotes() {
    if (selectedNoteIds.length === 0) return
    vibrate()
    setShowDeleteNotesWarning(true)
  }

  async function deleteSelectedNotes() {
    if (selectedNoteIds.length === 0) return
    vibrate()
    const next = notes.filter((n) => !selectedNoteIds.includes(n.id))
    setNotes(next)
    await saveNotes(next)
    setSelectedNoteIds([])
    setNotesSelectMode(false)
    setShowDeleteNotesWarning(false)
  }

  useEffect(() => {
    if (notesSelectMode && previousNotesSelectionCountRef.current > 0 && selectedNoteIds.length === 0) {
      setNotesSelectMode(false)
    }
    previousNotesSelectionCountRef.current = selectedNoteIds.length
  }, [notesSelectMode, selectedNoteIds.length])

  function renderTab(tab: "summary" | "transcript" | "askai" | "notes") {
    function renderBoldInline(text: string, baseStyle: any) {
      const parts = text.split(/(\*\*[^*]+\*\*)/g)
      return parts.map((part, i) => {
        const isBold = part.startsWith("**") && part.endsWith("**") && part.length >= 4
        const value = isBold ? part.slice(2, -2) : part
        return (
          <Text key={i} style={[baseStyle, isBold && styles.boldText]}>
            {value}
          </Text>
        )
      })
    }
    function renderAssistantMessageText(text: string) {
      const lines = text.replace(/\r/g, "").split("\n")
      const blocks: Array<{ type: "list" | "para" | "h3"; items?: string[]; text?: string }> = []
      let currentList: string[] | null = null
      for (const line of lines) {
        const h = line.match(/^\s*###\s+(.*)$/)
        if (h) {
          currentList = null
          blocks.push({ type: "h3", text: h[1] })
        } else if (/^\s*-\s+/.test(line)) {
          const item = line.replace(/^\s*-\s+/, "")
          if (!currentList) {
            currentList = []
            blocks.push({ type: "list", items: currentList })
          }
          currentList.push(item)
        } else if (line.trim() === "") {
          currentList = null
        } else {
          currentList = null
          blocks.push({ type: "para", text: line })
        }
      }
      return blocks.map((b, idx) => {
        if (b.type === "list" && b.items) {
          return (
            <View key={`list-${idx}`} style={styles.assistantList}>
              {b.items.map((it, j) => (
                <View key={`li-${idx}-${j}`} style={[styles.assistantListItemRow, j > 0 ? { marginTop: spacing.small } : null]}>
                  <Text style={[styles.msgTextAssistant, styles.assistantBullet]}>•</Text>
                  <Text style={[styles.msgTextAssistant, styles.assistantListItemText]}>
                    {renderBoldInline(it, styles.msgTextAssistant)}
                  </Text>
                </View>
              ))}
            </View>
          )
        }
        if (b.type === "h3") {
          return (
            <Text key={`h3-${idx}`} style={[styles.msgTextAssistant, styles.assistantHeader]}>
              {renderBoldInline(b.text || "", styles.msgTextAssistant)}
            </Text>
          )
        }
        return (
          <Text key={`p-${idx}`} style={styles.msgTextAssistant}>
            {renderBoldInline(b.text || "", styles.msgTextAssistant)}
          </Text>
        )
      })
    }
    if (tab === "summary") {
      return (
        <View
          style={[
            styles.content,
            {
              flex: 1,
              paddingTop: spacing.small,
              paddingBottom: safeAreaBottom + (summaryFocused ? keyboardHeight + 25 : 50),
            },
          ]}
        >
          <View style={[styles.summaryContainer, { flex: 1 }]}>
            {summaryFocused ? (
              <View style={styles.summaryTopRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    vibrate()
                    skipAutoSaveSummaryOnBlurRef.current = true
                    setSummaryValue(savedSummaryValueRef.current || "")
                    Keyboard.dismiss()
                    setSummaryFocused(false)
                  }}
                  style={({ pressed }) => [pressed && { opacity: 0.8 }]}
                >
                  <Text style={styles.summaryCancelText}>Annuleren</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    vibrate()
                    saveSummary()
                    try {
                      summaryInputRef.current?.blur?.()
                    } catch {}
                    Keyboard.dismiss()
                    setSummaryFocused(false)
                  }}
                  disabled={isSavingSummary || !hasUnsavedSummaryChanges}
                  style={({ pressed }) => [
                    isSavingSummary ? { opacity: 0.7 } : null,
                    pressed && !(isSavingSummary || !hasUnsavedSummaryChanges) ? { opacity: 0.8 } : null,
                  ]}
                >
                  <Text style={[styles.summarySaveText, !hasUnsavedSummaryChanges && styles.summarySaveTextDisabled]}>
                    {isSavingSummary ? "Opslaan…" : "Opslaan"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
            {summaryUiInitializing || !hasCheckedSummary || isSummaryLoading || isSummaryGenerating || isTranscribing || ((transcript || "").trim() && !(summary || "").trim()) ? (
              <View style={styles.indicatorRow}>
                <ActivityIndicator color={colors.orange} />
                <Text style={styles.indicatorText}>
                  {isTranscribing
                    ? "Transcriptie wordt gegenereerd…"
                    : (!hasCheckedSummary || isSummaryLoading || (summaryUiInitializing && (summary || "").trim()))
                    ? isReport
                      ? "Verslag laden"
                      : "Samenvatting laden"
                    : isSummaryGenerating
                      ? isReport
                        ? "Verslag wordt gegenereerd…"
                        : "Samenvatting wordt gegenereerd…"
                      : isReport
                      ? "Verslag wordt geladen…"
                      : "Samenvatting wordt gegenereerd…"}
                </Text>
              </View>
            ) : (
              <TextInput
                ref={summaryInputRef}
                style={[styles.editor, { flex: 1 }]}
                multiline
                scrollEnabled
                value={summary}
                onChangeText={setSummaryValue}
                placeholder={isReport ? "Schrijf je verslag" : "Schrijf je samenvatting"}
                placeholderTextColor={colors.textSecondary}
                textAlignVertical="top"
                onFocus={() => {
                  setSummaryFocused(true)
                }}
                onBlur={() => {
                  setSummaryFocused(false)
                  if (skipAutoSaveSummaryOnBlurRef.current) {
                    skipAutoSaveSummaryOnBlurRef.current = false
                    return
                  }
                  const hasUnsavedChanges = (summaryValueRef.current || "") !== (savedSummaryValueRef.current || "")
                  if (hasUnsavedChanges) {
                    saveSummary()
                  }
                }}
              />
            )}
          </View>
        </View>
      )
    }
    if (tab === "transcript") {
      const isTranscriptTabShown = uiActiveTab === "transcript"
      const shouldShowTranscriptLoadingIndicator =
        isTranscriptTabShown &&
        sessionType === "audio" &&
        (
          !hasCheckedTranscriptAvailability ||
          (
            hasTranscript &&
            !isTranscribing &&
            (isTranscriptLoading || isTranscriptParsing || transcriptSegments.length === 0)
          )
        );

      const shouldShowNoTranscript =
        !isTranscribing &&
        !shouldShowTranscriptLoadingIndicator &&
        hasCheckedTranscriptAvailability &&
        !hasTranscript &&
        transcriptSegments.length === 0 &&
        sessionType !== "written_report"

      const transcriptHeader = (
        <View>
          {hasTranscript ? (
            <View style={styles.transcriptSearchBarWrap}>
              <View style={styles.transcriptSearchRow}>
                <TextInput
                  ref={transcriptSearchInputRef}
                  value={transcriptSearchText}
                  onChangeText={setTranscriptSearchText}
                  placeholder="Zoeken…"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.transcriptSearchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                  onFocus={() => setTranscriptSearchFocused(true)}
                  onBlur={() => setTranscriptSearchFocused(false)}
                />
                <View style={styles.transcriptSearchIcon}>
                  <Icon name="search" />
                </View>
              </View>
            </View>
          ) : null}
          {isTranscribing || (!isTranscribing && shouldShowTranscriptLoadingIndicator) ? (
            <View style={styles.indicatorRow}>
              <ActivityIndicator color={colors.orange} />
              <Text style={styles.indicatorText}>
                {isTranscribing ? "Transcriptie wordt gegenereerd..." : "Transcriptie laden…"}
              </Text>
            </View>
          ) : null}
        </View>
      )

      return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              <FlatList
                ref={transcriptListRef}
                scrollEnabled={!scrubbing}
                style={[styles.content, { flex: 1 }]}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingTop: spacing.small,
                  paddingBottom: 200,
                  alignItems: "stretch",
                  justifyContent: "flex-start",
                }}
                data={!isTranscribing && !shouldShowTranscriptLoadingIndicator ? transcriptSegments : []}
                keyExtractor={(segment) => segment.id}
                removeClippedSubviews={true}
                initialNumToRender={18}
                maxToRenderPerBatch={24}
                updateCellsBatchingPeriod={50}
                windowSize={8}
                ListHeaderComponent={transcriptHeader}
                ListEmptyComponent={
                  shouldShowNoTranscript
                    ? (
                      <View style={styles.emptyCenter}>
                        <Text style={styles.emptyText}>Nog geen transcriptie.</Text>
                        {(() => {
                          if (transcriptionStartStep) {
                            return (
                              <View style={styles.indicatorRow}>
                                <ActivityIndicator color={colors.orange} />
                                <Text style={styles.indicatorText}>{transcriptionStartStep}</Text>
                              </View>
                            )
                          }
                          if (transcriptionRemainingSecondsError === "offline") {
                            return (
                              <View style={styles.indicatorRow}>
                                <Text style={styles.indicatorText}>Geen internetverbinding.</Text>
                                <Pressable
                                  accessibilityRole="button"
                                  onPress={() => {
                                    vibrate()
                                    setTranscriptionRemainingSecondsError(null)
                                    setTranscriptionRemainingSeconds(null)
                                    setTranscriptionRemainingSecondsReloadId((value) => value + 1)
                                  }}
                                  style={({ pressed }) => [pressed && { opacity: 0.8 }]}
                                >
                                  <Text style={[styles.indicatorText, { color: colors.orange, marginLeft: spacing.small, fontWeight: "700" }]}>Opnieuw</Text>
                                </Pressable>
                              </View>
                            )
                          }
                          const canAfford = computeCanAffordTranscription({ remainingSeconds: transcriptionRemainingSeconds, durationMs: duration })
                          if (canAfford === null) {
                            return (
                              <View style={styles.indicatorRow}>
                                <ActivityIndicator color={colors.orange} />
                                <Text style={styles.indicatorText}>Beschikbare minuten controleren…</Text>
                              </View>
                            )
                          }
                          if (canAfford === false) {
                            return (
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => {
                                  vibrate()
                                  navigation.navigate("Subscription")
                                }}
                                style={styles.transcribeBtn}
                              >
                                <Text style={styles.transcribeText}>Mijn abonnement</Text>
                              </Pressable>
                            )
                          }
                          return (
                            <Pressable
                              accessibilityRole="button"
                              onPress={() => {
                                vibrate()
                                startTranscriptionProcess()
                              }}
                              disabled={!!transcriptionStartStep}
                              style={[styles.transcribeBtn, !!transcriptionStartStep && { opacity: 0.6 }]}
                            >
                              <Text style={styles.transcribeText}>Start transcriptie</Text>
                            </Pressable>
                          )
                        })()}
                      </View>
                    )
                    : null
                }
                scrollEventThrottle={16}
                onScroll={(event) => {
                  const y = event.nativeEvent.contentOffset?.y ?? 0
                  const next = y > 30
                  if (next !== transcriptScrolledDownRef.current) {
                    transcriptScrolledDownRef.current = next
                    setTranscriptIsScrolledDown(next)
                  }
                }}
                renderItem={({ item: segment }) => (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      try {
                        transcriptSearchInputRef.current?.blur?.()
                      } catch {}
                      setTranscriptSearchFocused(false)
                      Keyboard.dismiss()
                      seekToSecondsAbsolute(segment.start)
                    }}
                    style={[styles.segmentCard, isSecondSpeaker(segment.speaker) ? styles.segmentCardSpeakerTwo : styles.segmentCardSpeakerOne]}
                  >
                    <View style={styles.segmentHeader}>
                      <Text style={styles.segmentTime}>{formatHms(segment.start)}</Text>
                    </View>
                    <Text style={styles.segmentText}>
                      {renderHighlightedMatchText({ text: segment.text, query: transcriptSearchText, textStyle: styles.segmentText })}
                    </Text>
                  </Pressable>
                )}
              />
            {/* Scroll to top button */}
            <RNAnimated.View
              pointerEvents={isTranscriptTabShown && transcriptIsScrolledDown ? "auto" : "none"}
              style={[styles.transcriptScrollToTop, { opacity: transcriptScrollToTopOpacity }]}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  vibrate()
                  transcriptListRef.current?.scrollToOffset({ offset: 0, animated: true })
                  transcriptScrolledDownRef.current = false
                  setTranscriptIsScrolledDown(false)
                }}
                hitSlop={{ top: 16, right: 16, bottom: 16, left: 16 }}
                style={({ pressed }) => [pressed && { opacity: 0.8 }]}
              >
                <View style={styles.transcriptScrollToTopIcon}>
                  <Icon name="back" size={28} />
                </View>
              </Pressable>
            </RNAnimated.View>
            {LinearGradientMaybe ? (
              <LinearGradientMaybe
                colors={[colors.backgroundLight, "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.scrollTopGradient}
                pointerEvents="none"
              />
            ) : null}
            </View>
          </View>
      )
    }
    if (tab === "askai") {
      return (
        <View style={{ flex: 1 }}>
          <AskAiChat
            scope="conversation"
            coacheeName={coacheeName || ""}
            conversationId={conversationId || ""}
            currentTranscript={transcript || ""}
            isTranscribing={isTranscribing}
            isActive={uiActiveTab === "askai"}
            bottomPadding={safeAreaBottom + 28}
            keyboardShiftReduction={0}
          />
          {LinearGradientMaybe ? (
            <LinearGradientMaybe
              colors={[colors.backgroundLight, "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.scrollTopGradient}
              pointerEvents="none"
            />
          ) : null}
        </View>
      )
    }
    // // notes
    return (
      <View style={{ flex: 1 }}>
        <View style={[styles.content, { paddingTop: spacing.small, paddingBottom: spacing.small, zIndex: 2 }]}>
          <View style={styles.noteComposerContainer}>
            {notesSelectMode ? (
              <View style={styles.noteComposerActionsRow}>
                {selectedNoteIds.length > 0 ? (
                  <Pressable accessibilityRole="button" onPress={requestDeleteSelectedNotes} style={styles.noteComposerIconBtn}>
                    <Icon name="trash" color="#FF0001" />
                  </Pressable>
                ) : (
                  <View style={{ width: 44, height: 44 }} />
                )}
                <Pressable accessibilityRole="button" onPress={exitNotesSelectMode} style={styles.noteComposerTextBtn}>
                  <Text style={styles.noteComposerDoneText}>Gereed</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.noteComposer}>
                <TextInput
                  ref={newNoteInputRef}
                  value={newNote}
                  onChangeText={setNewNote}
                  placeholder="Nieuwe notitie..."
                  placeholderTextColor={colors.textSecondary}
                  style={styles.noteComposerInput}
                  multiline
                  scrollEnabled
                  onFocus={() => setNotesFocused(true)}
                  onBlur={() => setNotesFocused(false)}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    vibrate()
                    if (newNote.trim()) saveNewNote()
                  }}
                  disabled={!newNote.trim()}
                  style={[styles.noteComposerBtn, !newNote.trim() && { opacity: 0.5 }]}
                >
                  <Text style={styles.noteComposerBtnText}>Toevoegen</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView
            scrollEnabled={!notesSelectMode && !scrubbing}
            style={[styles.content, { flex: 1 }]}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}
            overScrollMode="never"
            keyboardDismissMode="none"
            contentContainerStyle={{ paddingTop: 0, paddingBottom: safeAreaBottom + (notesFocused ? keyboardHeight : 0) + 50 }}
          >
            {notes
              .slice()
              .sort((a, b) => b.date - a.date)
              .map((n) => {
                const isSelected = selectedNoteIds.includes(n.id)
                return (
                <View key={n.id} style={{ marginTop: spacing.small }}>
                  <Text style={styles.noteDate}>{formatDate(new Date(n.date))}</Text>
                  <View style={[styles.noteCard, { marginTop: 0 }, isSelected && styles.noteCardSelected]}>
                    {editingNoteId === n.id ? (
                      <TextInput
                        ref={editingNoteInputRef}
                        value={editingText}
                        onChangeText={setEditingText}
                        style={styles.noteEditInput}
                        multiline
                        autoFocus
                        textAlignVertical="top"
                        onFocus={() => setNotesFocused(true)}
                        onBlur={async () => {
                          await commitEditingNote(n.id, editingText)
                        }}
                      />
                    ) : (
                      <Pressable
                        onPress={() => {
                          if (notesSelectMode) {
                            toggleNoteSelection({ noteId: n.id })
                          } else {
                            blurNotesInputs()
                            setEditingNoteId(n.id)
                            setEditingText(n.text)
                          }
                        }}
                        onLongPress={() => {
                          if (!notesSelectMode) {
                            enterNotesSelectMode()
                            toggleNoteSelection({ noteId: n.id, force: true })
                          }
                        }}
                      >
                        <View style={styles.noteEditInput}>
                          <Text style={styles.noteText}>{n.text}</Text>
                        </View>
                      </Pressable>
                    )}
                  </View>
                </View>
              )
              })}
          </ScrollView>
          {LinearGradientMaybe ? (
            <LinearGradientMaybe
              colors={[colors.backgroundLight, "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.scrollTopGradient}
              pointerEvents="none"
            />
          ) : null}
        </View>
      </View>
    )
  }
  return (
    <TouchableWithoutFeedback onPress={blurAllInputs} accessible={false}>
      <View style={styles.safeArea}>
      <View style={styles.headerRow}>
        {editMode ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            style={({ pressed }) => [styles.headerEdgeButtonLeft, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.cancel}>Annuleren</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onBack} accessibilityRole="button" style={({ pressed }) => [styles.headerEdgeButtonLeft, pressed && { opacity: 0.8 }]}>
            <Icon name="back" size={28} />
          </Pressable>
        )}

        {editMode ? (
          <Pressable
            onPress={() => {
              vibrate()
              setEditMode(false)
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.headerEdgeButtonRight, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.done}>Gereed</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onMore} accessibilityRole="button" style={({ pressed }) => [styles.headerEdgeButtonRight, pressed && { opacity: 0.8 }]}>
            <Icon name="more" />
          </Pressable>
        )}
      </View>

      {sessionType === "written_report" ? (
        <View style={{ paddingHorizontal: spacing.big, marginTop: spacing.small, marginBottom: 4 }}>
          <Text style={styles.titleText} numberOfLines={1}>
            {headerTitle || "Naamloos verslag"}
          </Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: spacing.big, marginTop: spacing.small, marginBottom: 4 }}>
          <Text style={styles.titleText} numberOfLines={1}>
            {headerTitle || titleFromRoute || (sessionType === "spoken_report" ? "Naamloos verslag" : "Naamloos gesprek")}
          </Text>
        </View>
      )}

      {isAudioRecording ? (
        <View style={styles.audioPlayerOuter}>
          {/*
            We measure the natural height once (without forcing a height),
            then we can animate between 0 and that measured height.
          */}
          <RNAnimated.View
            style={[
              styles.audioPlayerAnimated,
              (() => {
                const opacity = audioPlayerVisibilityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                })

                const marginTop = audioPlayerVisibilityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, spacing.small],
                })

                if (audioPlayerHeight <= 0) {
                  return uiActiveTab === "askai"
                    ? { height: 0, opacity, marginTop }
                    : { opacity: 1, marginTop: spacing.small }
                }

                const height = audioPlayerVisibilityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, audioPlayerHeight],
                })

                return { height, opacity, marginTop }
              })(),
            ]}
            pointerEvents={uiActiveTab === "askai" ? "none" : "auto"}
          >
            <View
              onLayout={(e) => {
                const next = Math.floor(e.nativeEvent.layout.height)
                if (next > 0 && next !== audioPlayerHeight) {
                  setAudioPlayerHeight(next)
                }
              }}
            >
              {renderAudioPlayer()}
            </View>
          </RNAnimated.View>
        </View>
      ) : null}

      {/* Tabs strip: fixed height directly under the title */}
      <View style={styles.tabsContainer}>
        <ScrollView
          ref={tabsRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsRow}
          contentContainerStyle={[styles.tabsRowContent, { paddingHorizontal: spacing.big, flexGrow: 0 }]}
        >
          <View onLayout={(e) => (tabPositionsRef.current["summary"] = e.nativeEvent.layout.x)}>
            <Tab
              label={isReport ? "Verslag" : "Samenvatting"}
              active={uiActiveTab === "summary"}
              onPress={() => handleSetActiveTab("summary")}
            />
          </View>
          {isFullConversation && showTranscriptTab && <View style={{ width: spacing.small }} />}
          {isFullConversation && showTranscriptTab && (
            <View onLayout={(e) => (tabPositionsRef.current["transcript"] = e.nativeEvent.layout.x)}>
              <Tab label="Transcriptie" active={uiActiveTab === "transcript"} onPress={() => handleSetActiveTab("transcript")} />
            </View>
          )}
          {isFullConversation && showAskAiTab && <View style={{ width: spacing.small }} />}
          {isFullConversation && showAskAiTab && (
            <View onLayout={(e) => (tabPositionsRef.current["askai"] = e.nativeEvent.layout.x)}>
              <Tab label="Vraag AI" active={uiActiveTab === "askai"} onPress={() => handleSetActiveTab("askai")} />
            </View>
          )}
          <View style={{ width: spacing.small }} />
          <View onLayout={(e) => (tabPositionsRef.current["notes"] = e.nativeEvent.layout.x)}>
            <Tab label="Notities" active={uiActiveTab === "notes"} onPress={() => handleSetActiveTab("notes")} />
          </View>
        </ScrollView>
        {LinearGradientMaybe ? (
          <LinearGradientMaybe
            colors={[colors.backgroundLight, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.tabsBottomGradient}
            pointerEvents="none"
          />
        ) : null}
      </View>

      <View style={{ flex: 1, overflow: "hidden" }}>
        <RNAnimated.View
          style={{
            flex: 1,
            flexDirection: "row",
            width: screenWidth * tabsSeq.length,
            transform: [{ translateX: pagerX }],
          }}
        >
          {tabsSeq.map((tab) => (
            <View key={tab} style={{ width: screenWidth, flex: 1 }}>
              {renderTab(tab)}
            </View>
          ))}
        </RNAnimated.View>
      </View>

      {showMoreMenu && !editMode && (
        <View style={styles.menuOverlay} pointerEvents="box-none">
          <Pressable style={styles.menuBackdrop} onPress={() => setShowMoreMenu(false)} />
          <View style={styles.menuCard}>
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                vibrate()
                setShowMoreMenu(false)
                navigation.navigate("TranscriptionDetails", {
                  coacheeName,
                  title: headerTitle,
                  sessionType,
                  recordingId: conversationId,
                })
              }}
            >
              <Text style={styles.menuRowText}>Gesprek bewerken</Text>
              <Icon name="documentEdit" />
            </Pressable>
            <Pressable style={styles.menuRow} onPress={onDelete}>
              <Text style={[styles.menuRowText, { color: "#FF0001" }]}>Verwijderen</Text>
              <Icon name="trash" color="#FF0001" />
            </Pressable>
          </View>
        </View>
      )}

      {/* {showShareMenu && !editMode && (
        <View style={styles.menuOverlay} pointerEvents="box-none">
          <Pressable style={styles.menuBackdrop} onPress={() => setShowShareMenu(false)} />
          <View style={styles.menuCard}>
            <Pressable style={styles.menuRow} onPress={shareSummary}>
              <Text style={styles.menuRowText}>Deel Samenvatting</Text>
              <Icon name="shareTranscript" />
            </Pressable>
          </View>
        </View>
      )} */}

      {showDeleteWarning && (
        <View style={styles.warningOverlay} pointerEvents="box-none">
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Let op</Text>
            <Text style={styles.warningBody}>Je staat op het punt om dit gesprek (de audio-opname, transcriptie, etc.) te verwijderen.</Text>
            <View style={styles.warningActions}>
              <Pressable onPress={() => setShowDeleteWarning(false)} style={({ pressed }) => [styles.warningBtn, pressed ? styles.warningBtnPressed : null]}>
                <Text style={styles.warningCancel}>Annuleren</Text>
              </Pressable>
              <View style={styles.warningDivider} />
              <Pressable
                onPress={async () => {
                  vibrate()
                  setShowDeleteWarning(false)
                }}
                style={({ pressed }) => [styles.warningBtn, pressed ? styles.warningBtnPressed : null]}
              >
                <Text style={styles.warningContinue}>Doorgaan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {showUnsavedSummaryWarning && (
        <View style={styles.warningOverlay} pointerEvents="box-none">
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Niet opgeslagen</Text>
            <Text style={styles.warningBody}>
              {sessionType === "written_report"
                ? "Je hebt wijzigingen in het verslag die nog niet zijn opgeslagen. Wil je deze wijzigingen weggooien?"
                : "Je hebt wijzigingen in de samenvatting die nog niet zijn opgeslagen. Wil je deze wijzigingen weggooien?"}
            </Text>
            <View style={styles.warningActions}>
              <Pressable
                onPress={() => {
                  vibrate()
                  setShowUnsavedSummaryWarning(false)
                  pendingLeaveActionRef.current = null
                }}
                style={({ pressed }) => [styles.warningBtn, pressed ? styles.warningBtnPressed : null]}
              >
                <Text style={styles.warningCancel}>Blijven</Text>
              </Pressable>
              <View style={styles.warningDivider} />
              <Pressable
                onPress={() => {
                  vibrate()
                  setShowUnsavedSummaryWarning(false)
                  allowLeaveRef.current = true
                  const action = pendingLeaveActionRef.current
                  pendingLeaveActionRef.current = null
                  if (action) {
                    navigation.dispatch(action)
                  } else {
                    navigation.goBack?.()
                  }
                }}
                style={({ pressed }) => [styles.warningBtn, pressed ? styles.warningBtnPressed : null]}
              >
                <Text style={styles.warningContinue}>Weggooien</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {showDeleteNotesWarning && (
        <View style={styles.warningOverlay} pointerEvents="box-none">
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Notities verwijderen?</Text>
            <Text style={styles.warningBody}>
              Je staat op het punt om {selectedNoteIds.length} notitie{selectedNoteIds.length === 1 ? "" : "s"} te verwijderen.
            </Text>
            <View style={styles.warningActions}>
              <Pressable
                onPress={() => {
                  vibrate()
                  setShowDeleteNotesWarning(false)
                }}
                style={({ pressed }) => [styles.warningBtn, pressed ? styles.warningBtnPressed : null]}
              >
                <Text style={styles.warningCancel}>Annuleren</Text>
              </Pressable>
              <View style={styles.warningDivider} />
              <Pressable
                onPress={deleteSelectedNotes}
                style={({ pressed }) => [styles.warningBtn, pressed ? styles.warningBtnPressed : null]}
              >
                <Text style={styles.warningContinue}>Doorgaan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
 
      
    </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundLight, paddingTop: 0, justifyContent: "flex-start", alignItems: "stretch" },
  audioPlayerOuter: { paddingHorizontal: spacing.big },
  audioPlayerAnimated: { overflow: "hidden" },
  scrollTopGradient: { position: "absolute", left: 0, right: 0, top: 0, height: 36 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: safeAreaTop,
    minHeight: 66 + safeAreaTop,
    position: "relative",
  },
  headerEdgeButtonLeft: { width: 66, height: 66, alignItems: "center", justifyContent: "center" },
  headerEdgeButtonRight: { width: 66, height: 66, alignItems: "center", justifyContent: "center" },
  cancel: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary },
  done: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textOrange, fontWeight: "700" },
  coacheeName: {
    marginTop: spacing.small,
    marginBottom: spacing.small,
    paddingHorizontal: spacing.big,
    fontFamily: typography.fontFamily,
    fontSize: 22,
    color: colors.textPrimary,
  },
  playerCard: {
    backgroundColor: colors.white,
    borderRadius: radius,
    marginHorizontal: 0,
    padding: spacing.big,
    marginBottom: spacing.small,
    alignSelf: "stretch",
  },
  waveWrap: { height: 72, borderRadius: radius, overflow: "hidden", backgroundColor: colors.backgroundLight },
  wavePlayed: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: colors.textSecondary + "22" },
  waveOverlayClip: { position: "absolute", left: 0, top: 0, bottom: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 },
  waveBarsAbs: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, pointerEvents: "none" },
  barAbs: { position: "absolute", borderRadius: 2 },
  waveBars: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 6 },
  bar: { width: 3, borderRadius: 2 },
  playerRow: {
    marginTop: spacing.big,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  time: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary },
  timeLeft: { position: "absolute", left: 0 },
  controls: { flexDirection: "row", alignItems: "center" },
  controlsCenter: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  ctrlBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  playBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  tabsContainer: { paddingVertical: 2, justifyContent: "center" },
  tabsRow: { flexDirection: "row", marginTop: 0, marginBottom: 4 },
  tabsRowContent: { alignItems: "center" },
  tabsBottomGradient: { position: "absolute", left: 0, right: 0, height: 36, bottom: -36 },
  toolsRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.big },
  toolBtn: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: spacing.big },
  title: { marginTop: spacing.small, fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },
  paragraph: { marginTop: spacing.small, fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },
  editor: {
    minHeight: 240,
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    lineHeight: Math.round(typography.textSize * 1.35),
    color: colors.textPrimary,
    textAlignVertical: "top",
  },
  segmentCard: { borderRadius: radius, padding: spacing.big, borderWidth: 1, borderColor: colors.searchBar, marginTop: spacing.small },
  segmentCardSpeakerOne: { backgroundColor: colors.white },
  segmentCardSpeakerTwo: { backgroundColor: colors.backgroundLight },
  segmentHeader: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start" },
  segmentTime: { fontFamily: typography.fontFamily, fontSize: 14, color: colors.textSecondary },
  segmentText: { marginTop: spacing.small, fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },
  indicatorRow: { flexDirection: "row", alignItems: "center", padding: spacing.small },
  indicatorText: { marginLeft: spacing.small, fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary },
  summaryContainer: {
    backgroundColor: colors.white,
    borderRadius: radius,
    marginHorizontal: 0,
    paddingTop: spacing.small,
    paddingBottom: spacing.big,
    paddingHorizontal: spacing.big,
    marginBottom: spacing.small,
    alignSelf: "stretch",
  },
  summarySaveSlot: { height: 20, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginBottom: 8 },
  summaryTopRow: { height: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  summaryCancelText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary, fontWeight: "700" },
  summarySaveText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.orange, fontWeight: "700" },
  summarySaveTextDisabled: { color: colors.textSecondary, opacity: 0.5 },
  menuOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, paddingTop: safeAreaTop + 56, paddingRight: spacing.big, alignItems: "flex-end" },
  menuBackdrop: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  menuCard: { width: 220, backgroundColor: colors.white, borderRadius: radius, paddingVertical: 4 },
  menuRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.big, height: 44 },
  menuRowText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },
  warningOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.2)", alignItems: "center", justifyContent: "center", padding: spacing.big },
  warningCard: { width: "100%", maxWidth: 360, backgroundColor: colors.white, borderRadius: radius, padding: spacing.big },
  warningTitle: { fontFamily: typography.fontFamily, fontSize: 18, color: colors.textPrimary, marginBottom: spacing.small },
  warningBody: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary },
  warningActions: { marginTop: spacing.big, flexDirection: "row", alignItems: "stretch", justifyContent: "space-between", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.textSecondary + "22" },
  warningBtn: { flex: 1, height: 44, alignItems: "center", justifyContent: "center" },
  warningBtnPressed: { backgroundColor: colors.searchBar },
  warningDivider: { width: StyleSheet.hairlineWidth, height: 44, backgroundColor: colors.textSecondary + "22" },
  warningContinue: { fontFamily: typography.fontFamily, fontSize: typography.textSize, height: 44, lineHeight: 44, textAlignVertical: "center", includeFontPadding: false, color: "#FF0001", fontWeight: "700" },
  warningCancel: { fontFamily: typography.fontFamily, fontSize: typography.textSize, height: 44, lineHeight: 44, textAlignVertical: "center", includeFontPadding: false, color: colors.textSecondary },
  micContainer: { position: "absolute", left: 0, right: 0, bottom: 22 + safeAreaBottom, alignItems: "center" },
  micFab: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  titleEditInput: {
    height: 44,
    borderRadius: radius,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
    fontFamily: typography.fontFamily,
    fontSize: 22,
    color: colors.textPrimary,
    lineHeight: 26,
    textAlignVertical: "center",
  },
  titleText: {
    fontFamily: typography.fontFamily,
    fontSize: 22,
    color: colors.textPrimary,
    height: 44,
    textAlignVertical: "center",
    lineHeight: 44,
  },
  emptyCenter: { paddingVertical: 40, alignItems: "center", justifyContent: "center" },
  emptyText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary },
  bigAddBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  transcribeBtn: { marginTop: spacing.small, paddingHorizontal: spacing.big, height: 40, borderRadius: radius, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  transcribeText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.white, fontWeight: "700" },
  noteDate: { fontFamily: typography.fontFamily, fontSize: 14, color: colors.textSecondary, marginBottom: 6 },
  noteComposerContainer: { marginTop: spacing.small },
  noteComposer: { flexDirection: "row", alignItems: "flex-start" },
  noteComposerActionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  noteComposerIconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  noteComposerTextBtn: { paddingHorizontal: spacing.small },
  noteComposerDoneText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.orange, fontWeight: "700" },
  noteComposerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.searchBar,
    borderRadius: radius,
    padding: spacing.big,
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    lineHeight: 20,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    marginRight: spacing.small,
    textAlignVertical: "top",
  },
  noteComposerBtn: { height: 44, paddingHorizontal: spacing.big, borderRadius: radius, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  noteComposerDeleteBtn: { height: 44, paddingHorizontal: spacing.big, borderRadius: radius, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  noteComposerBtnText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.white, fontWeight: "700" },
  transcriptScrollToTop: {
    position: "absolute",
    right: spacing.big,
    top: spacing.small,
  },
  transcriptScrollToTopIcon: { transform: [{ rotate: "90deg" }] },
  transcriptSearchBarWrap: { paddingTop: spacing.small },
  transcriptSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderWidth: 1,
    borderColor: colors.searchBar,
    borderRadius: radius,
    paddingHorizontal: spacing.big,
    backgroundColor: colors.white,
  },
  transcriptSearchIcon: { marginLeft: spacing.small },
  transcriptSearchInput: {
    flex: 1,
    height: 44,
    paddingVertical: 0,
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    color: colors.textPrimary,
  },
  transcriptMatchHighlight: { backgroundColor: colors.orange + "33" },
  noteCard: { marginTop: spacing.small, backgroundColor: colors.white, borderRadius: radius, padding: spacing.small, borderWidth: 1, borderColor: colors.searchBar },
  noteCardSelected: { borderColor: colors.orange },
  noteText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },
  noteEditInput: {
    marginTop: 0,
    backgroundColor: "transparent",
    borderRadius: radius,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 0,
    borderColor: "transparent",
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    color: colors.textPrimary,
  },
  audioErrorText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary, textAlign: "center", paddingHorizontal: spacing.big },
  msgRow: { marginTop: spacing.small, flexDirection: "row" },
  msgBubble: { maxWidth: "85%", borderRadius: radius, paddingHorizontal: spacing.big, paddingVertical: 10, borderWidth: 0, borderColor: "transparent", flexShrink: 1 },
  msgUser: { backgroundColor: colors.white },
  msgAssistant: { backgroundColor: colors.white, borderColor: "transparent" },
  msgTextUser: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },
  msgTextAssistant: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },
  askComposer: {
    marginHorizontal: spacing.big,
    marginBottom: 8 + safeAreaBottom,
    flexDirection: "row",
    alignItems: "center",
  },
  askComposerAbs: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingLeft: spacing.big,
    paddingTop: 5,
  },
  composerGradient: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  askAiActionsRow: { paddingHorizontal: spacing.big, paddingVertical: spacing.small, flexDirection: "row", alignItems: "center", justifyContent: "flex-start" },
  askInput: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.searchBar,
    borderRadius: radius,
    paddingHorizontal: spacing.big,
    paddingVertical: 10,
    backgroundColor: colors.white,
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    color: colors.textPrimary,
    marginRight: spacing.small,
  },
  askSendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center", marginRight: spacing.big },
  askSendBtnDisabled: { backgroundColor: "#FFC29E" },
  suggestionsRow: { marginTop: spacing.small, alignItems: "center" },
  suggestionBtn: { height: 36, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.searchBar, alignSelf: "center", paddingHorizontal: spacing.big, alignItems: "center", justifyContent: "center", marginTop: spacing.small },
  suggestionText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary, textAlign: "center" },
  boldText: { fontWeight: "700" },
  assistantList: { marginTop: spacing.small },
  assistantListItemRow: { flexDirection: "row", alignItems: "flex-start" },
  assistantBullet: { marginRight: spacing.small },
  assistantListItemText: { flex: 1 },
  assistantHeader: { marginTop: spacing.small, fontWeight: "700", fontSize: typography.textSize + 2 },
  replyPreview: { marginBottom: 6, paddingHorizontal: spacing.big, paddingVertical: 8, borderRadius: radius, backgroundColor: colors.backgroundLight },
  replyPreviewOnAssistant: { backgroundColor: "rgba(255,255,255,0.15)" },
  replyBar: { position: "absolute", left: spacing.big, right: 48 + spacing.big + spacing.small, bottom: 48 + 8 + safeAreaBottom, borderRadius: radius, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.searchBar, paddingHorizontal: spacing.big, paddingVertical: 8, flexDirection: "row", alignItems: "center" },
  replyBarTextWrap: { flex: 1 },
  replyBarText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary },
  replyBarClose: { width: 32, height: 32, alignItems: "center", justifyContent: "center", marginLeft: spacing.small },
})
