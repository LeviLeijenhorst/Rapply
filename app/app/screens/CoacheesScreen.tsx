import React, { FC, useEffect, useMemo, useRef, useState } from "react"
import { View, Pressable, StyleSheet, ActivityIndicator, FlatList } from "react-native"
import { Text } from "./Text"
import { SearchBar } from "./SearchBar"
import { Tab } from "./Tab"
import { ListItem } from "./ListItem"
import { Icon } from "./Icon"
import { colors, radius, safeAreaTop, spacing, typography, vibrate } from "./constants"
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native"
import { listFiles, readEncryptedFile, deleteDirectory } from "./EncryptedStorage"
import * as DocumentPicker from "expo-document-picker"
import { readSummaryStatus, readTranscriptionStatus } from "@/services/transcription"


type ListType = "coachees" | "looseRecordings"

const headerAddButtonSize = 66

export const CoacheesScreen: FC = function CoacheesScreen() {
  const [listType, setListType] = useState<ListType>("coachees")
  const [query, setQuery] = useState("")
  const [coachees, setCoachees] = useState<string[]>([])
  const [looseRecordings, setLooseRecordings] = useState<string[]>([])
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const [looseRecordingIds, setLooseRecordingIds] = useState<string[]>([])
  const [looseRecordingBusyById, setLooseRecordingBusyById] = useState<Record<string, boolean>>({})
  const [showDeleteLooseWarning, setShowDeleteLooseWarning] = useState(false)
  const [looseSelectMode, setLooseSelectMode] = useState(false)
  const [selectedLooseIndices, setSelectedLooseIndices] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const looseRecordingIdsRef = useRef<string[]>([])
  const listTypeRef = useRef<ListType>("coachees")
  const statusRefreshInFlightRef = useRef(false)

  const filteredCoachees = useMemo(
    () => coachees.filter((n) => n.toLowerCase().includes(query.trim().toLowerCase())),
    [coachees, query],
  )
  const filteredLooseIndices = useMemo(
    () =>
      looseRecordings
        .map((title, index) => ({ title, index }))
        .filter((item) => item.title.toLowerCase().includes(query.trim().toLowerCase()))
        .map((item) => item.index),
    [looseRecordings, query],
  )
  const filteredLooseTitles = useMemo(
    () => filteredLooseIndices.map((i) => looseRecordings[i]),
    [filteredLooseIndices, looseRecordings],
  )
  const filteredLooseItems = useMemo(
    () =>
      filteredLooseIndices.map((absoluteIndex) => {
        const conversationId = looseRecordingIds[absoluteIndex]
        const title = looseRecordings[absoluteIndex]
        return { absoluteIndex, conversationId, title }
      }),
    [filteredLooseIndices, looseRecordingIds, looseRecordings],
  )
  const filteredSelectedIndices = useMemo(
    () => filteredLooseIndices.map((i, rel) => (selectedLooseIndices.includes(i) ? rel : -1)).filter((v) => v >= 0),
    [filteredLooseIndices, selectedLooseIndices],
  )

  useEffect(() => {
    looseRecordingIdsRef.current = looseRecordingIds
  }, [looseRecordingIds])

  useEffect(() => {
    listTypeRef.current = listType
  }, [listType])

  async function refreshLooseRecordingStatuses(ids: string[]) {
    if (statusRefreshInFlightRef.current) return
    statusRefreshInFlightRef.current = true
    try {
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const transcriptionStatus = await readTranscriptionStatus(undefined, id)
            const summaryStatus = await readSummaryStatus(undefined, id)
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
      setLooseRecordingBusyById(next)
    } finally {
      statusRefreshInFlightRef.current = false
    }
  }

  function refreshData() {
    setLoading(true)

    const coacheesPromise = listFiles("coachees").then((names) => setCoachees(names))

    const loosePromise = listFiles("CoachScribe/coachees/loose_recordings").then(async (ids) => {
      const orderedIds = [...ids].reverse()
      setLooseRecordingIds(orderedIds)
      const titles = await Promise.all(
        orderedIds.map(async (id) => {
          try {
            const title = await readEncryptedFile(
              `CoachScribe/coachees/loose_recordings/${id}`,
              "title.txt.enc",
            )
            return title || id
          } catch {
            return id
          }
        }),
      )
      setLooseRecordings(titles)
      await refreshLooseRecordingStatuses(orderedIds)
    })

    Promise.all([coacheesPromise, loosePromise]).finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    refreshData()
  }, [])

  function formatDateFromId(id: string) {
    const timestamp = Number(id)
    if (!Number.isFinite(timestamp)) return ""
    const date = new Date(timestamp)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = String(date.getFullYear()).slice(2)
    return `${day}/${month}/${year}`
  }

  useFocusEffect(
    React.useCallback(() => {
      if (route?.params?.initialList === "looseRecordings") {
        setListType("looseRecordings")
        navigation.setParams?.({ initialList: undefined })
      }
      refreshData()
      const timer = setInterval(() => {
        if (listTypeRef.current !== "looseRecordings") return
        const ids = looseRecordingIdsRef.current
        if (!ids.length) return
        refreshLooseRecordingStatuses(ids)
      }, 3000)
      return () => clearInterval(timer)
    }, []),
  )

  useEffect(() => {
    if (listType !== "looseRecordings") {
      setLooseSelectMode(false)
      setSelectedLooseIndices([])
      setShowDeleteLooseWarning(false)
      setShowAddMenu(false)
    }
  }, [listType])

  useEffect(() => {
    if (looseSelectMode && selectedLooseIndices.length === 0) {
      setLooseSelectMode(false)
    }
  }, [looseSelectMode, selectedLooseIndices.length])

  async function onPickAudioFile() {
    vibrate()
    setShowAddMenu(false)
    try {
      const pickerResult: any = await DocumentPicker.getDocumentAsync({ type: ["audio/*", "audio/mpeg"] })
      if (pickerResult?.type === "cancel" || pickerResult?.canceled) return
      const fileUri: string | undefined = pickerResult?.assets?.[0]?.uri ?? pickerResult?.uri
      if (fileUri) {
        navigation.navigate("TranscriptionDetails", { sessionType: "audio", sourceUri: fileUri })
        return
      }
      navigation.navigate("TranscriptionDetails", { sessionType: "audio" })
    } catch {
      // Ignore picker errors for now
    }
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Coachees</Text>
        <View style={styles.headerRight}>
          {listType === "looseRecordings" && looseSelectMode && (
            <Pressable
              onPress={() => {
                vibrate()
                setShowDeleteLooseWarning(true)
              }}
              accessibilityRole="button"
              style={styles.iconButton}
            >
              <Icon name="trash" color="#FF0001" />
            </Pressable>
          )}
          <Pressable
            style={styles.addButton}
            onPress={() => {
              vibrate()
              if (listType === "looseRecordings") {
                setShowAddMenu((isVisible) => !isVisible)
                setLooseSelectMode(false)
                setSelectedLooseIndices([])
                setShowDeleteLooseWarning(false)
              } else {
                setLooseSelectMode(false)
                setSelectedLooseIndices([])
                setShowDeleteLooseWarning(false)
                navigation.navigate("AddCoachee")
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Add coachee"
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
      </View>

      <View style={styles.container}>
        <View style={styles.contentWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={listType === "coachees" ? "Zoek tussen coachees" : "Zoek tussen losse opnames"}
          />

          <View style={styles.segmentRow}>
            <Tab label="Coachees" active={listType === "coachees"} onPress={() => setListType("coachees")} />
            <View style={{ width: spacing.small }} />
            <Tab label="Losse opnames" active={listType === "looseRecordings"} onPress={() => setListType("looseRecordings")} />
          </View>

          {listType === "coachees" ? (
            <FlatList
              data={filteredCoachees}
              keyExtractor={(item, index) => `${item}__${index}`}
              contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item }) => (
                <ListItem
                  title={item}
                  iconName="profileCircle"
                  onPress={() => {
                    vibrate()
                    navigation.navigate("CoacheeDetail", { coacheeName: item })
                  }}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>
                    {coachees.length === 0 && query.trim().length === 0
                      ? loading
                        ? ""
                        : "Je hebt nog geen coachees."
                      : `Geen resultaten voor "${query}"`}
                  </Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={filteredLooseItems}
              keyExtractor={(item) => String(item.conversationId || item.absoluteIndex)}
              contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item }) => {
                const isSelected = selectedLooseIndices.includes(item.absoluteIndex)
                const isBusy = item.conversationId ? !!looseRecordingBusyById[item.conversationId] : false
                return (
                  <ListItem
                    title={item.title || ""}
                    subtitle={item.conversationId ? formatDateFromId(item.conversationId) : ""}
                    iconName="microphoneSmall"
                    selected={isSelected}
                    rightAccessory={isBusy ? <ActivityIndicator size="small" color={colors.textSecondary} /> : null}
                    onPress={() => {
                      vibrate()
                      if (!looseSelectMode) {
                        if (!item.conversationId) return
                        navigation.navigate("Conversation", {
                          title: item.title,
                          conversationId: item.conversationId,
                          sessionType: "audio",
                        })
                        return
                      }
                      setSelectedLooseIndices((prev) =>
                        prev.includes(item.absoluteIndex)
                          ? prev.filter((i) => i !== item.absoluteIndex)
                          : [...prev, item.absoluteIndex],
                      )
                    }}
                    onLongPress={() => {
                      vibrate()
                      if (!looseSelectMode) {
                        setLooseSelectMode(true)
                        setSelectedLooseIndices([item.absoluteIndex])
                      } else {
                        setSelectedLooseIndices((prev) =>
                          prev.includes(item.absoluteIndex)
                            ? prev.filter((i) => i !== item.absoluteIndex)
                            : [...prev, item.absoluteIndex],
                        )
                      }
                    }}
                  />
                )
              }}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>
                    {looseRecordings.length === 0 && query.trim().length === 0
                      ? loading
                        ? ""
                        : "Nog geen losse opnames."
                      : `Geen resultaten voor "${query}"`}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>

      {showAddMenu && listType === "looseRecordings" && !looseSelectMode && (
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
                navigation.navigate("Recording", { mode: "conversation" })
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
                navigation.navigate("Recording", { mode: "spoken_report" })
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
                navigation.navigate("WrittenReport")
              }}
            >
              <Text style={styles.menuRowText}>Geschreven verslag</Text>
              <Icon name="documentEdit" />
            </Pressable>
          </View>
        </View>
      )}

      {showDeleteLooseWarning && (
        <View pointerEvents="box-none" style={styles.warningOverlay}>
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Opname verwijderen?</Text>
            <Text style={styles.warningBody}>Je staat op het punt om {selectedLooseIndices.length} losse opname{selectedLooseIndices.length === 1 ? "" : "n"} te verwijderen.</Text>
            <View style={styles.warningActions}>
              <Pressable
                onPress={() => {
                  vibrate()
                  setShowDeleteLooseWarning(false)
                }}
                style={({ pressed }) => [styles.warningButton, pressed ? styles.warningButtonPressed : null]}
              >
                <Text style={styles.warningCancel}>Annuleren</Text>
              </Pressable>
              <View style={styles.warningDivider} />
              <Pressable
                onPress={async () => {
                  vibrate()
                  const targets = selectedLooseIndices
                    .map((i) => looseRecordingIds[i])
                    .filter((v) => !!v)
                  for (const id of targets) {
                    await deleteDirectory(`CoachScribe/coachees/loose_recordings/${id}`)
                  }
                  setShowDeleteLooseWarning(false)
                  setSelectedLooseIndices([])
                  refreshData()
                }}
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
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    paddingTop: safeAreaTop,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.big,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 0,
    paddingTop: spacing.small,
    paddingBottom: spacing.big,
  },
  headerTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 22,
    color: colors.textPrimary,
    marginLeft: spacing.big,
  },
  headerRight: { flexDirection: "row", alignItems: "center" },
  iconButton: { margin: 0 },
  addButton: {
    width: headerAddButtonSize,
    height: headerAddButtonSize,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    margin: 0,
  },
  pressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.pressedOverlay,
  },
  contentWrap: {
    flex: 1,
  },
  segmentRow: {
    flexDirection: "row",
    marginTop: spacing.big,
    marginBottom: spacing.big,
  },
  emptyWrap: { paddingVertical: 32, alignItems: "center" },
  emptyText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    color: colors.textSecondary,
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
    borderRadius: 12,
    padding: spacing.big,
  },
  warningTitle: { fontFamily: typography.fontFamily, fontSize: 18, color: colors.textPrimary, marginBottom: spacing.small },
  warningBody: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary },
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
  warningContinue: { fontFamily: typography.fontFamily, fontSize: typography.textSize, height: 44, lineHeight: 44, textAlignVertical: "center", includeFontPadding: false, color: "#FF0001", fontWeight: "700" },
  warningCancel: { fontFamily: typography.fontFamily, fontSize: typography.textSize, height: 44, lineHeight: 44, textAlignVertical: "center", includeFontPadding: false, color: colors.textSecondary },
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
})

export default CoacheesScreen
