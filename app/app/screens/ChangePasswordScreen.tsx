import React from "react"
import { View, StyleSheet, Pressable } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Text } from "./Text"
import { Icon } from "./Icon"
import BackButton from "./BackButton"
import { colors, radius, safeAreaTop, spacing, typography, vibrate } from "./constants"
import { signOut } from "@/services/auth"

export default function ChangePasswordScreen() {
  const navigation = useNavigation<any>()

  function onBack() {
    vibrate()
    navigation.goBack()
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.headerRow}>
        <View style={styles.headerSideLeft}>
          <BackButton onPress={onBack} />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Account beheren</Text>
        </View>
        <View style={styles.headerSideRight} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Wachtwoord wijzigen</Text>
        <Text style={styles.helper}>
          Wachtwoord beheren gaat via Microsoft Entra. Log uit en log opnieuw in om het “Wachtwoord vergeten?”-proces te gebruiken.
        </Text>

        <View style={{ height: spacing.big }} />

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            vibrate()
            signOut()
              .then(() => navigation.reset({ index: 0, routes: [{ name: "AuthWelcome" }] }))
              .catch(() => {})
          }}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.primaryBtnText}>Uitloggen</Text>
            <View style={{ width: 8 }} />
            <Icon name="logout" color={colors.white} />
          </View>
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
  helper: { color: colors.textSecondary, fontFamily: typography.fontFamily, lineHeight: 20 },
  primaryBtn: {
    height: 48,
    backgroundColor: colors.orange,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: colors.white, fontFamily: typography.fontFamily, fontWeight: "700" },
})
