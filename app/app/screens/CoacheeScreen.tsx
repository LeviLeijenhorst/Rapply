import React, { useEffect, useRef, useState } from "react"
import { View, StyleSheet, Pressable, FlatList, BackHandler, ActivityIndicator } from "react-native"
import { Text } from "./Text"
import { SearchBar } from "./SearchBar"
import { Tab } from "./Tab"
import { ListItem } from "./ListItem"
import { colors, radius, safeAreaTop, safeAreaBottom, spacing, typography } from "./constants"
import { vibrate } from "./constants"
import { Icon } from "./Icon"
import BackButton from "./BackButton"
import { AskAiChat } from "./AskAiChat"
 
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native"
import * as DocumentPicker from "expo-document-picker"
import { listFiles, readEncryptedFile, deleteDirectory, deleteFile } from "./EncryptedStorage"
import { readSummaryStatus, readTranscriptionStatus } from "@/services/transcription"

export default function CoacheeScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const coacheeName: string = route?.params?.coacheeName || ""

  const [activeTab, setActiveTab] = useState<"conversations" | "askai">("conversations")
  const [query, setQuery] = useState("")
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([])
  const [showDeleteCoacheeWarning, setShowDeleteCoacheeWarning] = useState(false)
  const [showDeleteSessionsWarning, setShowDeleteSessionsWarning] = useState(false)
  const [sessions, setSessions] = useState<
    { id: string; title: string; date: string; type: "audio" | "written_report" | "spoken_report"; duration?: string }[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [sessionBusyById, setSessionBusyById] = useState<Record<string, boolean>>({})
  const previousSelectionCountRef = useRef(0)
  const activeTabRef = useRef<"conversations" | "askai">("conversations")
  const sessionIdsRef = useRef<string[]>([])
  const statusRefreshInFlightRef = useRef(false)

  useEffect(() => {
    refreshSessions()
  }, [coacheeName])

  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  async function refreshSessionStatuses(ids: string[]) {
    if (!coacheeName.trim()) return
    if (statusRefreshInFlightRef.current) return
    statusRefreshInFlightRef.current = true
    try {
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const transcriptionStatus = await readTranscriptionStatus(coacheeName, id)
            const summaryStatus = await readSummaryStatus(coacheeName, id)
            const isBusy = transcriptionStatus === "transcribing" || summaryStatus === "generating"
            return { id, isBusy }
          } catch {
            return { id, isBusy: false }
          }
        }),
      )
      const next: Record<string, boolean> = {}
      for (const entry of entries) {
        next[entry.id] = entry.isBusy
      }
      setSessionBusyById(next)
    } finally {
      statusRefreshInFlightRef.current = false
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      refreshSessions()
      const timer = setInterval(() => {
        if (activeTabRef.current !== "conversations") return
        const ids = sessionIdsRef.current
        if (!ids.length) return
        refreshSessionStatuses(ids)
      }, 3000)
      return () => {
        clearInterval(timer)
      }
    }, [])
  )

  useFocusEffect(
    React.useCallback(() => {
      const onHardwareBack = () => {
        navigation.navigate("Welcome")
        return true
      }
      const subscription = BackHandler.addEventListener("hardwareBackPress", onHardwareBack)
      return () => {
        subscription.remove()
      }
    }, [navigation])
  )

  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
        if (e?.data?.action?.type === "RESET") return
        e.preventDefault()
        navigation.navigate("Welcome")
      })
      return () => {
        unsubscribe()
      }
    }, [navigation])
  )

  function coacheeNameToCoacheeId(coacheeName: string) {
    return coacheeName.trim().toLowerCase().replace(/\s+/g, "_")
  }

  function formatDateFromId(id: string) {
    const timestamp = Number(id)
    if (!Number.isFinite(timestamp)) return ""
    const date = new Date(timestamp)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = String(date.getFullYear()).slice(2)
    return `${day}/${month}/${year}`
  }

  function isConversationId(value: string) {
    const v = String(value || "").trim()
    if (!/^\d+$/.test(v)) return false
    const n = Number(v)
    if (!Number.isFinite(n) || n <= 0) return false
    return true
  }

  async function refreshSessions() {
    setIsLoading(true)
    try {
      if (!coacheeName.trim()) {
        setSessions([])
        setSessionBusyById({})
        sessionIdsRef.current = []
        return
      }
      const coacheeId = coacheeNameToCoacheeId(coacheeName.trim())
      const baseDirectory = `Rapply/coachees/${coacheeId}`
      const ids = await listFiles(baseDirectory)
      const sorted = ids
        .filter((id) => isConversationId(id))
        .sort((a, b) => Number(b) - Number(a))
      const items = await Promise.all(
        sorted.map(async (id) => {
          let title = id
          let type: "audio" | "written_report" | "spoken_report" = "audio"
          try {
            const t = await readEncryptedFile(`${baseDirectory}/${id}`, "title.txt.enc")
            if (t && t.trim().length > 0) title = t
          } catch {}
          try {
            const tp = await readEncryptedFile(`${baseDirectory}/${id}`, "type.txt.enc")
            const v = (tp || "").trim()
            if (v === "written_report" || v === "spoken_report") type = v as any
          } catch {}
          const date = formatDateFromId(id)
          return { id, title, date, type }
        })
      )
      setSessions(items)
      sessionIdsRef.current = sorted
      refreshSessionStatuses(sorted)
    } catch (error) {
      setSessions([])
      setSessionBusyById({})
      sessionIdsRef.current = []
    } finally {
      setIsLoading(false)
    }
  }

  function onBack() {
    vibrate()
    navigation.navigate("Welcome")
  }

  function handleSetActiveTab(next: "conversations" | "askai") {
    if (next === activeTab) return
    setShowMoreMenu(false)
    setShowAddMenu(false)
    setSelectMode(false)
    setSelectedSessionIds([])
    setActiveTab(next)
  }

  async function onPickAudioFile() {
    vibrate()
    setShowAddMenu(false)
    try {
      const pickerResult: any = await DocumentPicker.getDocumentAsync({ type: ["audio/*", "audio/mpeg"] })
      if (pickerResult?.type === "cancel" || pickerResult?.canceled) return
      const fileUri: string | undefined = pickerResult?.assets?.[0]?.uri ?? pickerResult?.uri
      if (fileUri) {
        navigation.navigate("TranscriptionDetails", { coacheeName, sessionType: "audio", sourceUri: fileUri })
        return
      }
      navigation.navigate("TranscriptionDetails", { coacheeName, sessionType: "audio" })
    } catch {
      // Ignore picker errors for now
    }
  }

  function toggleSessionSelection({ sessionId, force = false }: { sessionId: string; force?: boolean }) {
    if (!selectMode && !force) return
    if (!force) vibrate()
    setSelectedSessionIds((previous) => (previous.includes(sessionId) ? previous.filter((value) => value !== sessionId) : [...previous, sessionId]))
  }

  function enterSelectMode() {
    vibrate()
    setSelectMode(true)
    setShowMoreMenu(false)
    setSelectedSessionIds([])
  }

  useEffect(() => {
    if (selectMode && previousSelectionCountRef.current > 0 && selectedSessionIds.length === 0) {
      setSelectMode(false)
    }
    previousSelectionCountRef.current = selectedSessionIds.length
  }, [selectMode, selectedSessionIds.length])

  async function deleteSelectedSessions() {
    if (selectedSessionIds.length === 0) return
    vibrate()
    if (!coacheeName.trim()) return
    const coacheeId = coacheeNameToCoacheeId(coacheeName.trim())
    for (const id of selectedSessionIds) {
      await deleteDirectory(`Rapply/coachees/${coacheeId}/${id}`)
    }
    setSelectedSessionIds([])
    setSelectMode(false)
    refreshSessions()
  }

  function requestDeleteSelectedSessions() {
    if (selectedSessionIds.length === 0) return
    vibrate()
    setShowDeleteSessionsWarning(true)
  }

  function exitSelectMode() {
    vibrate()
    setSelectMode(false)
    setSelectedSessionIds([])
  }

  function confirmDeleteCoachee() {
    vibrate()
    setShowMoreMenu(false)
    setShowDeleteCoacheeWarning(true)
  }

  async function actuallyDeleteCoachee() {
    vibrate()
    setShowDeleteCoacheeWarning(false)
    if (coacheeName.trim()) {
      const coacheeId = coacheeNameToCoacheeId(coacheeName.trim())
      await deleteDirectory(`Rapply/coachees/${coacheeId}`)
      await deleteFile("coachees", coacheeName.trim())
    }
    navigation.goBack()
  }

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <View style={styles.safeArea}>
      <View style={styles.headerRow}>
        {selectMode ? (
          selectedSessionIds.length > 0 ? (
            <Pressable onPress={requestDeleteSelectedSessions} accessibilityRole="button" style={styles.headerButton}>
              <Icon name="trash" color="#FF0001" />
            </Pressable>
          ) : (
            <BackButton onPress={onBack} />
          )
        ) : (
          <BackButton onPress={onBack} />
        )}

        <View pointerEvents="none" style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>{coacheeName}</Text>
        </View>

        {selectMode ? (
          <Pressable onPress={exitSelectMode} accessibilityRole="button">
            <Text style={styles.selectDone}>Gereed</Text>
          </Pressable>
        ) : activeTab === "askai" ? (
          <View style={styles.headerRight} />
        ) : (
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => {
                vibrate()
                setShowMoreMenu((isVisible) => !isVisible)
                setShowAddMenu(false)
              }}
              accessibilityRole="button"
              style={styles.iconButton}
            >
              {({ pressed }) => (
                <>
                  {pressed && <View style={styles.pressOverlay} />}
                  <Icon name="more" />
                </>
              )}
            </Pressable>
            <Pressable
              onPress={() => {
                vibrate()
                setShowAddMenu((isVisible) => !isVisible)
                setShowMoreMenu(false)
              }}
              accessibilityRole="button"
              style={styles.iconButton}
              hitSlop={{ top: 16, right: 16, bottom: 16, left: 16 }}
            >
              {({ pressed }) => (
                <>
                  {pressed && <View style={styles.pressOverlay} />}
                  <Icon name="plus" color={colors.orange} />
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.tabsRow}>
        <Tab label="Gesprekken" active={activeTab === "conversations"} onPress={() => handleSetActiveTab("conversations")} />
        <View style={{ width: spacing.small }} />
        <Tab label="Vraag AI" active={activeTab === "askai"} onPress={() => handleSetActiveTab("askai")} />
      </View>

      {activeTab === "conversations" && (
        isLoading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.orange} />
          </View>
        ) : (
          <>
            {sessions.length > 0 && (
              <View style={styles.searchWrapper}>
                <SearchBar value={query} onChangeText={setQuery} placeholder="Zoeken..." />
              </View>
            )}
            <FlatList
              style={styles.list}
              contentContainerStyle={{ paddingBottom: 160 }}
              data={filteredSessions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedSessionIds.includes(item.id)
                const isBusy = !!sessionBusyById[item.id]
                return (
                  <ListItem
                    title={item.title}
                    subtitle={item.date}
                    iconName={item.type === "written_report" ? "documentEdit" : "microphoneSmall"}
                    selected={isSelected}
                    rightAccessory={
                      isBusy ? (
                        <ActivityIndicator size="small" color={colors.textSecondary} />
                      ) : item.duration ? (
                        <Text style={styles.sessionDuration}>{item.duration}</Text>
                      ) : null
                    }
                    onPress={() => {
                      if (selectMode) {
                        toggleSessionSelection({ sessionId: item.id })
                      } else {
                        vibrate()
                        navigation.navigate("Conversation", { coacheeName, title: item.title, conversationId: item.id, sessionType: item.type })
                      }
                    }}
                    onLongPress={() => {
                      if (!selectMode) {
                        enterSelectMode()
                        toggleSessionSelection({ sessionId: item.id, force: true })
                      }
                    }}
                  />
                )
              }}
              ListEmptyComponent={
                <View style={styles.emptyListWrapper}>
                  <Text style={styles.emptyText}>Nog geen gesprekken.</Text>
                </View>
              }
            />
          </>
        )
      )}

      {activeTab === "askai" && (
        <AskAiChat
          scope="coachee"
          coacheeName={coacheeName}
          isActive={activeTab === "askai"}
          bottomPadding={25}
          bottomPaddingWhenKeyboardVisible={0}
          keyboardShiftReduction={safeAreaBottom}
        />
      )}

      {/* More menu */}
      {showMoreMenu && !selectMode && activeTab === "conversations" && (
        <View style={styles.menuOverlay} pointerEvents="box-none">
          <Pressable style={styles.menuBackdrop} onPress={() => setShowMoreMenu(false)} />
          <View style={styles.menuCardMore}>
            {sessions.length > 0 && (
              <Pressable style={styles.menuRow} onPress={enterSelectMode}>
                <Text style={styles.menuRowText}>Gesprekken selecteren</Text>
                <Icon name="conversationsSelect" />
              </Pressable>
            )}
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                vibrate()
                setShowMoreMenu(false)
                navigation.navigate("CoacheeEdit", { coacheeName })
              }}
            >
              <Text style={styles.menuRowText}>Coachee bewerken</Text>
              <Icon name="userEdit" />
            </Pressable>
            <Pressable style={styles.menuRow} onPress={confirmDeleteCoachee}>
              <Text style={[styles.menuRowText, { color: "#FF0001" }]}>Coachee verwijderen</Text>
              <Icon name="userMinus" color="#FF0001" />
            </Pressable>
          </View>
        </View>
      )}

      {/* Delete selected sessions warning */}
      {showDeleteSessionsWarning && (
        <View style={styles.warningOverlay} pointerEvents="box-none">
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Gesprekken verwijderen?</Text>
            <Text style={styles.warningBody}>
              Je staat op het punt om {selectedSessionIds.length} gesprek{selectedSessionIds.length === 1 ? "" : "ken"} te verwijderen.
            </Text>
            <View style={styles.warningActions}>
              <Pressable
                onPress={() => {
                  vibrate()
                  setShowDeleteSessionsWarning(false)
                }}
                style={({ pressed }) => [styles.warningButton, pressed ? styles.warningButtonPressed : null]}
              >
                <Text style={styles.warningCancel}>Annuleren</Text>
              </Pressable>
              <View style={styles.warningDivider} />
              <Pressable
                onPress={() => {
                  deleteSelectedSessions()
                  setShowDeleteSessionsWarning(false)
                }}
                style={({ pressed }) => [styles.warningButton, pressed ? styles.warningButtonPressed : null]}
              >
                <Text style={styles.warningContinue}>Doorgaan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Add menu */}
      {showAddMenu && !selectMode && activeTab === "conversations" && (
        <View style={styles.menuOverlay} pointerEvents="box-none">
          <Pressable style={styles.menuBackdrop} onPress={() => setShowAddMenu(false)} />
          <View style={styles.menuCardAdd}>
            <Pressable style={styles.menuRow} onPress={onPickAudioFile}>
              <Text style={styles.menuRowText}>MP3 bestand</Text>
              <Icon name="addAudio" />
            </Pressable>
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                vibrate()
                setShowAddMenu(false)
                navigation.navigate("Recording", { coacheeName, mode: "conversation" })
              }}
            >
              <Text style={styles.menuRowText}>Gesprek opnemen</Text>
              <Icon name="microphoneSmall" />
            </Pressable>
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                vibrate()
                setShowAddMenu(false)
                navigation.navigate("Recording", { coacheeName, mode: "spoken_report" })
              }}
            >
              <Text style={styles.menuRowText}>Gesproken verslag</Text>
              <Icon name="microphoneSmall" />
            </Pressable>
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                vibrate()
                setShowAddMenu(false)
                navigation.navigate("WrittenReport", { coacheeName })
              }}
            >
              <Text style={styles.menuRowText}>Geschreven verslag</Text>
              <Icon name="documentEdit" />
            </Pressable>
          </View>
        </View>
      )}

      {/* Delete coachee warning */}
      {showDeleteCoacheeWarning && (
        <View style={styles.warningOverlay} pointerEvents="box-none">
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Coachee verwijderen?</Text>
            <Text style={styles.warningBody}>Je staat op het punt om {coacheeName} te verwijderen</Text>
            <View style={styles.warningActions}>
              <Pressable
                onPress={() => setShowDeleteCoacheeWarning(false)}
                style={({ pressed }) => [styles.warningButton, pressed ? styles.warningButtonPressed : null]}
              >
                <Text style={styles.warningCancel}>Annuleren</Text>
              </Pressable>
              <View style={styles.warningDivider} />
              <Pressable
                onPress={actuallyDeleteCoachee}
                style={({ pressed }) => [styles.warningButton, pressed ? styles.warningButtonPressed : null]}
              >
                <Text style={styles.warningContinue}>Doorgaan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundLight, paddingTop: Math.max(0, safeAreaTop + 4) },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: spacing.big,
  },
  headerButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", margin: 0 },
  headerRight: { flexDirection: "row", alignItems: "center" },
  iconButton: { width: 66, height: 66, alignItems: "center", justifyContent: "center", overflow: "hidden", margin: 0 },
  pressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.pressedOverlay,
  },
  selectHeaderRight: { flexDirection: "row", alignItems: "center" },
  selectDone: {
    marginLeft: spacing.small,
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    color: colors.orange,
    fontWeight: "700",
  },
  headerTitleWrap: { position: "absolute", left: 0, right: 0, top: 0, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: typography.fontFamily, fontSize: 22, color: colors.textPrimary },
  searchWrapper: {
    paddingHorizontal: spacing.big,
    marginBottom: spacing.small,
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.big,
    marginTop: spacing.small,
    marginBottom: spacing.small,
  },
  list: {
    flex: 1,
    paddingHorizontal: spacing.big,
  },
  sessionDuration: {
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    color: colors.textPrimary,
  },
  emptyListWrapper: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    color: colors.textSecondary,
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: safeAreaTop + 50,
    paddingRight: spacing.big,
    alignItems: "flex-end",
  },
  menuBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  menuCardMore: {
    width: 220,
    backgroundColor: colors.white,
    borderRadius: radius,
    paddingVertical: 4,
  },
  menuCardAdd: {
    width: 220,
    backgroundColor: colors.white,
    borderRadius: radius,
    paddingVertical: 4,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.big,
    height: 44,
  },
  menuRowText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    color: colors.textPrimary,
  },
  warningOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.big,
  },
  warningCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius,
    padding: spacing.big,
  },
  warningTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  warningBody: {
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    color: colors.textSecondary,
  },
  warningActions: {
    marginTop: spacing.big,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.textSecondary + "22",
  },
  warningButton: { flex: 1, height: 44, alignItems: "center", justifyContent: "center" },
  warningButtonPressed: { backgroundColor: colors.searchBar },
  warningDivider: { width: StyleSheet.hairlineWidth, height: 44, backgroundColor: colors.textSecondary + "22" },
  warningContinue: {
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    height: 44,
    lineHeight: 44,
    textAlignVertical: "center",
    includeFontPadding: false,
    color: "#FF0001",
    fontWeight: "700",
  },
  warningCancel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    height: 44,
    lineHeight: 44,
    textAlignVertical: "center",
    includeFontPadding: false,
    color: colors.textSecondary,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  
})
