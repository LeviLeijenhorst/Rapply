import React, { useEffect, useState } from "react"
import { View, Pressable, StyleSheet, ScrollView, Keyboard, Platform } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Text } from "./Text"
import { colors, radius, spacing, typography, vibrate } from "./constants"
import Config from "@/config"
import { supabase } from "@/config/supabase"
import Eye from "./svgs/Eye"
import EyeOff from "./svgs/EyeOff"
import { Input } from "./Input"
import BackButton from "./BackButton"
import { SafeAreaView } from "react-native-safe-area-context"
import LogoOnLight from "./svgs/LogoOnLight"

export default function SignupScreen() {
  const navigation = useNavigation<any>()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword1, setShowPassword1] = useState(false)
  const [showPassword2, setShowPassword2] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow"
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide"
    const onShow = (e: any) => setKeyboardHeight(e?.endCoordinates?.height ?? 0)
    const onHide = () => setKeyboardHeight(0)
    const s1 = Keyboard.addListener(showEvt as any, onShow)
    const s2 = Keyboard.addListener(hideEvt as any, onHide)
    return () => {
      s1.remove()
      s2.remove()
    }
  }, [])

  const validate = () => {
    if (!firstName.trim()) return "Vul je voornaam in."
    if (!lastName.trim()) return "Vul je achternaam in."
    if (!email.trim()) return "Vul je emailadres in."
    if (password.length < 8) return "Wachtwoord moet minstens 8 tekens bevatten."
    if (password !== confirmPassword) return "Wachtwoorden komen niet overeen."
    return null
  }

  const onSubmit = async () => {
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setError(null)
    try {
      setLoading(true)
      const displayName = `${firstName.trim()} ${lastName.trim()}`.trim()
      const result = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName || null },
          emailRedirectTo: Config.AUTH_ACTION_CONTINUE_URL,
        },
      })
      if (result.error) {
        throw result.error
      }
      navigation.reset({ index: 0, routes: [{ name: "VerifyEmail", params: { email: email.trim() } }] })
    } catch (e: any) {
      let msg = "Er ging iets mis. Probeer het opnieuw."
      const code = String(e?.code ?? "")
      if (code.includes("user_already_exists")) msg = "Dit emailadres is al in gebruik."
      else if (code.includes("invalid_email")) msg = "Ongeldig emailadres."
      else if (code.includes("weak_password")) msg = "Wachtwoord is te zwak."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.backButtonWrap}>
          <BackButton onPress={() => navigation.reset({ index: 0, routes: [{ name: "AuthWelcome" }] })} />
        </View>
        <View style={styles.headerCenter}>
          <View style={styles.logoWrap}>
            <LogoOnLight width={360} height={124} />
          </View>
        </View>
        <View style={styles.headerSide} />
      </View>
      <Text style={styles.pageTitle}>Account aanmaken</Text>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Voornaam</Text>
          <Input
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Voornaam"
            placeholderTextColor={colors.textSecondary}
            editable={!loading}
            style={styles.input}
          />
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Achternaam</Text>
          <Input
            value={lastName}
            onChangeText={setLastName}
            placeholder="Achternaam"
            placeholderTextColor={colors.textSecondary}
            editable={!loading}
            style={styles.input}
          />
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Email</Text>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="naam@voorbeeld.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
            style={styles.input}
          />
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Wachtwoord</Text>
          <View style={styles.inputIconWrap}>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="Wachtwoord"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showPassword1}
              editable={!loading}
              style={[styles.input, { paddingRight: 48 }]}
            />
            <Pressable onPress={() => setShowPassword1((s) => !s)} style={styles.eyeBtn} accessibilityLabel="Toon of verberg wachtwoord">
              {showPassword1 ? <EyeOff /> : <Eye />}
            </Pressable>
          </View>
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Wachtwoord herhalen</Text>
          <View style={styles.inputIconWrap}>
            <Input
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Wachtwoord"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showPassword2}
              editable={!loading}
              style={[styles.input, { paddingRight: 48 }]}
            />
            <Pressable onPress={() => setShowPassword2((s) => !s)} style={styles.eyeBtn} accessibilityLabel="Toon of verberg wachtwoord">
              {showPassword2 ? <EyeOff /> : <Eye />}
            </Pressable>
          </View>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            vibrate()
            onSubmit()
          }}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }, loading && { opacity: 0.7 }]}
          disabled={loading}
        >
          <Text style={styles.primaryBtnText}>{loading ? "Bezig..." : "Doorgaan"}</Text>
        </Pressable>
        <View style={styles.bottomRow}>
          <Text>Heb je al een account? </Text>
          <Pressable onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Log in</Text>
          </Pressable>
        </View>
        <View style={{ height: keyboardHeight }} />
      </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FEF8F5" },

  // was: padding: spacing.big  -> this makes everything too low
  container: {
    flex: 1,
    backgroundColor: "#FEF8F5",
    paddingHorizontal: spacing.big,
    paddingBottom: spacing.big,
    paddingTop: spacing.small, // higher header
  },

  // make header align from the top, not vertically centered
  headerRow: {
    height: 110,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  // SAME top offset as logoWrap so they're on the same Y
  backButtonWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },

  headerSide: { width: 44, height: 44 },

  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    pointerEvents: "none",
  },

  // SAME top offset as backButtonWrap
  logoWrap: {
    marginTop: -12,
  },

  backBtn: { padding: 4 },
  pageTitle: { fontFamily: typography.fontFamily, fontSize: 24, fontWeight: "700", color: colors.textPrimary, marginTop: spacing.small },
  content: { paddingTop: spacing.big },
  fieldWrap: { marginTop: 12 },
  label: { color: colors.textPrimary, marginBottom: 6, fontFamily: typography.fontFamily },
  inputIconWrap: { position: "relative" },
  eyeBtn: { position: "absolute", right: 12, height: 64, justifyContent: "center" },
  input: { backgroundColor: "#FFFFFF", color: "#000000" },
  error: { color: "#C62828", marginTop: 10 },
  primaryBtn: { marginTop: 22, height: 52, borderRadius: radius, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: colors.white, fontFamily: typography.fontFamily, fontSize: 16, fontWeight: "700" },
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 14 },
  link: { color: colors.textPrimary, textDecorationLine: "underline" },
} )