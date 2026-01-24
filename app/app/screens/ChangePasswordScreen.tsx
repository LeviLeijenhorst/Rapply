import React, { useState } from "react"
import { View, StyleSheet, Pressable } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Text } from "./Text"
import { Icon } from "./Icon"
import BackButton from "./BackButton"
import { colors, radius, safeAreaTop, spacing, typography, vibrate } from "./constants"
import { Input } from "./Input"
import Eye from "./svgs/Eye"
import EyeOff from "./svgs/EyeOff"
import { supabase } from "@/config/supabase"

export default function ChangePasswordScreen() {
  const navigation = useNavigation<any>()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onBack() {
    vibrate()
    navigation.goBack()
  }

  async function onChangePassword() {
    setError(null)

    if (newPassword.length < 8) {
      setError("Nieuw wachtwoord moet minimaal 8 tekens bevatten.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen.")
      return
    }

    try {
      setLoading(true)
      const result = await supabase.auth.updateUser({ password: newPassword })
      if (result.error) {
        throw result.error
      }
      navigation.navigate({ name: "SettingsAccount", params: { passwordChanged: true }, merge: true } as any)
    } catch (e: any) {
      const code = String(e?.code ?? "")
      let msg = "Er ging iets mis bij het wijzigen van je wachtwoord. Probeer het opnieuw."
      if (code.includes("weak_password")) msg = "Wachtwoord is te zwak."
      else if (code.includes("requires_recent_login")) msg = "Actie vereist recente login. Log opnieuw in."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.headerRow}>
        <View style={styles.headerSideLeft}>
          <BackButton onPress={onBack} />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Wachtwoord wijzigen</Text>
        </View>
        <View style={styles.headerSideRight} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Nieuw wachtwoord</Text>
        <View style={styles.inputIconWrap}>
          <Input
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Nieuw wachtwoord"
            secureTextEntry={!showNew}
            editable={!loading}
            style={{ paddingRight: 48 }}
          />
          <Pressable onPress={() => setShowNew((s) => !s)} style={styles.eyeBtn} accessibilityLabel="Toon of verberg wachtwoord">
            {showNew ? <EyeOff /> : <Eye />}
          </Pressable>
        </View>

        <View style={{ height: spacing.big }} />

        <Text style={styles.label}>Bevestig nieuw wachtwoord</Text>
        <View style={styles.inputIconWrap}>
          <Input
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Bevestig nieuw wachtwoord"
            secureTextEntry={!showConfirm}
            editable={!loading}
            style={{ paddingRight: 48 }}
          />
          <Pressable onPress={() => setShowConfirm((s) => !s)} style={styles.eyeBtn} accessibilityLabel="Toon of verberg wachtwoord">
            {showConfirm ? <EyeOff /> : <Eye />}
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ height: spacing.big }} />

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            vibrate()
            onChangePassword()
          }}
          disabled={loading}
          style={({ pressed }) => [styles.primaryBtn, (pressed || loading) && { opacity: 0.9 }]}
        >
          <Text style={styles.primaryBtnText}>Wijzig wachtwoord</Text>
        </Pressable>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundLight, paddingTop: safeAreaTop, paddingHorizontal: spacing.big },
  headerRow: { position: "relative", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: spacing.big, paddingBottom: spacing.big, minHeight: 48 },
  headerSideLeft: { width: 80, alignItems: "flex-start" },
  headerCenter: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  headerSideRight: { width: 80, alignItems: "flex-end" },
  headerTitle: { fontFamily: typography.fontFamily, fontSize: 22, color: colors.textPrimary },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius,
    paddingHorizontal: spacing.big,
    paddingVertical: spacing.big,
    marginBottom: spacing.big,
  },
  label: { color: colors.textPrimary, marginBottom: 6, fontFamily: typography.fontFamily },
  inputIconWrap: { position: "relative" },
  eyeBtn: { position: "absolute", right: 12, height: 64, justifyContent: "center" },
  error: { marginTop: 8, color: "#C62828" },
  primaryBtn: {
    height: 48,
    backgroundColor: colors.orange,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: colors.white, fontFamily: typography.fontFamily, fontWeight: "700" },
})
