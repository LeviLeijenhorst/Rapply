import React, { useEffect, useMemo, useState } from "react"
import { KeyboardAvoidingView, LayoutAnimation, Platform, ScrollView, StyleSheet, TextInput, UIManager, View } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Icon } from "./Icon"
import { Text } from "./Text"
import { colors, radius, safeAreaBottom, safeAreaTop, spacing, typography, vibrate } from "./constants"
import { subscriptionCancelReasons, subscriptionPlans, type SubscriptionCancelReasonKey, type SubscriptionPlanKey } from "./subscriptionFlowData"
import { OverlayPressable } from "./OverlayPressable"

export default function SubscriptionCancelScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()

  const reasons = useMemo(() => subscriptionCancelReasons, [])

  const defaultPlanKey: SubscriptionPlanKey = subscriptionPlans[0]?.key ?? "basis"
  const selectedPlan: SubscriptionPlanKey = route.params?.selectedPlan ?? defaultPlanKey
  const [selectedReason, setSelectedReason] = useState<SubscriptionCancelReasonKey>(route.params?.selectedReason ?? "app-werkt-niet-goed")
  const [otherReasonText, setOtherReasonText] = useState<string>(route.params?.otherReasonText ?? "")

  useEffect(() => {
    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental?.(true)
    }
  }, [])

  function animateLayout() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
  }

  function handleBackPress() {
    vibrate()
    navigation.goBack()
  }

  function handleReasonPress(reasonKey: SubscriptionCancelReasonKey) {
    vibrate()
    animateLayout()
    setSelectedReason(reasonKey)
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <OverlayPressable accessibilityRole="button" accessibilityLabel="Terug" onPress={handleBackPress} style={styles.headerBackButton}>
            <Icon name="back" size={28} />
          </OverlayPressable>
          <Text style={styles.headerTitle}>Abonnement opzeggen</Text>
          <View style={styles.headerRightSpacer} />
        </View>

        <KeyboardAvoidingView style={styles.keyboardAvoidingView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
            <Text style={styles.lead}>
              Wat jammer dat je jouw abonnement wilt opzeggen.{"\n"}Kan je ons vertellen wat hier de reden voor is?
            </Text>

          {reasons.map((reason, index) => {
            const isSelected = selectedReason === reason.key
            const isOther = reason.key === "anders"

            return (
              <View key={reason.key} style={index === reasons.length - 1 ? undefined : styles.listSpacer}>
                <View style={styles.radioContainer}>
                  <OverlayPressable
                    accessibilityRole="button"
                    onPress={() => handleReasonPress(reason.key)}
                    style={styles.radioRow}
                  >
                    <View style={styles.radioMain}>
                      <Text style={styles.reasonTitle}>{reason.title}</Text>
                    </View>

                    <View style={[styles.dot, isSelected && styles.dotSelected]}>{isSelected && <View style={styles.dotInner} />}</View>
                  </OverlayPressable>

                  {isOther && isSelected && (
                    <View style={styles.otherInputWrap}>
                      <TextInput
                        value={otherReasonText}
                        onChangeText={setOtherReasonText}
                        placeholder="Typ hier je reden..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        style={styles.textbox}
                      />
                    </View>
                  )}
                </View>
              </View>
            )
          })}

          <View style={styles.actions}>
            <OverlayPressable
              accessibilityRole="button"
              onPress={() => {
                vibrate()
                navigation.navigate("SubscriptionTips", { selectedPlan, selectedReason, otherReasonText })
              }}
              style={[styles.buttonBase, styles.buttonCancel]}
            >
              <Text style={styles.buttonCancelText}>Abonnement opzeggen</Text>
            </OverlayPressable>
            <View style={styles.buttonSpacer} />
            <OverlayPressable
              accessibilityRole="button"
              onPress={() => {
                vibrate()
                navigation.navigate("Subscription", { selectedPlan })
              }}
              style={[styles.buttonBase, styles.buttonKeep]}
            >
              <Text style={styles.buttonKeepText}>Toch behouden</Text>
            </OverlayPressable>
          </View>

          <View style={styles.spacer} />
          </ScrollView>
        </KeyboardAvoidingView>
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

  keyboardAvoidingView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: safeAreaBottom + 28 },
  lead: { fontFamily: typography.fontFamily, fontSize: typography.textSize, lineHeight: 22, color: colors.textSecondary, marginBottom: spacing.big },

  radioContainer: { borderRadius: radius, backgroundColor: colors.white, padding: 0, overflow: "hidden" },
  radioRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.big },
  radioMain: { flex: 1, paddingRight: 12 },
  reasonTitle: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },

  listSpacer: { marginBottom: 10 },
  otherInputWrap: { marginTop: spacing.big, paddingHorizontal: spacing.big, paddingBottom: spacing.big },
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

  dot: { width: 20, height: 20, borderRadius: 999, borderWidth: 2, borderColor: "#C9C9C9", alignItems: "center", justifyContent: "center" },
  dotSelected: { borderColor: colors.orange },
  dotInner: { width: 10, height: 10, borderRadius: 999, backgroundColor: colors.orange },

  actions: { marginTop: spacing.big },
  buttonSpacer: { height: spacing.small },
  buttonBase: { height: 52, borderRadius: radius, alignItems: "center", justifyContent: "center" },
  buttonCancel: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.textSecondary + "22" },
  buttonCancelText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },
  buttonKeep: { backgroundColor: colors.orange },
  buttonKeepText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.white },

  spacer: { height: 120 },
})


