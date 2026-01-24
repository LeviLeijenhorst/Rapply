import React, { useEffect, useState } from "react"
import { View, Pressable, StyleSheet, ScrollView, Keyboard, Platform } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Text } from "./Text"
import { colors, radius, spacing, typography, vibrate } from "./constants"
import { supabase } from "@/config/supabase"
import { logger } from "@/utils/logger"
import Eye from "./svgs/Eye"
import EyeOff from "./svgs/EyeOff"
import BackButton from "./BackButton"
import { Input } from "./Input"
import { SafeAreaView } from "react-native-safe-area-context"
import LogoOnLight from "./svgs/LogoOnLight"

export default function LoginScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const routeEmail = typeof route?.params?.email === "string" ? String(route.params.email) : ""
  const [email, setEmail] = useState(routeEmail)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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

  const onSubmit = async () => {
    setError(null)
    if (!email.trim() || !password) {
      setError("Vul je email en wachtwoord in.")
      return
    }
    try {
      setLoading(true)
      const result = await Promise.race([
        supabase.auth.signInWithPassword({ email: email.trim(), password }),
        new Promise<{ error: Error }>((_resolve, reject) => {
          const id = setTimeout(() => {
            clearTimeout(id)
            reject(new Error("Login timeout"))
          }, 8000)
        }),
      ])
      if (result.error) {
        throw result.error
      }
      navigation.reset({ index: 0, routes: [{ name: "Loading" }] })
    } catch (e: any) {
      let msg = "Er ging iets mis. Probeer het opnieuw."
      logger.warn("[auth] login failed", { message: String(e?.message ?? e ?? ""), code: String(e?.code ?? "") })
      const rawMessage = String(e?.message ?? "")
      if (rawMessage.includes("Network request failed")) {
        setError(
          "Geen verbinding met de server. Als je Supabase lokaal draait, controleer dat Supabase aan staat en voer op je PC uit: adb reverse tcp:54321 tcp:54321.",
        )
        return
      }
      if (rawMessage.includes("Login timeout")) {
        setError(
          "Inloggen duurt te lang. Dit komt meestal doordat je telefoon de lokale Supabase niet kan bereiken. Controleer: (1) Supabase draait, (2) adb reverse tcp:54321 tcp:54321.",
        )
        return
      }
      const code = String(e?.code ?? "")
      if (code.includes("invalid_credentials")) msg = "Onjuiste inloggegevens."
      else if (code.includes("email_not_confirmed")) msg = "Verifieer eerst je emailadres om door te gaan."
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
    <BackButton
      onPress={() =>
        navigation.reset({ index: 0, routes: [{ name: "AuthWelcome" }] })
      }
    />
  </View>

  <View style={styles.headerCenter}>
    <View style={styles.logoWrap}>
      <LogoOnLight width={320} height={110} />
    </View>
  </View>

  <View style={styles.headerSide} />
</View>

      <Text style={styles.pageTitle}>Inloggen</Text>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Email</Text>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
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
              secureTextEntry={!showPassword}
              editable={!loading}
              style={[styles.input, { paddingRight: 48 }]}
            />
            <Pressable onPress={() => setShowPassword((s) => !s)} style={styles.eyeBtn} accessibilityLabel="Toon of verberg wachtwoord">
              {showPassword ? <EyeOff /> : <Eye />}
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
        <Pressable onPress={() => navigation.navigate("ResetPassword")} style={styles.textLinkWrap}>
          <Text style={styles.textLink}>Wachtwoord vergeten?</Text>
        </Pressable>
        <View style={styles.bottomRow}>
          <Text>Nog geen account? </Text>
          <Pressable onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.link}>Maak account aan</Text>
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

  container: {
    flex: 1,
    backgroundColor: "#FEF8F5",
    paddingHorizontal: spacing.big,
    paddingBottom: spacing.big,
    paddingTop: spacing.small, // SAME as signup
  },

  headerRow: {
    height: 110,
    flexDirection: "row",
    alignItems: "flex-start", // important
  },

  backButtonWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6, // SAME as signup
  },

  headerSide: {
    width: 44,
    height: 44,
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    pointerEvents: "none",
  },

  // SAME negative offset to counter SVG internal padding
  logoWrap: {
    marginTop: -12,
  },

  pageTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.small,
  },

  content: { paddingTop: spacing.big },
  fieldWrap: { marginTop: 12 },
  label: { color: colors.textPrimary, marginBottom: 6, fontFamily: typography.fontFamily },
  inputIconWrap: { position: "relative" },
  eyeBtn: { position: "absolute", right: 12, height: 64, justifyContent: "center" },
  input: { backgroundColor: "#FFFFFF", color: "#000000" },
  error: { color: "#C62828", marginTop: 10 },
  primaryBtn: { marginTop: 22, height: 52, borderRadius: radius, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: colors.white, fontFamily: typography.fontFamily, fontSize: 16, fontWeight: "700" },
  textLinkWrap: { marginTop: 12, alignSelf: "center" },
  textLink: { color: colors.textPrimary, textDecorationLine: "underline" },
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 14 },
  link: { color: colors.textPrimary, textDecorationLine: "underline" },})