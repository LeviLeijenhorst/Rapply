import React, { useEffect, useState } from "react"
import { Alert, Keyboard, ScrollView, StyleSheet, View } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Icon } from "./Icon"
import { Input } from "./Input"
import { Text } from "./Text"
import { colors, radius, safeAreaBottom, safeAreaTop, spacing, typography, vibrate } from "./constants"
import { OverlayPressable } from "./OverlayPressable"
import { getAuthSession } from "@/services/auth"
import { postToSecureApi } from "@/services/secureApi"

export default function SubscriptionPraktijkScreen() {
  const navigation = useNavigation<any>()

  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [keyboardBottomInset, setKeyboardBottomInset] = useState(0)

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => setKeyboardBottomInset(e.endCoordinates.height))
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardBottomInset(0))
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    getAuthSession().then((session) => {
      if (cancelled) return
      const sessionEmail = session?.email ?? ""
      setEmail(sessionEmail)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function handleBackPress() {
    vibrate()
    navigation.goBack()
  }

  async function handleSendPress() {
    vibrate()
    const trimmedEmail = email.trim()
    const trimmedMessage = message.trim()

    if (!trimmedEmail) {
      Alert.alert("Vul je emailadres in")
      return
    }
    if (!trimmedMessage) {
      Alert.alert("Vul een bericht in")
      return
    }

    try {
      setSending(true)
      await postToSecureApi("/praktijk/request", { email: trimmedEmail, message: trimmedMessage })
      setMessage("")
      Alert.alert("Bedankt!", "Je aanvraag is verstuurd. We nemen contact met je op.")
      navigation.goBack()
    } catch (e) {
      console.warn("praktijk_requests insert failed", { message: (e as any)?.message, code: (e as any)?.code })
      Alert.alert("Versturen mislukt", "Probeer het alsjeblieft later opnieuw.")
    } finally {
      setSending(false)
    }
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <OverlayPressable accessibilityRole="button" accessibilityLabel="Terug" onPress={handleBackPress} style={styles.headerBackButton}>
            <Icon name="back" size={28} />
          </OverlayPressable>
          <Text style={styles.headerTitle}>Praktijk</Text>
          <View style={styles.headerRightSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: safeAreaBottom + 28 + keyboardBottomInset }]}
        >
          <View style={styles.card}>
            <Text style={styles.lead}>
              Vertel ons kort wat je nodig hebt. Dan maken we een aanbod op maat.
            </Text>

            <View style={styles.fieldSpacer} />
            <Text style={styles.label}>E-mail</Text>
            <Input value={email} onChangeText={setEmail} placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" />

            <View style={styles.fieldSpacer} />
            <Text style={styles.label}>Bericht</Text>
            <Input value={message} onChangeText={setMessage} placeholder="Bericht" multiline numberOfLines={3} />

            <OverlayPressable
              accessibilityRole="button"
              onPress={handleSendPress}
              disabled={sending}
              style={[styles.primaryBtn, sending && { opacity: 0.7 }]}
            >
              <Text style={styles.primaryBtnText}>{sending ? "Versturen..." : "Verzenden"}</Text>
              <View style={styles.primaryBtnSpacer} />
              <Icon name="send" color={colors.white} />
            </OverlayPressable>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundLight, paddingTop: safeAreaTop },
  container: { flex: 1, paddingHorizontal: spacing.big },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.small,
    paddingBottom: spacing.big,
  },
  headerBackButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: typography.fontFamily, fontSize: 22, color: colors.textPrimary },
  headerRightSpacer: { width: 44 },
  scrollContent: { paddingBottom: safeAreaBottom + 28 },

  card: { backgroundColor: colors.white, borderRadius: radius, paddingHorizontal: spacing.big, paddingVertical: spacing.big },
  lead: { fontFamily: typography.fontFamily, fontSize: typography.textSize, lineHeight: 22, color: colors.textSecondary },
  label: { fontFamily: typography.fontFamily, color: colors.textPrimary, marginBottom: 6 },
  fieldSpacer: { height: spacing.big },

  primaryBtn: { marginTop: spacing.big, height: 52, borderRadius: radius, backgroundColor: colors.orange, alignSelf: "stretch", alignItems: "center", justifyContent: "center", flexDirection: "row" },
  primaryBtnText: { color: colors.white, fontFamily: typography.fontFamily, fontSize: 16 },
  primaryBtnSpacer: { width: 8 },
})


