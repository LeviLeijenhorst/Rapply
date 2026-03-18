import React, { useEffect } from "react"
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, View } from "react-native"
import { Text } from "./Text"
import { colors, radius, safeAreaBottom, safeAreaTop, spacing, typography, vibrate } from "./constants"
import { useNavigation } from "@react-navigation/native"
import { useRoute } from "@react-navigation/native"
import LoginArrow from "./svgs/LoginArrow"
import LogoOnLight from "./svgs/LogoOnLight"
import RapplyMark from "./svgs/RapplyMark"
import { isSignInInFlight, signIn } from "@/services/auth"
import { logger } from "@/utils/logger"
import { Alert } from "react-native"

export default function AuthWelcomeScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const [isSigningIn, setIsSigningIn] = React.useState(false)
  const spin = React.useRef(new Animated.Value(0)).current
  const mode = route?.params?.mode === "signup" ? "signup" : "signin"
  const autoStart = route?.params?.autoStart === true || route?.params?.direct === true

  function startEntra() {
    setIsSigningIn(true)
    signIn(mode === "signup" ? { screenHint: "signup" } : undefined)
      .then(() => navigation.reset({ index: 0, routes: [{ name: "Loading" }] }))
      .catch((e: any) => {
        const message = String(e?.message || e || "Login failed")
        logger.error("[auth] signIn failed", { message })
        Alert.alert("Inloggen mislukt", message)
        setIsSigningIn(false)
      })
  }

  useEffect(() => {
    // If the app briefly returns to this screen during an auth callback, hide the button to avoid a flash.
    isSignInInFlight()
      .then((inFlight) => {
        if (inFlight) setIsSigningIn(true)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!autoStart) return
    if (isSigningIn) return
    startEntra()
  }, [autoStart, isSigningIn])

  useEffect(() => {
    if (!isSigningIn) {
      spin.stopAnimation()
      spin.setValue(0)
      return
    }

    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )
    loop.start()

    return () => {
      loop.stop()
    }
  }, [isSigningIn, spin])

  const spinStyle = {
    transform: [
      {
        rotate: spin.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "360deg"],
        }),
      },
    ],
  }

  return (
    <View style={styles.root}>
      <View style={styles.bg}>
        <View style={styles.topBar}>
          <LogoOnLight width={340} height={110} />
        </View>

        <View style={styles.center}>
          <Text style={styles.welcome}>Welkom bij Rapply!</Text>
          {isSigningIn ? (
            <View style={styles.signingIn}>
              <Animated.View style={spinStyle}>
                <RapplyMark size={36} color={colors.orange} strokeWidth={1} />
              </Animated.View>
              <Text style={styles.signingInText}>Bezig met inloggen…</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomButtons}>
          <Pressable
            accessibilityRole="button"
            disabled={isSigningIn}
            style={({ pressed }) => [styles.secondaryBtn, isSigningIn && styles.secondaryBtnDisabled, pressed && { opacity: 0.9 }]}
            onPress={() => {
              vibrate()
              startEntra()
            }}
            >
              <View style={styles.btnRow}>
                <Text style={styles.secondaryBtnText}>Doorgaan</Text>
                {isSigningIn ? (
                  <ActivityIndicator size="small" color={colors.textPrimary} />
                ) : (
                  <LoginArrow />
                )}
              </View>
          </Pressable>

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
  secondaryBtnDisabled: {
    opacity: 0.75,
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
