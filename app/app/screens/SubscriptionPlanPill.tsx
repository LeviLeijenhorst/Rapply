import React from "react"
import { View, StyleSheet } from "react-native"
import Svg, { Path } from "react-native-svg"
import { colors, typography } from "./constants"
import { SubscriptionPlanKey } from "./subscriptionFlowData"
import { Text } from "./Text"

function getPlanLabel(planKey: SubscriptionPlanKey | null) {
  if (planKey === "basis") {
    return "Starter"
  }
  if (planKey === "professioneel") {
    return "Professioneel"
  }
  if (planKey === "fulltime") {
    return "Fulltime"
  }
  return "Gratis"
}

export function SubscriptionPlanPill({ planKey }: { planKey: SubscriptionPlanKey | null }) {
  const label = getPlanLabel(planKey)

  return (
    <View style={styles.pill}>
      {/* Plan icon */}
      <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
        <Path
          d="M10.0506 2.84499C10.8306 2.28499 11.2056 2.56999 10.8856 3.47499L8.86559 9.12999C8.79559 9.32999 8.56059 9.49499 8.35059 9.49499H3.65059C3.44059 9.49499 3.20559 9.32999 3.13559 9.12999L1.06559 3.33499C0.770588 2.50499 1.11559 2.24999 1.82559 2.75999L3.77559 4.15499C4.10059 4.37999 4.47059 4.26499 4.61059 3.89999L5.49059 1.55499C5.77059 0.804993 6.23559 0.804993 6.51559 1.55499L7.39559 3.89999C7.53559 4.26499 7.90559 4.37999 8.22559 4.15499L8.54059 3.92999"
          fill="none"
          stroke={colors.orange}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="M3.25 11H8.75" fill="none" stroke={colors.orange} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M4.75 7H7.25" fill="none" stroke={colors.orange} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>

      {/* Plan name */}
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#FFE9DF",
    borderWidth: 1,
    borderColor: colors.orange,
    padding: 6,
    columnGap: 6,
    shadowColor: colors.textSecondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    lineHeight: 12,
    includeFontPadding: false,
    color: colors.orange,
  },
})


