import React, { useEffect, useState } from "react"
import { View, StyleSheet, Linking, Share } from "react-native"
import { Text } from "./Text"
import { Icon } from "./Icon"
import { colors, spacing, typography } from "./constants"
import { SubscriptionPlanPill } from "./SubscriptionPlanPill"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { vibrate } from "./constants"
import { getCustomerInfo, getCurrentPlanKeyFromCustomerInfo } from "@/services/revenuecat"
import type { SubscriptionPlanKey } from "./subscriptionFlowData"
import { computeUsageMinutesLabels, getBillingStatus, getCachedBillingStatus } from "@/services/billing"
import { OverlayPressable } from "./OverlayPressable"

export default function SettingsHomeScreen() {
  const navigation = useNavigation<any>()
  const [planKey, setPlanKey] = useState<SubscriptionPlanKey | null>(null)
  const [usageText, setUsageText] = useState<string>(() => {
    const cached = getCachedBillingStatus()
    if (!cached?.billingStatus) return "Gebruikt: 0 minuten"
    const labels = computeUsageMinutesLabels(cached.billingStatus)
    return `Gebruikt: ${labels.usedLabel}/${labels.availableLabel}`
  })

  async function refreshPlanKey() {
    const info = await getCustomerInfo()
    setPlanKey(getCurrentPlanKeyFromCustomerInfo(info))
  }

  async function refreshUsageText(options?: { force?: boolean }) {
    try {
      const status = await getBillingStatus({ force: !!options?.force })
      const labels = computeUsageMinutesLabels(status.billingStatus)
      setUsageText(`Gebruikt: ${labels.usedLabel}/${labels.availableLabel}`)
    } catch {
      setUsageText((prev) => prev || "Gebruikt: 0 minuten")
    }
  }

  // Loads the current subscription plan from RevenueCat for the subscription pill.
  useEffect(() => {
    ;(async () => {
      try {
        await refreshPlanKey()
      } catch {
        setPlanKey(null)
      }
    })()
  }, [])

  // Refreshes the subscription plan when returning to this screen.
  useFocusEffect(
    React.useCallback(() => {
      ;(async () => {
        try {
          await refreshPlanKey()
        } catch {
          setPlanKey(null)
        }
      })()
    }, []),
  )

  useFocusEffect(
    React.useCallback(() => {
      refreshUsageText({ force: true })
    }, []),
  )

  return (
    <View style={styles.wrap}>
      <View style={styles.usageCard}>
        <View style={styles.usageIconWrap}>
          <View style={styles.usageIconCircle}>
            <Icon name="microphone" color={colors.white} size={20} />
          </View>
        </View>
        <Text style={styles.usageText}>{usageText}</Text>
      </View>

      <View style={styles.card}>
        <OverlayPressable
          accessibilityRole="button"
          onPress={() => {
            vibrate()
            navigation.navigate("Subscription")
          }}
          style={styles.rowBetween}
        >
          <Text style={styles.rowText}>Mijn abonnement</Text>
          <View style={styles.rowRight}>
            {/* Subscription plan pill */}
            <SubscriptionPlanPill planKey={planKey} />
            <View style={styles.rowRightSpacer} />
            {/* Navigation chevron */}
            <Icon name="chevronRight" />
          </View>
        </OverlayPressable>
        <View style={styles.divider} />
        <OverlayPressable
          accessibilityRole="button"
          onPress={() => {
            vibrate()
            navigation.navigate("ContactFeedback")
          }}
          style={styles.rowBetween}
        >
          <Text style={styles.rowText}>Contact & feedback</Text>
          <Icon name="chevronRight" />
        </OverlayPressable>
      </View>

      <View style={styles.card}>
        <OverlayPressable
          accessibilityRole="button"
          onPress={() => {
            vibrate()
            Linking.openURL("https://www.Rapply.nl/over-ons")
          }}
          style={styles.rowBetween}
        >
          <Text style={styles.rowText}>Over ons</Text>
          <Icon name="chevronRight" />
        </OverlayPressable>
        <View style={styles.divider} />
        <OverlayPressable
          accessibilityRole="button"
          onPress={() => {
            vibrate()
            Share.share({ message: "Probeer Rapply: www.Rapply.nl" })
          }}
          style={styles.rowBetween}
        >
          <Text style={styles.rowText}>Deel Rapply</Text>
          <Icon name="chevronRight" />
        </OverlayPressable>
        <View style={styles.divider} />
        <OverlayPressable
          accessibilityRole="button"
          onPress={() => {
            vibrate()
            Linking.openURL("https://www.Rapply.nl/privacy")
          }}
          style={styles.rowBetween}
        >
          <Text style={styles.rowText}>Privacy beleid</Text>
          <Icon name="chevronRight" />
        </OverlayPressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.big },
  usageCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: spacing.big,
    paddingVertical: spacing.big,
    marginBottom: spacing.big,
  },
  usageIconWrap: { marginRight: spacing.big },
  usageIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  usageText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: "hidden",
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginBottom: spacing.big,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.big,
    paddingHorizontal: spacing.big,
  },
  rowRight: { flexDirection: "row", alignItems: "center" },
  rowRightSpacer: { width: spacing.small },
  rowText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.textSecondary + "22",
    marginLeft: spacing.big,
    marginRight: spacing.big + 24,
  },
})
