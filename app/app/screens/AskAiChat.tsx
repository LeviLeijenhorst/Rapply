import React, { useEffect, useMemo, useRef, useState } from "react"
import { View, StyleSheet, Pressable, ScrollView, TextInput, Keyboard, ActivityIndicator, Animated as RNAnimated, Modal } from "react-native"
import { Text } from "./Text"
import { Tab } from "./Tab"
import { Icon } from "./Icon"
import { colors, radius, safeAreaBottom, spacing, typography, vibrate } from "./constants"
import { askAssistant, loadAskAiHistory, loadCoacheeAskAiHistory, loadLatestConversationTranscriptForCoachee, loadSummariesForCoachee, saveAskAiHistory, saveCoacheeAskAiHistory } from "@/services/askai"
import { logger } from "@/utils/logger"

type AskAiChatScope = "conversation" | "coachee"
type AskAiChatItem = { id: string; role: "assistant" | "user"; text: string; date: number; replyToId?: string; replyToText?: string; replyToRole?: "assistant" | "user" }

const LinearGradientMaybe = (() => {
  try {
    return require("expo-linear-gradient").LinearGradient
  } catch {
    return null
  }
})()

export function AskAiChat(props: {
  scope: AskAiChatScope
  coacheeName: string
  conversationId?: string
  currentTranscript?: string
  isTranscribing?: boolean
  isActive?: boolean
  bottomPadding?: number
  bottomPaddingWhenKeyboardVisible?: number
  keyboardShiftReduction?: number
}) {
  const { scope, coacheeName, conversationId, currentTranscript, isTranscribing, isActive, bottomPadding, bottomPaddingWhenKeyboardVisible, keyboardShiftReduction } = props

  const resolvedCoacheeName = coacheeName.trim() ? coacheeName : "loose_recordings"

  const [messages, setMessages] = useState<AskAiChatItem[]>([])
  const [inputText, setInputText] = useState("")
  const [isBusy, setIsBusy] = useState(false)
  const [showClearWarning, setShowClearWarning] = useState(false)

  const requestIdRef = useRef(0)
  const scrollRef = useRef<ScrollView | null>(null)

  const keyboardAnim = useRef(new RNAnimated.Value(0)).current
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [keyboardIsVisible, setKeyboardIsVisible] = useState(false)

  const resolvedBottomPadding = typeof bottomPadding === "number" ? Math.max(0, bottomPadding) : safeAreaBottom
  const resolvedBottomPaddingWhenKeyboardVisible =
    typeof bottomPaddingWhenKeyboardVisible === "number" ? Math.max(0, bottomPaddingWhenKeyboardVisible) : resolvedBottomPadding
  const resolvedKeyboardShiftReduction = typeof keyboardShiftReduction === "number" ? Math.max(0, keyboardShiftReduction) : 0

  const resolvedBottomPaddingNow = keyboardIsVisible ? resolvedBottomPaddingWhenKeyboardVisible : resolvedBottomPadding

  const resolvedCurrentTranscript = String(currentTranscript || "").trim()
  const conversationTranscriptIsAvailable = scope !== "conversation" ? true : !!resolvedCurrentTranscript
  const composerIsDisabled = !!isTranscribing
  const composerOpacity = composerIsDisabled ? 0.5 : 1
  const canSend = !!inputText.trim() && !isBusy && !composerIsDisabled

  const storageKey = useMemo(() => {
    if (scope === "coachee") return `coachee:${resolvedCoacheeName}`
    return `conversation:${resolvedCoacheeName}:${conversationId || ""}`
  }, [scope, resolvedCoacheeName, conversationId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (scope === "conversation") {
        const id = String(conversationId || "").trim()
        if (!id) {
          setMessages([])
          return
        }
        const existing = await loadAskAiHistory(resolvedCoacheeName, id)
        if (!cancelled) setMessages(existing as any)
        return
      }
      if (!coacheeName.trim()) {
        setMessages([])
        return
      }
      const existing = await loadCoacheeAskAiHistory(resolvedCoacheeName)
      if (!cancelled) setMessages(existing as any)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [storageKey, scope, resolvedCoacheeName, coacheeName, conversationId])

  useEffect(() => {
    if (!isActive) return
    if (!messages.length) return
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true })
    }, 60)
    return () => clearTimeout(t)
  }, [messages.length, isActive])

  useEffect(() => {
    const onShow = (e: any) => {
      if (!isActive) return
      const h = e?.endCoordinates?.height ?? 0
      const height = Math.max(0, h)
      const shift = Math.max(0, height - resolvedKeyboardShiftReduction)
      setKeyboardIsVisible(true)
      setKeyboardHeight(shift)
      RNAnimated.timing(keyboardAnim, { toValue: shift, duration: 220, useNativeDriver: false }).start()
    }
    const onHide = () => {
      if (!isActive) return
      setKeyboardIsVisible(false)
      setKeyboardHeight(0)
      RNAnimated.timing(keyboardAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start()
    }
    const showSub = Keyboard.addListener("keyboardDidShow", onShow as any)
    const hideSub = Keyboard.addListener("keyboardDidHide", onHide as any)
    return () => {
      showSub.remove?.()
      hideSub.remove?.()
    }
  }, [keyboardAnim, isActive, resolvedKeyboardShiftReduction])

  useEffect(() => {
    if (isActive) return
    setKeyboardIsVisible(false)
    setKeyboardHeight(0)
    RNAnimated.timing(keyboardAnim, { toValue: 0, duration: 0, useNativeDriver: false }).start()
  }, [isActive, keyboardAnim])

  async function persist(next: AskAiChatItem[]) {
    if (scope === "conversation") {
      const id = String(conversationId || "").trim()
      if (!id) return
      await saveAskAiHistory(resolvedCoacheeName, id, next as any)
      return
    }
    if (!coacheeName.trim()) return
    await saveCoacheeAskAiHistory(resolvedCoacheeName, next as any)
  }

  async function sendPrompt(promptText?: string) {
    try {
      logger.debug("[AskAiChat] sendPrompt press", {
        scope,
        hasCoacheeName: !!coacheeName.trim(),
        conversationId: String(conversationId || ""),
        hasPromptText: typeof promptText === "string" && !!promptText.trim(),
        inputLength: inputText.length,
        isBusy,
        composerIsDisabled,
        conversationTranscriptIsAvailable,
      })
    } catch {}
    if (scope === "conversation" && !String(conversationId || "").trim()) return
    if (scope === "coachee" && !coacheeName.trim()) return
    const text = (promptText ?? inputText).trim()
    if (!text) return
    if (isBusy) return
    if (composerIsDisabled) return
    if (scope === "conversation" && !conversationTranscriptIsAvailable) {
      const messageForUser = "Vraag AI werkt pas zodra er een transcriptie is."
      const errorMessage: AskAiChatItem = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        text: messageForUser,
        date: Date.now(),
      }
      const next2 = [...messages, errorMessage]
      setMessages(next2)
      try {
        await persist(next2)
      } catch {}
      return
    }

    requestIdRef.current = requestIdRef.current + 1
    const requestId = requestIdRef.current
    setIsBusy(true)
    setInputText("")

    const userMessage: AskAiChatItem = {
      id: `${Date.now()}-user`,
      role: "user",
      text,
      date: Date.now(),
    }

    const next1 = [...messages, userMessage]
    setMessages(next1)
    try {
      await persist(next1)
    } catch {}

    const assistantId = `${Date.now()}-assistant`
    const placeholder: AskAiChatItem = { id: assistantId, role: "assistant", text: "", date: Date.now() }
    setMessages((prev) => [...prev, placeholder])

    try {
      const coacheeLatestTranscript =
        scope === "coachee"
          ? await loadLatestConversationTranscriptForCoachee(resolvedCoacheeName)
          : null
      const latestConversationId = coacheeLatestTranscript?.conversationId
      const previousSummaries =
        scope === "conversation" && String(conversationId || "").trim()
          ? await loadSummariesForCoachee(resolvedCoacheeName, String(conversationId))
          : await loadSummariesForCoachee(resolvedCoacheeName, latestConversationId)

      const final = await askAssistant({
        coacheeName: resolvedCoacheeName,
        currentConversationId: scope === "conversation" ? String(conversationId) : latestConversationId || null,
        currentTranscript: scope === "conversation" ? String(currentTranscript || "") : String(coacheeLatestTranscript?.transcript || ""),
        userQuestion: text,
        previousSummaries,
      })

      if (requestIdRef.current === requestId) {
        const replacePlaceholder = (arr: AskAiChatItem[]) => arr.map((x) => (x.id === assistantId ? { ...x, text: final } : x))
        setMessages((prev) => replacePlaceholder(prev))
        try {
          await persist(replacePlaceholder([...next1, placeholder]))
        } catch {}
      }
    } catch (error: any) {
      const errorText = String(error?.message || error || "").trim()
      const messageForUser = __DEV__ && errorText ? errorText : "Er ging iets mis. Probeer het later opnieuw."
      const errorMessage: AskAiChatItem = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        text: messageForUser,
        date: Date.now(),
      }
      const next2 = [...next1, errorMessage]
      setMessages(next2)
      try {
        await persist(next2)
      } catch {}
    } finally {
      if (requestIdRef.current === requestId) setIsBusy(false)
    }
  }

  async function clearChat() {
    if (scope === "coachee" && !coacheeName.trim()) return
    if (isBusy) {
      requestIdRef.current = requestIdRef.current + 1
      setIsBusy(false)
    }
    setMessages([])
    try {
      await persist([])
    } catch {}
  }

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
                <Text style={[styles.msgTextAssistant, styles.assistantListItemText]}>{renderBoldInline(it, styles.msgTextAssistant)}</Text>
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

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.actionsRow}>
        <Tab label="Berichten wissen" active={false} onPress={() => setShowClearWarning(true)} disabled={messages.length === 0} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.content}
        contentContainerStyle={{
          paddingTop: spacing.small,
          paddingBottom: 120 + resolvedBottomPaddingNow + (keyboardIsVisible ? keyboardHeight : 0),
          alignItems: "stretch",
          justifyContent: "flex-start",
        }}
        keyboardShouldPersistTaps="always"
      >
        {!isTranscribing && scope === "conversation" && !conversationTranscriptIsAvailable ? (
          <View style={styles.indicatorRow}>
            <Text style={styles.indicatorText}>Vraag AI werkt pas zodra er een transcriptie is.</Text>
          </View>
        ) : null}

        {isTranscribing ? (
          <View style={styles.indicatorRow}>
            <ActivityIndicator color={colors.orange} />
            <Text style={styles.indicatorText}>Transcriptie wordt gegenereerd. AI beschikbaar zodra de transcriptie klaar is.</Text>
          </View>
        ) : null}

        {messages.map((m) => {
          if (m.role === "assistant" && !m.text.trim()) return null
          const isUser = m.role === "user"
          return (
            <View key={m.id} style={[styles.msgRow, isUser ? { justifyContent: "flex-end" } : { justifyContent: "flex-start" }]}>
              <Pressable
                style={[styles.msgBubble, isUser ? styles.msgUser : styles.msgAssistant]}
              >
                {isUser ? <Text style={styles.msgTextUser}>{m.text}</Text> : <View>{renderAssistantMessageText(m.text)}</View>}
              </Pressable>
            </View>
          )
        })}

        {isBusy && !isTranscribing && messages.some((mm) => mm.role === "assistant" && !mm.text.trim()) ? (
          <View style={styles.indicatorRow}>
            <ActivityIndicator color={colors.textSecondary} />
            <Text style={styles.indicatorText}>Aan het nadenken...</Text>
          </View>
        ) : null}

        {messages.length === 0 && !composerIsDisabled ? (
          <View style={styles.suggestionsRow}>
            {(
              scope === "conversation"
                ? [
                    "Maak een gespreksplan voor het volgende gesprek.",
                    "Wat is er in dit gesprek besproken?",
                    "Welke actiepunten zijn er in dit gesprek opgesteld?",
                    "Wat zou ik in dit gesprek beter kunnen hebben gedaan?",
                  ]
                : [
                    "Creëer een gespreksplan.",
                    "Wat zijn de besproken thema's?",
                    "Wat zijn de kernwoorden uit de gesprekken?",
                    "Vat de belangrijkste patronen over alle gesprekken samen.",
                  ]
            ).map((prompt) => (
              <Pressable
                key={prompt}
                onPress={() => {
                  try {
                    logger.debug("[AskAiChat] prompt pressed", { prompt })
                  } catch {}
                  sendPrompt(prompt)
                }}
                style={({ pressed }) => [styles.suggestionBtn, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.suggestionText}>{prompt}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Composer */}
      <RNAnimated.View
        style={[
          styles.composerAbs,
          { transform: [{ translateY: RNAnimated.multiply(keyboardAnim, -1) }] },
          { bottom: 0, paddingBottom: resolvedBottomPaddingNow },
        ]}
      >
        {LinearGradientMaybe ? (
          <LinearGradientMaybe
            colors={["transparent", colors.backgroundLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.composerBackgroundGradient}
            pointerEvents="none"
          />
        ) : null}
        <TextInput
          style={[styles.input, { opacity: composerOpacity }]}
          placeholder="Stel een vraag…"
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          editable={!composerIsDisabled}
          multiline
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            try {
              logger.debug("[AskAiChat] send button pressed", { isBusy, composerIsDisabled, inputLength: inputText.length })
            } catch {}
            if (isBusy) {
              vibrate()
              requestIdRef.current = requestIdRef.current + 1
              setIsBusy(false)
            } else {
              sendPrompt()
            }
          }}
          disabled={composerIsDisabled || (!inputText.trim() && !isBusy)}
          style={[
            styles.sendBtn,
            { opacity: composerOpacity },
            composerIsDisabled || (!inputText.trim() && !isBusy) ? styles.sendBtnDisabled : null,
          ]}
        >
          <Icon name={isBusy ? "stop" : "send"} color={colors.white} size={isBusy ? 25 : undefined} />
        </Pressable>
      </RNAnimated.View>

      <Modal
        visible={showClearWarning}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setShowClearWarning(false)}
      >
        <View style={styles.warningOverlayFullScreen}>
          <View style={styles.warningCard}>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Berichten wissen</Text>
              <Text style={styles.warningBody}>Weet je zeker dat je alle AI-berichten wilt wissen?</Text>
            </View>
            <View style={styles.warningActions}>
              <Pressable onPress={() => setShowClearWarning(false)} style={({ pressed }) => [styles.warningBtn, pressed ? styles.warningBtnPressed : null]}>
                <Text style={styles.warningCancel}>Annuleren</Text>
              </Pressable>
              <View style={styles.warningDivider} />
              <Pressable
                onPress={async () => {
                  vibrate()
                  setShowClearWarning(false)
                  await clearChat()
                }}
                style={({ pressed }) => [styles.warningBtn, pressed ? styles.warningBtnPressed : null]}
              >
                <Text style={styles.warningContinue}>Doorgaan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  actionsRow: { paddingHorizontal: spacing.big, paddingVertical: spacing.small, flexDirection: "row", alignItems: "center", justifyContent: "flex-start" },
  content: { flex: 1, paddingHorizontal: spacing.big },
  indicatorRow: { flexDirection: "row", alignItems: "center", padding: spacing.small },
  indicatorText: { marginLeft: spacing.small, fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary, flex: 1 },
  msgRow: { marginTop: spacing.small, flexDirection: "row" },
  msgBubble: { maxWidth: "85%", borderRadius: radius, paddingHorizontal: spacing.big, paddingVertical: 10, borderWidth: 0, borderColor: "transparent", flexShrink: 1 },
  msgUser: { backgroundColor: colors.white },
  msgAssistant: { backgroundColor: colors.white },
  msgTextUser: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },
  msgTextAssistant: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },
  composerAbs: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingLeft: spacing.big,
    paddingTop: 5,
  },
  composerBackgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  input: {
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
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center", marginRight: spacing.big },
  sendBtnDisabled: { backgroundColor: colors.orange + "80" },
  suggestionsRow: { marginTop: spacing.small, alignItems: "center" },
  suggestionBtn: {
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.searchBar,
    alignSelf: "center",
    paddingHorizontal: spacing.big,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.small,
  },
  suggestionText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary, textAlign: "center" },
  boldText: { fontWeight: "700" },
  assistantList: { marginTop: spacing.small },
  assistantListItemRow: { flexDirection: "row", alignItems: "flex-start" },
  assistantBullet: { marginRight: spacing.small },
  assistantListItemText: { flex: 1 },
  assistantHeader: { marginTop: spacing.small, fontWeight: "700", fontSize: typography.textSize + 2 },
  warningOverlayFullScreen: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)", alignItems: "center", justifyContent: "center", padding: spacing.big },
  warningCard: { width: "100%", maxWidth: 360, backgroundColor: colors.white, borderRadius: radius, padding: 0, overflow: "hidden" },
  warningTitle: { fontFamily: typography.fontFamily, fontSize: 18, color: colors.textPrimary, marginBottom: spacing.small },
  warningBody: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary },
  warningContent: { padding: spacing.big },
  warningActions: { marginTop: spacing.big, flexDirection: "row", alignItems: "stretch", justifyContent: "space-between", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.textSecondary + "22" },
  warningBtn: { flex: 1, height: 44, alignItems: "center", justifyContent: "center" },
  warningBtnPressed: { backgroundColor: colors.searchBar },
  warningDivider: { width: StyleSheet.hairlineWidth, height: 44, backgroundColor: colors.textSecondary + "22" },
  warningContinue: { fontFamily: typography.fontFamily, fontSize: typography.textSize, height: 44, lineHeight: 44, textAlignVertical: "center", includeFontPadding: false, color: "#FF0001", fontWeight: "700" },
  warningCancel: { fontFamily: typography.fontFamily, fontSize: typography.textSize, height: 44, lineHeight: 44, textAlignVertical: "center", includeFontPadding: false, color: colors.textSecondary },
})

