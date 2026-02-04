import React, { useEffect, useState } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation, useRoute } from "@react-navigation/native"

import { Text } from "./Text"
import { colors, radius, spacing, typography, vibrate } from "./constants"
import { signOut } from "@/services/auth"

export default function VerifyEmailScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(route?.params?.message ?? null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const routeEmail = typeof route?.params?.email === "string" ? String(route.params.email).trim() : ""
  const [emailAddress, setEmailAddress] = useState<string>(routeEmail)

  const handleReloadAndContinue = async () => {
    setError(null)
    setMessage(null)

    try {
      setIsSubmitting(true)
      navigation.reset({ index: 0, routes: [{ name: "Loading" }] })
    } catch {
      navigation.reset({ index: 0, routes: [{ name: "Login", params: { email: emailAddress } }] })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    setError(null)
    setMessage(null)
    try {
      setIsSubmitting(true)
      await signOut()
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
        <Text style={styles.title}>Emailadres</Text>

        {/* Instructions */}
        <Text style={styles.paragraph}>
          Deze app vraagt momenteel geen e-mailverificatie{emailAddress ? ` voor ${emailAddress}` : ""}. Je kunt gewoon doorgaan.
        </Text>

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
          <Text style={styles.primaryButtonText}>{isSubmitting ? "Bezig..." : "Doorgaan"}</Text>
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
  error: { marginTop: spacing.big, color: "#C62828", fontFamily: typography.fontFamily },
  message: { marginTop: spacing.big, color: colors.textPrimary, fontFamily: typography.fontFamily },
  primaryButton: { marginTop: spacing.big, height: 52, borderRadius: radius, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: colors.white, fontFamily: typography.fontFamily, fontSize: 16, fontWeight: "700" },
  textButton: { marginTop: spacing.small, alignSelf: "center", padding: spacing.small },
  textButtonText: { color: colors.textPrimary, fontFamily: typography.fontFamily, textDecorationLine: "underline" },
})


