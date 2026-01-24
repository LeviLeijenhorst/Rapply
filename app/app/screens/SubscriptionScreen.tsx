import React, { useCallback, useMemo, useRef, useState } from "react"
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native"
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native"
import { Icon } from "./Icon"
import { Text } from "./Text"
import { colors, radius, safeAreaBottom, safeAreaTop, spacing, typography, vibrate } from "./constants"
import Coachees from "./svgs/Coachees"
import Clock from "./svgs/Clock"
import { subscriptionPlans, type SubscriptionPlanKey } from "./subscriptionFlowData"
import { getCustomerInfo, getCurrentPlanKeyFromCustomerInfo, getExtraTranscriptionStoreProduct, getOfferingByLookupKey, purchaseExtraTranscriptionHour, purchaseSubscriptionProductId } from "@/services/revenuecat"
import { normalizeSubscriptionProductId } from "@/services/subscriptionCatalog"
import { getCachedSubscriptionPricing, getSubscriptionPricing, invalidateSubscriptionPricingCache } from "@/services/subscriptionPricing"
import { formatEuroAmount } from "@/utils/formatCurrency"
import { logger } from "@/utils/logger"
import { OverlayPressable } from "./OverlayPressable"

export default function SubscriptionScreen() {
  const navigation = useNavigation<any>()
  const scrollRef = useRef<ScrollView | null>(null)
  const route = useRoute<any>()

  const plans = useMemo(() => subscriptionPlans, [])

  const cached = useMemo(() => getCachedSubscriptionPricing(), [])
  const [currentPlanKey, setCurrentPlanKey] = useState<SubscriptionPlanKey | null>(cached?.currentPlanKey ?? null)
  const [pricesByPlanKey, setPricesByPlanKey] = useState<Record<string, string>>(cached?.pricesByPlanKey ?? {})
  const [loading, setLoading] = useState(!cached)
  const [purchaseInFlightPlanKey, setPurchaseInFlightPlanKey] = useState<SubscriptionPlanKey | null>(null)
  const purchaseInFlightRef = useRef(false)
  const refreshInFlightRef = useRef(false)
  const [extraHourPrice, setExtraHourPrice] = useState<string>(cached?.extraHourPrice ?? "")
  const [extraHourIsBusy, setExtraHourIsBusy] = useState(false)
  const extraHourInFlightRef = useRef(false)
  const [headerHeight, setHeaderHeight] = useState(0)

  function scrollToTop() {
    scrollRef.current?.scrollTo({ y: 0, animated: false })
  }

  async function refreshRevenueCatState() {
    if (refreshInFlightRef.current) return
    refreshInFlightRef.current = true
    try {
      const snapshot = await getSubscriptionPricing()
      setPricesByPlanKey(snapshot.pricesByPlanKey)
      setCurrentPlanKey(snapshot.currentPlanKey)
      setExtraHourPrice(snapshot.extraHourPrice)
      return
    } catch {}
    finally {
      refreshInFlightRef.current = false
    }

    const offering = await getOfferingByLookupKey("default_monthly")
    const availablePackages = Array.isArray(offering?.availablePackages) ? offering.availablePackages : []

    const nextPrices: Record<string, string> = {}
    for (const plan of plans) {
      const productId = typeof (plan as any)?.productId === "string" ? String((plan as any).productId).trim() : ""
      if (!productId) continue
      const p = availablePackages.find((pkg: any) => {
        const id = String(pkg?.product?.identifier || "").trim()
        return normalizeSubscriptionProductId(id) === normalizeSubscriptionProductId(productId)
      })
      const amount = typeof p?.product?.price === "number" ? (p.product.price as number) : null
      if (amount !== null) {
        nextPrices[plan.key] = formatEuroAmount(amount)
      } else {
        const priceString = String(p?.product?.priceString || "").trim()
        if (priceString) {
          nextPrices[plan.key] = priceString
        }
      }
    }

    const info = await getCustomerInfo()
    const planKey = getCurrentPlanKeyFromCustomerInfo(info)

    try {
      const product = await getExtraTranscriptionStoreProduct()
      const amount = typeof product?.price === "number" ? (product.price as number) : null
      if (amount !== null) {
        setExtraHourPrice(formatEuroAmount(amount))
      } else {
        const priceString = String(product?.priceString || "").trim()
        setExtraHourPrice(priceString)
      }
    } catch {
      setExtraHourPrice("")
    }

    setPricesByPlanKey(nextPrices)
    setCurrentPlanKey(planKey)
  }

  // Refreshes subscription and prices when returning to this screen.
  useFocusEffect(
    useCallback(() => {
      ;(async () => {
        try {
          if (!cached) setLoading(true)
          await refreshRevenueCatState()
        } catch {}
        setLoading(false)
      })()
    }, []),
  )

  function handleBackPress() {
    vibrate()
    navigation.goBack()
  }

  async function handlePlanPress(planKey: SubscriptionPlanKey) {
    if (purchaseInFlightRef.current) return
    if (refreshInFlightRef.current) return
    vibrate()
    if (planKey === "praktijk") {
      navigation.navigate("SubscriptionPraktijk")
      return
    }
    const plan = plans.find((p) => p.key === planKey)
    const productId = typeof (plan as any)?.productId === "string" ? String((plan as any).productId).trim() : ""
    if (!productId) return
    try {
      purchaseInFlightRef.current = true
      setPurchaseInFlightPlanKey(planKey)
      const startedAtMs = Date.now()
      logger.info("[Subscription] purchase:start", { planKey, productId })
      const purchasePromise = purchaseSubscriptionProductId({ offeringLookupKey: "default_monthly", productId })
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Purchase timed out")), 25_000)
      })
      await Promise.race([purchasePromise, timeoutPromise])
      logger.info("[Subscription] purchase:done", { planKey, milliseconds: Date.now() - startedAtMs })
      setCurrentPlanKey(planKey)
      invalidateSubscriptionPricingCache()
      const snapshot = await getSubscriptionPricing({ force: true })
      setPricesByPlanKey(snapshot.pricesByPlanKey)
      setCurrentPlanKey(snapshot.currentPlanKey)
      setExtraHourPrice(snapshot.extraHourPrice)
    } catch (e: any) {
      const message = String(e?.message || "Aankoop mislukt")
      try {
        logger.warn("[Subscription] purchase:error", { planKey, productId, message, code: (e as any)?.code })
      } catch {}
      if (message.toLowerCase().includes("purchase timed out")) {
        Alert.alert("Aankoop duurt te lang", "De aankoop bevestiging kwam niet op tijd. Controleer je internet en probeer het opnieuw.")
        return
      }
      if (message.includes("OperationAlreadyInProgressError")) {
        Alert.alert("Even wachten", "Er is al een aankoop bezig. Wacht een paar seconden en probeer het opnieuw.")
        return
      }
      Alert.alert("Aankoop mislukt", message)
    } finally {
      purchaseInFlightRef.current = false
      setPurchaseInFlightPlanKey(null)
    }
  }

  async function handleBuyExtraHourPress() {
    if (extraHourInFlightRef.current) return
    if (purchaseInFlightRef.current) {
      Alert.alert("Even wachten", "Er is al een aankoop bezig. Wacht even en probeer het opnieuw.")
      return
    }
    vibrate()
    try {
      extraHourInFlightRef.current = true
      setExtraHourIsBusy(true)
      logger.info("[Subscription] extraHourPurchase:start")
      await purchaseExtraTranscriptionHour()
      logger.info("[Subscription] extraHourPurchase:done")
      Alert.alert("Gelukt", "Je hebt 60 minuten extra transcriptietijd gekocht.")
    } catch (e: any) {
      const raw = String(e?.message || e || "Aankoop mislukt")
      const isHtml404 = raw.includes("<html") && raw.toLowerCase().includes("404")
      const message = isHtml404
        ? "De server kent deze route nog niet. Deploy de Firebase Functions (billing en subscriptionCancel) en probeer het opnieuw."
        : raw
      if (message.includes("OperationAlreadyInProgressError")) {
        Alert.alert("Even wachten", "Er is al een aankoop bezig. Wacht een paar seconden en probeer het opnieuw.")
        return
      }
      Alert.alert("Aankoop mislukt", message)
    } finally {
      setExtraHourIsBusy(false)
      extraHourInFlightRef.current = false
    }
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View
          onLayout={(event) => {
            const nextHeaderHeight = event?.nativeEvent?.layout?.height ?? 0
            setHeaderHeight(nextHeaderHeight)
          }}
          style={styles.headerRow}
        >
          <OverlayPressable accessibilityRole="button" accessibilityLabel="Terug" onPress={handleBackPress} style={styles.headerBackButton}>
            <Icon name="back" size={28} />
          </OverlayPressable>
          <Text style={styles.headerTitle}>Mijn abonnement</Text>
          <View style={styles.headerRightSpacer} />
        </View>

        {/* Loading overlay */}
        {(purchaseInFlightPlanKey !== null || extraHourIsBusy) && (
          <>
            <View pointerEvents="none" style={[styles.loadingOverlayBackdrop, { top: headerHeight }]} />
            <View pointerEvents="auto" style={[styles.loadingOverlayBlocker, { top: headerHeight }]} />
            <View pointerEvents="none" style={[styles.loadingOverlaySpinner, { top: headerHeight }]}>
              <ActivityIndicator size="large" color={colors.white} />
            </View>
          </>
        )}

        <ScrollView
          ref={(ref) => {
            scrollRef.current = ref
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.plansScreen}>
            <View>
              {plans.map((plan, index) => {
                const isCurrent = currentPlanKey === plan.key
                const anyPurchaseInFlight = purchaseInFlightPlanKey !== null
                const iconColor = isCurrent ? colors.white : colors.textPrimary
                const isPraktijk = plan.key === "praktijk"
                const price = isPraktijk ? String((plan as any)?.price || "") : pricesByPlanKey[plan.key] || (loading ? "..." : "—")
                return (
                  <OverlayPressable
                    key={plan.key}
                    accessibilityRole="button"
                    disabled={anyPurchaseInFlight}
                    accessibilityState={{ disabled: anyPurchaseInFlight }}
                    onPress={() => handlePlanPress(plan.key)}
                    style={[
                      styles.planCard,
                      index === 0 && styles.planCardFirst,
                      isCurrent && styles.planCardSelected,
                      anyPurchaseInFlight && { opacity: 0.7 },
                    ]}
                  >
                    {isCurrent && (
                      <View style={styles.currentPill}>
                        <Text style={styles.currentPillText}>Huidig abonnement</Text>
                      </View>
                    )}

                    <View style={styles.planRow}>
                      <View style={styles.planLeft}>
                        <Text style={[styles.planName, isCurrent && styles.planTextSelected]}>{plan.name}</Text>
                        {plan.features.map((feature, featureIndex) => (
                          <View key={feature.label} style={[styles.featureRow, featureIndex === 0 ? null : styles.featureRowSpacer]}>
                            <View style={[styles.featureIcon, isCurrent && styles.featureIconSelected]}>
                              {feature.icon === "coachees" ? <Coachees color={iconColor} size={14} /> : <Clock color={iconColor} size={14} />}
                            </View>
                            <Text style={[styles.featureText, isCurrent && styles.planTextSelected]}>{feature.label}</Text>
                          </View>
                        ))}
                      </View>

                      <Text style={[styles.price, isPraktijk && styles.pricePraktijk, isCurrent && styles.planTextSelected]}>
                        {price}
                        <Text style={[styles.priceSuffix, isCurrent && styles.planTextSelected]}>{plan.priceSuffix}</Text>
                      </Text>
                    </View>
                  </OverlayPressable>
                )
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                vibrate()
                scrollToTop()
                const defaultPlanKey = plans[0]?.key ?? "basis"
                navigation.navigate("SubscriptionCancel", { selectedPlan: currentPlanKey ?? defaultPlanKey })
              }}
              style={styles.linkWrap}
            >
              {({ pressed }) => (
                <Text style={[styles.linkText, pressed && { color: colors.orange }]}>Abonnement opzeggen</Text>
              )}
            </Pressable>

            <View style={{ height: spacing.big }} />
            {/* Extra uur kopen */}
            <OverlayPressable
              accessibilityRole="button"
              onPress={handleBuyExtraHourPress}
              disabled={extraHourIsBusy || purchaseInFlightPlanKey !== null}
              style={[styles.extraHourButton, extraHourIsBusy && { opacity: 0.7 }]}
            >
              <Text style={styles.extraHourButtonText}>
                {`Koop 60 minuten extra${extraHourPrice ? ` (${extraHourPrice})` : ""}`}
              </Text>
            </OverlayPressable>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundLight, paddingTop: safeAreaTop },
  container: { flex: 1, paddingHorizontal: spacing.big },
  loadingOverlayBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 10,
  },
  loadingOverlayBlocker: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 11,
  },
  loadingOverlaySpinner: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 12,
  },
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
  scrollContent: { flexGrow: 1, paddingBottom: safeAreaBottom + 28 },

  plansScreen: { flex: 1, justifyContent: "space-between" },

  planCard: {
    backgroundColor: colors.white,
    borderRadius: radius,
    paddingHorizontal: spacing.big,
    paddingVertical: spacing.big,
    marginBottom: spacing.big,
  },
  planCardFirst: { marginTop: spacing.big },
  planCardSelected: {
    backgroundColor: colors.orange,
  },
  currentPill: {
    position: "absolute",
    right: spacing.big,
    top: 0,
    transform: [{ translateY: -18 }],
    backgroundColor: colors.white,
    borderRadius: radius,
    padding: spacing.small,
  },
  currentPillText: { fontFamily: typography.fontFamily, fontSize: 12.5, color: colors.textPrimary },

  planRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  planLeft: { flex: 1, paddingRight: 12 },
  planName: { fontFamily: typography.fontFamily, fontSize: 18, color: colors.textPrimary, marginBottom: 10 },
  planTextSelected: { color: colors.white },
  featureRow: { flexDirection: "row", alignItems: "center" },
  featureRowSpacer: { marginTop: 10 },
  featureIcon: { width: 18, height: 18, borderRadius: 6, backgroundColor: colors.orange + "0D", alignItems: "center", justifyContent: "center", marginRight: 10 },
  featureIconSelected: { backgroundColor: "rgba(255,255,255,0.22)" },
  featureText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },
  price: { fontFamily: typography.fontFamily, fontSize: 28, color: colors.textPrimary },
  pricePraktijk: { fontSize: 18 },
  priceSuffix: { fontFamily: typography.fontFamily, fontSize: 14 },

  linkWrap: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.small },
  linkText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary, textDecorationLine: "underline" },

  extraHourButton: {
    height: 52,
    borderRadius: radius,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orange,
  },
  extraHourButtonText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.white, fontWeight: "700" },
})
