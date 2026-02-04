import React, { useEffect } from "react"
import { View, StyleSheet, ActivityIndicator } from "react-native"
import { colors, spacing } from "./constants"
import { useNavigation } from "@react-navigation/native"
import { logger } from "@/utils/logger"
import { getAuthSession, onAuthSessionChange } from "@/services/auth"
import * as Linking from "expo-linking"

export default function LoadingScreen() {
  const navigation = useNavigation<any>()

  useEffect(() => {
    let isCancelled = false
    let didNavigate = false
    let sawAuthCallback = false

    async function routeFromCurrentSession() {
      try {
        const session = await getAuthSession()
        const userId = session?.userId ?? null
        if (isCancelled) return

        if (!userId) {
          // If we're returning from Entra redirect (deep link contains auth code),
          // keep the user on the loading screen briefly to avoid flashing AuthWelcome.
          try {
            const initialUrl = await Linking.getInitialURL()
            const url = typeof initialUrl === "string" ? initialUrl : ""
            if (url.includes("://auth") && (url.includes("code=") || url.includes("session_state=") || url.includes("state="))) {
              sawAuthCallback = true
              return
            }
          } catch {}

          didNavigate = true
          navigation.reset({ index: 0, routes: [{ name: "AuthWelcome" }] })
          return
        }

        didNavigate = true
        navigation.reset({ index: 0, routes: [{ name: "Welcome" }] })
      } catch (error: any) {
        logger.error("[Loading] Failed to read session", { message: String(error?.message ?? error ?? "") })
        if (isCancelled) return
        didNavigate = true
        navigation.reset({ index: 0, routes: [{ name: "AuthWelcome" }] })
      }
    }

    routeFromCurrentSession()

    const unsubscribe = onAuthSessionChange(() => {
      routeFromCurrentSession()
    })

    const timeout = setTimeout(() => {
      if (isCancelled) return
      if (didNavigate) return
      logger.warn("[Loading] Timeout waiting for session, routing to AuthWelcome")
      navigation.reset({ index: 0, routes: [{ name: "AuthWelcome" }] })
    }, sawAuthCallback ? 15000 : 5000)

    return () => {
      isCancelled = true
      clearTimeout(timeout)
      unsubscribe()
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
