import React, { useState } from "react"
import { View, StyleSheet, Pressable, Linking, Alert, Platform, ScrollView, Keyboard } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Text } from "./Text"
import { Icon } from "./Icon"
import BackButton from "./BackButton"
import { colors, radius, safeAreaTop, safeAreaBottom, spacing, typography, vibrate } from "./constants"
import { Input } from "./Input"
import { postToSecureApi } from "@/services/secureApi"

export default function ContactFeedbackScreen() {
  const navigation = useNavigation<any>()
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  React.useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => setKeyboardHeight(e?.endCoordinates?.height ?? 0))
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardHeight(0))
    return () => {
      showSub.remove?.()
      hideSub.remove?.()
    }
  }, [])

  function onBack() {
    vibrate()
    navigation.goBack()
  }

  function openEmail() {
    vibrate()
    Linking.openURL("mailto:contact@Rapply.nl")
  }
  function openWebsite() {
    vibrate()
    Linking.openURL("https://www.Rapply.nl")
  }
  function openAddress() {
    vibrate()
    const q = encodeURIComponent("Stationsplein 26, 6512 AB, Nijmegen")
    const url = Platform.select({ ios: `http://maps.apple.com/?q=${q}`, android: `geo:0,0?q=${q}` }) || `https://www.google.com/maps/search/?api=1&query=${q}`
    Linking.openURL(url)
  }

  async function onSend() {
    vibrate()
    const trimmed = message.trim()
    if (!trimmed) {
      Alert.alert("Vul een bericht in")
      return
    }
    try {
      setSending(true)
      await postToSecureApi("/feedback", { name: name.trim() || null, message: trimmed })
      setName("")
      setMessage("")
      Alert.alert("Bedankt!", "Je feedback is ontvangen.")
    } catch (e) {
      console.warn("feedback insert failed", { message: (e as any)?.message, code: (e as any)?.code })
      Alert.alert("Opslaan mislukt", "Probeer het alsjeblieft later opnieuw.")
    } finally {
      setSending(false)
    }
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.headerRow}>
        <BackButton onPress={onBack} />
        <Text style={styles.headerTitle}>Contact/feedback</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: (keyboardHeight > 0 ? keyboardHeight + 44 : safeAreaBottom + 12), paddingHorizontal: 8, paddingTop: 6 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Pressable accessibilityRole="button" onPress={openEmail} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}> 
            <Text style={styles.rowText}>contact@Rapply.nl</Text>
            <Icon name="email" />
          </Pressable>
          <View style={styles.divider} />
          <Pressable accessibilityRole="button" onPress={openWebsite} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}> 
            <Text style={styles.rowText}>www.Rapply.nl</Text>
            <Icon name="internet" />
          </Pressable>
          <View style={styles.divider} />
          <Pressable accessibilityRole="button" onPress={openAddress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}> 
            <Text style={styles.rowText}>Stationsplein 26, 6512 AB, Nijmegen</Text>
            <Icon name="location" />
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Feedback</Text>
          <Text style={styles.sectionBody}>
            Wij zijn heel benieuwd wat jij van Rapply vindt. Deel jouw mening zodat wij verder kunnen bouwen aan iets
            waar jij écht wat aan hebt.
          </Text>

          <View style={{ height: spacing.big }} />
          <Text style={styles.label}>Naam</Text>
          <Input value={name} onChangeText={setName} placeholder="Naam" />

          <View style={{ height: spacing.big }} />
          <Text style={styles.label}>Bericht</Text>
          <Input value={message} onChangeText={setMessage} placeholder="Bericht" multiline numberOfLines={5} style={{ height: 128 }} />

          <Pressable accessibilityRole="button" onPress={onSend} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }, sending && { opacity: 0.7 }]} disabled={sending}>
            <Text style={styles.primaryBtnText}>{sending ? "Versturen..." : "Verzenden"}</Text>
            <View style={{ width: 8 }} />
            <Icon name="send" color={colors.white} />
          </Pressable>
        </View>
      </ScrollView>

      
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundLight, paddingTop: safeAreaTop, paddingHorizontal: spacing.big, overflow: "visible" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: spacing.small, paddingBottom: spacing.big },
  headerTitle: { fontFamily: typography.fontFamily, fontSize: 22, color: colors.textPrimary },
  card: { 
    backgroundColor: colors.white, 
    borderRadius: radius, 
    paddingHorizontal: spacing.big, 
    paddingVertical: spacing.big, 
    marginTop: 2,
    marginBottom: spacing.big,
    marginHorizontal: 8,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 44 },
  rowText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.textSecondary + "22", marginRight: spacing.big + 24 },
  sectionTitle: { fontFamily: typography.fontFamily, fontSize: 18, color: colors.textPrimary, marginBottom: 6 },
  sectionBody: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary },
  label: { fontFamily: typography.fontFamily, color: colors.textPrimary, marginBottom: 6 },
  input: { height: 64, borderRadius: radius, backgroundColor: colors.orange + "0D", paddingHorizontal: spacing.big, color: colors.textSecondary, borderWidth: 1, borderColor: "#E0E0E0" },
  primaryBtn: { marginTop: spacing.big, height: 52, borderRadius: radius, backgroundColor: colors.orange, alignSelf: "stretch", alignItems: "center", justifyContent: "center", flexDirection: "row" },
  primaryBtnText: { color: colors.white, fontFamily: typography.fontFamily, fontSize: 16 },
})
