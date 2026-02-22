import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'

import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { colors } from '../../theme/colors'
import { Text } from '../Text'
import { ModalCloseDarkIcon } from '../icons/ModalCloseDarkIcon'
import { MijnAbonnementIcon } from '../icons/MijnAbonnementIcon'
import { HoursPerMonthIcon } from '../icons/HoursPerMonthIcon'
import { callSecureApi } from '../../services/secureApi'
import { AppButton } from '../AppButton'
import { cancelMollieSubscription, createMollieCheckout } from '../../services/billing'

type Props = {
  visible: boolean
  onClose: () => void
}

type PricingPlan = {
  id: string
  name: string
  description: string | null
  monthlyPrice: number
  minutesPerMonth: number
}

type PricingPlansResponse = {
  items: PricingPlan[]
}

type PricingVisibilityResponse = {
  canSeePricingPage: boolean
  planId: string | null
}

function formatEuroPrice(value: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function getReportsFromMinutes(minutesPerMonth: number): number {
  return Math.max(0, Math.floor(minutesPerMonth / 60))
}

export function MySubscriptionModal({ visible, onClose }: Props) {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [canSeePricingPage, setCanSeePricingPage] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [isPricingLoading, setIsPricingLoading] = useState(false)
  const [checkoutLoadingPlanId, setCheckoutLoadingPlanId] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [isCancelViewOpen, setIsCancelViewOpen] = useState(false)
  const [isCancelBusy, setIsCancelBusy] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    let isCancelled = false
    setCheckoutLoadingPlanId(null)
    setIsCancelViewOpen(false)
    setIsCancelBusy(false)
    setCancelError(null)

    const loadPricing = async () => {
      try {
        setIsPricingLoading(true)
        const [plansResponse, visibilityResponse] = await Promise.all([
          callSecureApi<PricingPlansResponse>('/pricing/plans/public', {}),
          callSecureApi<PricingVisibilityResponse>('/pricing/me-visibility', {}),
        ])
        if (isCancelled) return
        const nextPlans = Array.isArray(plansResponse.items) ? plansResponse.items : []
        setPricingPlans(nextPlans)
        setCanSeePricingPage(Boolean(visibilityResponse.canSeePricingPage))
        setSelectedPlanId(typeof visibilityResponse.planId === 'string' ? visibilityResponse.planId : null)
      } catch {
        if (isCancelled) return
        setPricingPlans([])
        setCanSeePricingPage(true)
        setSelectedPlanId(null)
      } finally {
        if (isCancelled) return
        setIsPricingLoading(false)
      }
    }

    void loadPricing()

    return () => {
      isCancelled = true
    }
  }, [visible])

  useEffect(() => {
    if (!visible || typeof window === 'undefined') return
    const handleReturnToPage = () => {
      setCheckoutLoadingPlanId(null)
    }
    window.addEventListener('pageshow', handleReturnToPage)
    window.addEventListener('focus', handleReturnToPage)
    return () => {
      window.removeEventListener('pageshow', handleReturnToPage)
      window.removeEventListener('focus', handleReturnToPage)
    }
  }, [visible])

  const plans = useMemo(
    () =>
      pricingPlans.map((plan) => ({
        ...plan,
        reportsPerMonth: getReportsFromMinutes(plan.minutesPerMonth),
      })),
    [pricingPlans],
  )
  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId) ?? null, [plans, selectedPlanId])

  const handleSelectPlan = async (planId: string) => {
    try {
      setCheckoutError(null)
      setCheckoutLoadingPlanId(planId)
      const response = await createMollieCheckout(planId)
      if (response.requiresRedirect === false) {
        const visibilityResponse = await callSecureApi<PricingVisibilityResponse>('/pricing/me-visibility', {})
        setSelectedPlanId(typeof visibilityResponse.planId === 'string' ? visibilityResponse.planId : null)
        setCheckoutLoadingPlanId(null)
        return
      }
      const checkoutUrl = String(response.checkoutUrl || '').trim()
      if (!checkoutUrl) {
        throw new Error('Geen checkout URL ontvangen')
      }
      if (typeof window !== 'undefined') {
        window.location.assign(checkoutUrl)
      }
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Betalen starten lukt nu niet. Probeer het opnieuw.')
      setCheckoutLoadingPlanId(null)
    }
  }

  const handleCancelSubscription = async () => {
    try {
      setCancelError(null)
      setIsCancelBusy(true)
      await cancelMollieSubscription()
      const visibilityResponse = await callSecureApi<PricingVisibilityResponse>('/pricing/me-visibility', {})
      setSelectedPlanId(typeof visibilityResponse.planId === 'string' ? visibilityResponse.planId : null)
      setIsCancelViewOpen(false)
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : 'Opzeggen lukt nu niet. Probeer het opnieuw.')
    } finally {
      setIsCancelBusy(false)
    }
  }

  if (!visible) return null

  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconCircle}>
            <MijnAbonnementIcon />
          </View>
          <Text isBold style={styles.headerTitle}>Mijn abonnement</Text>
        </View>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.closeIconWrap, hovered ? styles.closeIconWrapHovered : undefined]}>
          <ModalCloseDarkIcon />
        </Pressable>
      </View>

      <View style={styles.body}>
        {isPricingLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.selected} />
          </View>
        ) : !canSeePricingPage ? (
          <Text style={styles.infoText}>Prijsinformatie is voor dit account niet zichtbaar.</Text>
        ) : plans.length === 0 ? (
          <Text style={styles.infoText}>Er zijn nog geen abonnementen beschikbaar.</Text>
        ) : (
          <>
            {checkoutError ? <Text style={styles.errorText}>{checkoutError}</Text> : null}
            {isCancelViewOpen ? (
              <View style={styles.cancelView}>
                <Text isSemibold style={styles.cancelTitle}>Abonnement opzeggen</Text>
                <Text style={styles.cancelText}>Weet je zeker dat je je abonnement wilt opzeggen? Je toegang blijft actief tot het einde van de huidige periode.</Text>
                {cancelError ? <Text style={styles.errorText}>{cancelError}</Text> : null}
                <View style={styles.cancelButtonsRow}>
                  <AppButton
                    label="Terug"
                    onPress={() => {
                      if (isCancelBusy) return
                      setIsCancelViewOpen(false)
                    }}
                    variant="neutral"
                    isDisabled={isCancelBusy}
                  />
                  <AppButton
                    label={isCancelBusy ? '' : 'Opzeggen'}
                    leading={isCancelBusy ? <ActivityIndicator size="small" color="#FFFFFF" /> : undefined}
                    onPress={() => {
                      if (isCancelBusy) return
                      void handleCancelSubscription()
                    }}
                    variant="filled"
                    isDisabled={isCancelBusy}
                  />
                </View>
              </View>
            ) : (
              <>
                <View style={styles.plansRow}>
                  {plans.map((plan) => (
                    <View key={plan.id} style={[styles.planCard, selectedPlanId === plan.id ? styles.planCardSelected : undefined]}>
                      <Text isSemibold style={styles.planTitle}>{plan.name}</Text>
                      <View style={styles.priceRow}>
                        <Text isBold style={styles.priceText}>{formatEuroPrice(plan.monthlyPrice)}</Text>
                        <Text style={styles.priceSuffix}>/maand</Text>
                      </View>
                      <View style={styles.featuresColumn}>
                        <View style={styles.featureRow}>
                          <HoursPerMonthIcon size={24} />
                          <Text style={styles.featureText}>{plan.reportsPerMonth} gespreksverslagen</Text>
                        </View>
                        <View style={styles.featureRow}>
                          <HoursPerMonthIcon size={24} />
                          <Text style={styles.featureText}>{plan.minutesPerMonth} minuten per maand</Text>
                        </View>
                      </View>
                      <AppButton
                        label={
                          checkoutLoadingPlanId === plan.id
                            ? ''
                            : selectedPlanId === plan.id
                            ? 'Huidig abonnement'
                            : selectedPlan && plan.monthlyPrice < selectedPlan.monthlyPrice
                              ? 'Downgraden'
                              : 'Upgraden'
                        }
                        leading={checkoutLoadingPlanId === plan.id ? <ActivityIndicator size="small" color="#FFFFFF" /> : undefined}
                        onPress={() => {
                          if (selectedPlanId === plan.id || checkoutLoadingPlanId) return
                          void handleSelectPlan(plan.id)
                        }}
                        variant={selectedPlanId === plan.id ? 'neutral' : 'filled'}
                        isDisabled={selectedPlanId === plan.id || !!checkoutLoadingPlanId}
                      />
                    </View>
                  ))}
                </View>
                <Pressable onPress={() => setIsCancelViewOpen(true)} style={({ hovered }) => [styles.cancelLinkWrap, hovered ? styles.cancelLinkWrapHovered : undefined]}>
                  <Text style={styles.cancelLinkText}>opzeggen</Text>
                </Pressable>
              </>
            )}
            <Text style={styles.footnoteText}>Gespreksverslagen worden berekend op basis van 60 minuten per gesprek.</Text>
          </>
        )}
      </View>
    </AnimatedOverlayModal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 1180,
    maxWidth: '90vw',
    ...( { height: 'min(680px, 90vh)' } as any ),
    backgroundColor: colors.surface,
    borderRadius: 16,
    ...( { boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } as any ),
    overflow: 'hidden',
  },
  header: {
    width: '100%',
    height: 88,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FCE3F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.textStrong,
  },
  closeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconWrapHovered: {
    backgroundColor: colors.hoverBackground,
  },
  body: {
    width: '100%',
    flex: 1,
    padding: 24,
    gap: 16,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#B42318',
  },
  plansRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 16,
    flex: 1,
  },
  planCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 16,
  },
  planCardSelected: {
    borderColor: colors.selected,
    borderWidth: 2,
  },
  planTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  priceText: {
    fontSize: 44,
    lineHeight: 48,
    color: colors.textStrong,
  },
  priceSuffix: {
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
    marginBottom: 8,
  },
  featuresColumn: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
    flexShrink: 1,
  },
  footnoteText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  cancelLinkWrap: {
    alignSelf: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cancelLinkWrapHovered: {
    backgroundColor: colors.hoverBackground,
  },
  cancelLinkText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  cancelView: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 8,
  },
  cancelTitle: {
    fontSize: 20,
    lineHeight: 24,
    color: colors.textStrong,
  },
  cancelText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  cancelButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
})
