import React from "react"
import { View, Pressable, StyleSheet } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Text } from "./Text"
import { colors, radius, spacing, typography, vibrate } from "./constants"
import BackButton from "./BackButton"
import { SafeAreaView } from "react-native-safe-area-context"
import LogoOnLight from "./svgs/LogoOnLight"
import { signIn } from "@/services/auth"

export default function LoginScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const routeEmail = typeof route?.params?.email === "string" ? String(route.params.email) : ""
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

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
      <Text style={styles.helper}>
        Je logt in via Microsoft Entra. Je kunt daar ook een account aanmaken. {routeEmail ? `(${routeEmail})` : ""}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          vibrate()
          setError(null)
          setLoading(true)
          signIn()
            .then(() => navigation.reset({ index: 0, routes: [{ name: "Loading" }] }))
            .catch((e: any) => setError(String(e?.message || e || "Inloggen mislukt")))
            .finally(() => setLoading(false))
        }}
        style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }, loading && { opacity: 0.7 }]}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>{loading ? "Bezig..." : "Doorgaan"}</Text>
      </Pressable>
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

  helper: { marginTop: 10, color: colors.textSecondary, fontFamily: typography.fontFamily, lineHeight: 20 },
  error: { color: "#C62828", marginTop: 10 },
  primaryBtn: { marginTop: 22, height: 52, borderRadius: radius, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: colors.white, fontFamily: typography.fontFamily, fontSize: 16, fontWeight: "700" },
})