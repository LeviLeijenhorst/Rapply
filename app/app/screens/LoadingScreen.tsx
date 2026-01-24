import React, { useEffect } from "react"
import { View, StyleSheet, ActivityIndicator } from "react-native"
import { colors, spacing } from "./constants"
import { supabase } from "@/config/supabase"
import { useNavigation } from "@react-navigation/native"
import { logger } from "@/utils/logger"

export default function LoadingScreen() {
  const navigation = useNavigation<any>()

  useEffect(() => {
    let isCancelled = false
    let didNavigate = false

    async function routeFromCurrentSession() {
      try {
        const sessionResult = await supabase.auth.getSession()
        const user = sessionResult.data.session?.user ?? null
        if (isCancelled) return

        if (!user) {
          didNavigate = true
          navigation.reset({ index: 0, routes: [{ name: "AuthWelcome" }] })
          return
        }

        const isEmailConfirmed = !!user.email_confirmed_at
        if (isEmailConfirmed) {
          didNavigate = true
          navigation.reset({ index: 0, routes: [{ name: "Welcome" }] })
          return
        }

        didNavigate = true
        navigation.reset({ index: 0, routes: [{ name: "VerifyEmail", params: { email: user.email ?? "" } }] })
      } catch (error: any) {
        logger.error("[Loading] Failed to read Supabase session", { message: String(error?.message ?? error ?? "") })
        if (isCancelled) return
        didNavigate = true
        navigation.reset({ index: 0, routes: [{ name: "AuthWelcome" }] })
      }
    }

    routeFromCurrentSession()

    const subscription = supabase.auth.onAuthStateChange(() => {
      routeFromCurrentSession()
    })

    const timeout = setTimeout(() => {
      if (isCancelled) return
      if (didNavigate) return
      logger.warn("[Loading] Timeout waiting for session, routing to AuthWelcome")
      navigation.reset({ index: 0, routes: [{ name: "AuthWelcome" }] })
    }, 5000)

    return () => {
      isCancelled = true
      clearTimeout(timeout)
      subscription.data.subscription.unsubscribe()
    }
  }, [])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.orange} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.big,
  },
})
