import React, { useState } from "react"
import { Alert, ScrollView, StyleSheet, TextInput, View } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Icon } from "./Icon"
import { Text } from "./Text"
import { colors, radius, safeAreaBottom, safeAreaTop, spacing, typography, vibrate } from "./constants"
import { subscriptionPlans, type SubscriptionCancelReasonKey, type SubscriptionPlanKey } from "./subscriptionFlowData"
import { Linking, Platform } from "react-native"
import Constants from "expo-constants"
import { postToSecureApi } from "@/services/secureApi"
import { OverlayPressable } from "./OverlayPressable"
import { requireUserId } from "@/services/auth"

export default function SubscriptionTipsScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()

  const defaultPlanKey: SubscriptionPlanKey = subscriptionPlans[0]?.key ?? "basis"
  const selectedPlan: SubscriptionPlanKey = route.params?.selectedPlan ?? defaultPlanKey
  const selectedReason: SubscriptionCancelReasonKey = route.params?.selectedReason ?? "app-werkt-niet-goed"
  const otherReasonText: string = route.params?.otherReasonText ?? ""

  const [tipsText, setTipsText] = useState<string>(route.params?.tipsText ?? "")
  const [sending, setSending] = useState(false)

  function handleBackPress() {
    vibrate()
    navigation.goBack()
  }

  function getAndroidPackageName(): string | null {
    const fromExpoConfig = (Constants as any)?.expoConfig?.android?.package
    const pkg = typeof fromExpoConfig === "string" ? fromExpoConfig.trim() : ""
    return pkg || null
  }

  async function openStoreSubscriptionManagement() {
    if (Platform.OS === "android") {
      const pkg = getAndroidPackageName()
      const url = pkg ? `https://play.google.com/store/account/subscriptions?package=${encodeURIComponent(pkg)}` : "https://play.google.com/store/account/subscriptions"
      await Linking.openURL(url)
      return
    }
    throw new Error("Subscription management is not supported on this platform yet.")
  }

  async function handleFinalCancelPress() {
    vibrate()
    try {
      setSending(true)
      await requireUserId()
      await postToSecureApi("/subscriptionCancel/feedback", {
        selectedPlan,
        selectedReason,
        otherReasonText: otherReasonText.trim() || null,
        tipsText: tipsText.trim() || null,
      })
      try {
        await openStoreSubscriptionManagement()
      } catch {
        Alert.alert(
          "Abonnement beheren",
          "Open de Play Store en ga naar: Profiel → Betalingen en abonnementen → Abonnementen.",
          [{ text: "Ok" }],
        )
      }
      navigation.navigate("Subscription", { selectedPlan })
    } catch (e) {
      const raw = String((e as any)?.message || e || "")
      const isHtml404 = raw.includes("<html") && raw.toLowerCase().includes("404")
      const message = isHtml404
        ? "De server kent deze route nog niet. Start of deploy de server en probeer het opnieuw."
        : "Probeer het alsjeblieft later opnieuw."
      Alert.alert("Opslaan mislukt", message)
    } finally {
      setSending(false)
    }
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <OverlayPressable accessibilityRole="button" accessibilityLabel="Terug" onPress={handleBackPress} style={styles.headerBackButton}>
            <Icon name="back" size={28} />
          </OverlayPressable>
          <Text style={styles.headerTitle}>Wil je ons nog tips geven?</Text>
          <View style={styles.headerRightSpacer} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.lead}>Als je nog tips of feedback hebt, horen we dat graag.</Text>

          <TextInput
            value={tipsText}
            onChangeText={setTipsText}
            placeholder="Typ hier je tips..."
            placeholderTextColor={colors.textSecondary}
            multiline
            style={styles.textbox}
          />

          <View style={styles.actions}>
            <OverlayPressable
              accessibilityRole="button"
              onPress={handleFinalCancelPress}
              disabled={sending}
              style={[styles.buttonBase, styles.buttonCancel, sending && { opacity: 0.7 }]}
            >
              <Text style={styles.buttonCancelText}>{sending ? "Bezig..." : "Abonnement opzeggen"}</Text>
            </OverlayPressable>
            <View style={styles.buttonSpacer} />
            <OverlayPressable
              accessibilityRole="button"
              onPress={() => {
                vibrate()
                navigation.navigate("Subscription", { selectedPlan })
              }}
              disabled={sending}
              style={[styles.buttonBase, styles.buttonKeep, sending && { opacity: 0.7 }]}
            >
              <Text style={styles.buttonKeepText}>Toch behouden</Text>
            </OverlayPressable>
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundLight, paddingTop: safeAreaTop },
  container: { flex: 1, paddingHorizontal: spacing.big },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.small,
    paddingBottom: spacing.big,
  },
  headerBackButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: typography.fontFamily, fontSize: 22, color: colors.textPrimary },
  headerRightSpacer: { width: 44 },

  scrollContent: { paddingBottom: safeAreaBottom + 28 },
  lead: { fontFamily: typography.fontFamily, fontSize: typography.textSize, lineHeight: 22, color: colors.textSecondary, marginBottom: spacing.big },

  textbox: {
    width: "100%",
    minHeight: 96,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.searchBar,
    backgroundColor: colors.white,
    padding: spacing.big,
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    color: colors.textPrimary,
    textAlignVertical: "top",
  },

  actions: { marginTop: spacing.big },
  buttonSpacer: { height: spacing.small },
  buttonBase: { height: 52, borderRadius: radius, alignItems: "center", justifyContent: "center" },
  buttonCancel: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.textSecondary + "22" },
  buttonCancelText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },
  buttonKeep: { backgroundColor: colors.orange },
  buttonKeepText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.white },

  spacer: { height: 120 },
})


