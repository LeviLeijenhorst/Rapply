import React, { useEffect, useState } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation, useRoute } from "@react-navigation/native"

import Config from "@/config"
import { supabase } from "@/config/supabase"
import { Text } from "./Text"
import { colors, radius, spacing, typography, vibrate } from "./constants"

export default function VerifyEmailScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(route?.params?.message ?? null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const routeEmail = typeof route?.params?.email === "string" ? String(route.params.email).trim() : ""
  const [emailAddress, setEmailAddress] = useState<string>(routeEmail)
  const [isEmailConfirmed, setIsEmailConfirmed] = useState<boolean>(false)

  useEffect(() => {
    let isCancelled = false
    async function load() {
      const result = await supabase.auth.getUser()
      const user = result.data.user
      if (isCancelled) return
      if (!routeEmail) {
        setEmailAddress(user?.email ? String(user.email) : "")
      }
      setIsEmailConfirmed(!!user?.email_confirmed_at)
    }
    load()
    return () => {
      isCancelled = true
    }
  }, [])

  const handleReloadAndContinue = async () => {
    setError(null)
    setMessage(null)

    try {
      setIsSubmitting(true)
      const result = await supabase.auth.getUser()
      const user = result.data.user
      if (!user) {
        navigation.reset({ index: 0, routes: [{ name: "Login", params: { email: emailAddress } }] })
        return
      }
      if (user.email_confirmed_at) {
        setIsEmailConfirmed(true)
        navigation.reset({ index: 0, routes: [{ name: "Welcome" }] })
        return
      }
      setIsEmailConfirmed(false)
      setError("Je emailadres is nog niet geverifieerd. Controleer je inbox en probeer het opnieuw. Als je al geverifieerd hebt, log opnieuw in.")
    } catch {
      navigation.reset({ index: 0, routes: [{ name: "Login", params: { email: emailAddress } }] })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendVerificationEmail = async () => {
    setError(null)
    setMessage(null)

    try {
      setIsSubmitting(true)
      const email = emailAddress.trim()
      if (!email) {
        setError("Geen e-mailadres gevonden. Ga terug en probeer opnieuw.")
        return
      }
      const resend = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: Config.AUTH_ACTION_CONTINUE_URL } })
      if (resend.error) {
        throw resend.error
      }
      setEmailAddress(email)
      setMessage("Verificatiemail verstuurd. Controleer je inbox (en eventueel je spam).")
    } catch {
      setError("Kon geen verificatiemail versturen. Probeer het later opnieuw.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    setError(null)
    setMessage(null)
    try {
      setIsSubmitting(true)
      await supabase.auth.signOut()
      navigation.reset({ index: 0, routes: [{ name: "AuthWelcome" }] })
    } catch {
      setError("Uitloggen mislukt. Probeer het opnieuw.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Verifieer je emailadres</Text>

        {/* Instructions */}
        <Text style={styles.paragraph}>
          We hebben een verificatiemail gestuurd{emailAddress ? ` naar ${emailAddress}` : ""}. Open de mail en klik op de verificatielink.
        </Text>

        {/* Status */}
        <Text style={styles.statusText}>Status: {isEmailConfirmed ? "geverifieerd" : "niet geverifieerd"}</Text>

        {/* Status */}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}

        {/* Actions */}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            vibrate()
            handleReloadAndContinue()
          }}
          disabled={isSubmitting}
          style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.9 }, isSubmitting && { opacity: 0.7 }]}
        >
          <Text style={styles.primaryButtonText}>{isSubmitting ? "Bezig..." : "Ik heb geverifieerd"}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            vibrate()
            handleSendVerificationEmail()
          }}
          disabled={isSubmitting}
          style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.9 }, isSubmitting && { opacity: 0.7 }]}
        >
          <Text style={styles.secondaryButtonText}>Verificatiemail opnieuw sturen</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            vibrate()
            handleSignOut()
          }}
          disabled={isSubmitting}
          style={({ pressed }) => [styles.textButton, pressed && { opacity: 0.7 }, isSubmitting && { opacity: 0.7 }]}
        >
          <Text style={styles.textButtonText}>Uitloggen</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FEF8F5" },
  container: { flex: 1, backgroundColor: "#FEF8F5", padding: spacing.big },
  title: { fontFamily: typography.fontFamily, fontSize: 24, fontWeight: "700", color: colors.textPrimary, marginTop: spacing.small },
  paragraph: { marginTop: spacing.big, color: colors.textPrimary, fontFamily: typography.fontFamily, lineHeight: 22 },
  statusText: { marginTop: spacing.big, color: colors.textPrimary, fontFamily: typography.fontFamily },
  error: { marginTop: spacing.big, color: "#C62828", fontFamily: typography.fontFamily },
  message: { marginTop: spacing.big, color: colors.textPrimary, fontFamily: typography.fontFamily },
  primaryButton: { marginTop: spacing.big, height: 52, borderRadius: radius, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: colors.white, fontFamily: typography.fontFamily, fontSize: 16, fontWeight: "700" },
  secondaryButton: { marginTop: spacing.small, height: 52, borderRadius: radius, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { color: colors.textPrimary, fontFamily: typography.fontFamily, fontSize: 16, fontWeight: "700" },
  textButton: { marginTop: spacing.small, alignSelf: "center", padding: spacing.small },
  textButtonText: { color: colors.textPrimary, fontFamily: typography.fontFamily, textDecorationLine: "underline" },
})


