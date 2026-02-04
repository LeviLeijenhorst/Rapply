import React, { useState } from "react"
import { View, TextInput, Pressable, StyleSheet } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Text } from "./Text"
import { colors, radius, safeAreaTop, spacing, typography, vibrate } from "./constants"

export default function ResetPasswordScreen() {
  const navigation = useNavigation<any>()
  const [email, setEmail] = useState("")
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    setInfo(null)
    setError(null)
    if (!email.trim()) {
      setError("Vul je emailadres in.")
      return
    }
    try {
      setLoading(true)
      setInfo("Wachtwoord resetten via e-mail is nog niet beschikbaar. Log in en ga naar: Mijn account → Wachtwoord wijzigen.")
    } catch (e: any) {
      let msg = "Er ging iets mis. Probeer het later opnieuw."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.card}>
        <Text style={styles.title}>Wachtwoord resetten</Text>

        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="naam@voorbeeld.com"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            editable={!loading}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            vibrate()
            onSubmit()
          }}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }, loading && { opacity: 0.7 }]}
          disabled={loading}
        >
          <Text style={styles.primaryBtnText}>{loading ? "Bezig..." : "Verstuur e-mail"}</Text>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 14, alignSelf: "center" }}>
          <Text style={styles.link}>Terug</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white, paddingTop: safeAreaTop },
  card: { flex: 1, paddingTop: 24, paddingHorizontal: spacing.big },
  title: { fontFamily: typography.fontFamily, fontSize: 24, color: colors.textPrimary, marginBottom: 12 },
  fieldWrap: { marginTop: 12 },
  label: { color: colors.textPrimary, marginBottom: 6, fontFamily: typography.fontFamily },
  input: { height: 48, backgroundColor: "#FCEFE9", borderRadius: radius, paddingHorizontal: 14, color: colors.textPrimary },
  error: { color: "#C62828", marginTop: 10 },
  info: { color: colors.textPrimary, marginTop: 10 },
  primaryBtn: { marginTop: 22, height: 52, borderRadius: radius, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: colors.white, fontFamily: typography.fontFamily, fontSize: 16 },
  link: { color: colors.textPrimary, textDecorationLine: "underline" },
})
