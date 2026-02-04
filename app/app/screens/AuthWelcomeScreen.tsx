import React, { useEffect } from "react"
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native"
import { Text } from "./Text"
import { colors, radius, safeAreaBottom, safeAreaTop, spacing, typography, vibrate } from "./constants"
import { useNavigation } from "@react-navigation/native"
import LoginArrow from "./svgs/LoginArrow"
import LogoOnLight from "./svgs/LogoOnLight"
import { isSignInInFlight, signIn } from "@/services/auth"
import { logger } from "@/utils/logger"
import { Alert } from "react-native"

export default function AuthWelcomeScreen() {
  const navigation = useNavigation<any>()
  const [isSigningIn, setIsSigningIn] = React.useState(false)

  useEffect(() => {
    // If the app briefly returns to this screen during an auth callback, hide the button to avoid a flash.
    isSignInInFlight()
      .then((inFlight) => {
        if (inFlight) setIsSigningIn(true)
      })
      .catch(() => {})
  }, [])

  return (
    <View style={styles.root}>
      <View style={styles.bg}>
        <View style={styles.topBar}>
          <LogoOnLight width={340} height={110} />
        </View>

        <View style={styles.center}>
          <Text style={styles.welcome}>Welkom bij CoachScribe!</Text>
          {isSigningIn ? (
            <View style={styles.signingIn}>
              <ActivityIndicator size="large" color={colors.orange} />
              <Text style={styles.signingInText}>Bezig met inloggen…</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomButtons}>
          {isSigningIn ? null : (
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}
              onPress={() => {
                vibrate()
                setIsSigningIn(true)
                signIn()
                  .then(() => navigation.reset({ index: 0, routes: [{ name: "Loading" }] }))
                  .catch((e: any) => {
                    const message = String(e?.message || e || "Login failed")
                    logger.error("[auth] signIn failed", { message })
                    Alert.alert("Inloggen mislukt", message)
                    setIsSigningIn(false)
                  })
              }}
            >
              <View style={styles.btnRow}>
                <Text style={styles.secondaryBtnText}>Doorgaan</Text>
                <LoginArrow />
              </View>
            </Pressable>
          )}

          <View style={{ height: 52 }} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  bg: { flex: 1 },
  topBar: {
    paddingHorizontal: spacing.big,
    paddingTop: safeAreaTop + spacing.big,
    alignItems: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.big },
  signingIn: { marginTop: 24, alignItems: "center", justifyContent: "center", gap: 12 },
  signingInText: { color: colors.textPrimary, fontFamily: typography.fontFamily, fontSize: 16 },
  bottomButtons: { paddingHorizontal: spacing.big, paddingBottom: safeAreaBottom + 24 },
  welcome: {
    fontFamily: typography.fontFamily,
    fontSize: 30,
    textAlign: "center",
    marginTop: 0,
    marginBottom: 0,
  },
  secondaryBtn: {
    width: "100%",
    height: 52,
    borderRadius: radius,
    borderWidth: 1.5,
    borderColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    marginBottom: 12,
  },
  secondaryBtnText: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: 16,
  },
  primaryBtn: {
    width: "100%",
    height: 52,
    borderRadius: radius,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orange,
  },
  primaryBtnText: {
    color: colors.white,
    fontFamily: typography.fontFamily,
    fontSize: 16,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
})
