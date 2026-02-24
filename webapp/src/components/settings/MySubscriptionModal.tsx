import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { colors } from '../../theme/colors'
import { Text } from '../Text'
import { ModalCloseDarkIcon } from '../icons/ModalCloseDarkIcon'
import { MijnAbonnementIcon } from '../icons/MijnAbonnementIcon'
import { HoursPerMonthIcon } from '../icons/HoursPerMonthIcon'
import { VerslagGenererenIcon } from '../icons/VerslagGenererenIcon'
import { CalendarCircleIcon } from '../icons/CalendarCircleIcon'
import { StandaardVerslagIcon } from '../icons/StandaardVerslagIcon'
import { CoacheesIcon } from '../icons/CoacheesIcon'
import { SecuritySafeIcon } from '../icons/SecuritySafeIcon'
import { callSecureApi } from '../../services/secureApi'
import { AppButton } from '../AppButton'
import { cancelMollieSubscription, createMollieCheckout } from '../../services/billing'
import { toUserFriendlyErrorMessage } from '../../utils/userFriendlyError'
import { useToast } from '../../toast/ToastProvider'
import { requestSubscriptionReturnResumeIfDraftAvailable } from '../newSession/subscriptionReturnDraftStore'

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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function MySubscriptionModal({ visible, onClose }: Props) {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [canSeePricingPage, setCanSeePricingPage] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [isPricingLoading, setIsPricingLoading] = useState(false)
  const [checkoutLoadingPlanId, setCheckoutLoadingPlanId] = useState<string | null>(null)
  const [isCancelBusy, setIsCancelBusy] = useState(false)
  const [hoursSavedPerWeek, setHoursSavedPerWeek] = useState(4)
  const [usedTimePercent, setUsedTimePercent] = useState(55)
  const [averageSessionPrice, setAverageSessionPrice] = useState(150)
  const { showErrorToast } = useToast()
  const inputWebStyle = useMemo(() => ({ outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any), [])
  const rangeInputWebStyle = useMemo(() => ({ cursor: 'pointer', accentColor: colors.selected } as any), [])

  useEffect(() => {
    if (!visible) return
    let isCancelled = false
    setCheckoutLoadingPlanId(null)
    setIsCancelBusy(false)

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

  const plans = useMemo(() => pricingPlans, [pricingPlans])
  const primaryPlan = plans[0] ?? null
  const estimatedReportsPerMonth = primaryPlan ? Math.max(0, Math.floor(primaryPlan.minutesPerMonth / 60)) : 0
  const savedHoursPerMonth = hoursSavedPerWeek * 4.33
  const estimatedSessionsPerMonth = Math.max(0, savedHoursPerMonth * (usedTimePercent / 100))
  const monthlyRevenue = Math.max(0, estimatedSessionsPerMonth * averageSessionPrice)
  const monthlySubscriptionCost = primaryPlan?.monthlyPrice ?? 0
  const monthlyNetProfit = monthlyRevenue - monthlySubscriptionCost

  const handleSelectPlan = async (planId: string) => {
    try {
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
        requestSubscriptionReturnResumeIfDraftAvailable()
        window.location.assign(checkoutUrl)
      }
    } catch (error) {
      showErrorToast(
        toUserFriendlyErrorMessage(error, { fallback: 'Betalen starten lukt nu niet. Probeer het opnieuw.' }),
        'Betalen starten lukt nu niet. Probeer het opnieuw.',
      )
      setCheckoutLoadingPlanId(null)
    }
  }

  const handleCancelSubscription = async () => {
    try {
      setIsCancelBusy(true)
      await cancelMollieSubscription()
      const visibilityResponse = await callSecureApi<PricingVisibilityResponse>('/pricing/me-visibility', {})
      setSelectedPlanId(typeof visibilityResponse.planId === 'string' ? visibilityResponse.planId : null)
    } catch (error) {
      showErrorToast(
        toUserFriendlyErrorMessage(error, { fallback: 'Opzeggen lukt nu niet. Probeer het opnieuw.' }),
        'Opzeggen lukt nu niet. Probeer het opnieuw.',
      )
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
        ) : !primaryPlan ? (
          <Text style={styles.infoText}>Er zijn nog geen abonnementen beschikbaar.</Text>
        ) : (
          <>
            <>
              <View style={styles.plansRow}>
                  <View style={styles.calculatorCard}>
                    <View style={styles.calculatorSection}>
                      <View style={styles.fieldLabelRow}>
                        <Text isSemibold style={styles.fieldTitle}>Tijdsbesparing per week (uren)</Text>
                        <View style={styles.fieldValueBadge}>
                          <Text style={styles.fieldValueBadgeText}>{hoursSavedPerWeek.toFixed(1).replace('.', ',')} uur</Text>
                        </View>
                      </View>
                      <View style={styles.rangeWrap}>
                        <input
                          type="range"
                          min={0.3}
                          max={16}
                          step={0.1}
                          value={hoursSavedPerWeek}
                          onChange={(event) => setHoursSavedPerWeek(Number(event.currentTarget.value))}
                          style={{ ...(styles.rangeInput as any), ...rangeInputWebStyle }}
                        />
                      </View>
                      <View style={styles.rangeLegendRow}>
                        <Text style={styles.rangeLegendText}>0,3 uur</Text>
                        <Text style={styles.rangeLegendText}>16 uur</Text>
                      </View>
                      <Text style={styles.calculatorHintText}>Schat hoeveel uren per week je vrijspeelt doordat verslaglegging sneller gaat.</Text>
                    </View>

                    <View style={styles.calculatorSection}>
                      <View style={styles.fieldLabelRow}>
                        <Text isSemibold style={styles.fieldTitle}>Percentage ingevulde tijd</Text>
                        <View style={styles.fieldValueBadge}>
                          <Text style={styles.fieldValueBadgeText}>{usedTimePercent}%</Text>
                        </View>
                      </View>
                      <View style={styles.rangeWrap}>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={usedTimePercent}
                          onChange={(event) => setUsedTimePercent(Number(event.currentTarget.value))}
                          style={{ ...(styles.rangeInput as any), ...rangeInputWebStyle }}
                        />
                      </View>
                      <View style={styles.rangeLegendRow}>
                        <Text style={styles.rangeLegendText}>0%</Text>
                        <Text style={styles.rangeLegendText}>100%</Text>
                      </View>
                      <Text style={styles.calculatorHintText}>Welk deel van je bespaarde tijd zet je om in extra sessies?</Text>
                    </View>

                    <View style={styles.calculatorSection}>
                      <Text isSemibold style={styles.fieldTitle}>Gemiddelde prijs per sessie (EUR)</Text>
                      <View style={styles.textInputWrap}>
                        <TextInput
                          value={String(averageSessionPrice)}
                          onChangeText={(value) => {
                            const digitsOnly = value.replace(/[^\d]/g, '')
                            setAverageSessionPrice(digitsOnly ? Number(digitsOnly) : 0)
                          }}
                          keyboardType="numeric"
                          style={[styles.textInput, inputWebStyle]}
                          placeholder="150"
                          placeholderTextColor={colors.textSecondary}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.roiCard}>
                    <View style={styles.roiRow}>
                      <Text isSemibold style={styles.roiLabel}>Nieuwe sessies per maand</Text>
                      <Text isSemibold style={styles.roiValue}>{estimatedSessionsPerMonth.toFixed(1).replace('.', ',')}</Text>
                    </View>
                    <View style={styles.roiRow}>
                      <Text isSemibold style={styles.roiLabel}>Opbrengst per maand</Text>
                      <Text isSemibold style={styles.roiValue}>{formatEuroPrice(monthlyRevenue)}</Text>
                    </View>
                    <View style={styles.roiRow}>
                      <Text isSemibold style={styles.roiLabel}>Kosten CoachScribe</Text>
                      <Text isSemibold style={styles.roiValue}>{formatEuroPrice(monthlySubscriptionCost)}</Text>
                    </View>
                    <View style={styles.roiDivider} />
                    <Text isSemibold style={styles.roiNetLabel}>Netto opbrengst per maand</Text>
                    <Text isBold style={styles.roiNetValue}>{formatEuroPrice(monthlyNetProfit)}</Text>
                    <Text style={styles.roiNetHint}>
                      Dit is je extra opbrengst{' '}
                      <Text isBold style={styles.roiNetHint}>minus de kosten van CoachScribe.</Text>
                    </Text>
                  </View>

                  <View style={[styles.planCard, selectedPlanId === primaryPlan.id ? styles.planCardSelected : undefined]}>
                    <Text isSemibold style={styles.planTitle}>{primaryPlan.name}</Text>
                    <View style={styles.priceRow}>
                      <Text isBold style={styles.priceText}>{formatEuroPrice(primaryPlan.monthlyPrice)}</Text>
                      <Text style={styles.priceSuffix}>/maand</Text>
                    </View>
                    <View style={styles.featuresColumn}>
                      <View style={styles.featureRow}>
                        <VerslagGenererenIcon size={22} color={colors.selected} />
                        <Text style={styles.featureText}>{`${estimatedReportsPerMonth} gespreksverslagen`}</Text>
                      </View>
                      <View style={styles.featureRow}>
                        <HoursPerMonthIcon size={24} />
                        <Text style={styles.featureText}>{`${primaryPlan.minutesPerMonth} transcriptieminuten per maand`}</Text>
                      </View>
                      <View style={styles.featureRow}>
                        <CalendarCircleIcon size={24} color={colors.selected} />
                        <Text style={styles.featureText}>Uren tijdsbesparing per maand</Text>
                      </View>
                      <View style={styles.featureRow}>
                        <StandaardVerslagIcon color={colors.selected} size={20} />
                        <Text style={styles.featureText}>Automatisch opgebouwde, consistente rapportages</Text>
                      </View>
                      <View style={styles.featureRow}>
                        <SecuritySafeIcon color={colors.selected} size={22} />
                        <Text style={styles.featureText}>Veilige opslag binnen de EU</Text>
                      </View>
                      <View style={styles.featureRow}>
                        <CoacheesIcon color={colors.selected} size={22} />
                        <Text style={styles.featureText}>Alle informatie over al je cliënten op één plek</Text>
                      </View>
                    </View>
                    <AppButton
                      label={checkoutLoadingPlanId === primaryPlan.id ? '' : selectedPlanId === primaryPlan.id ? 'geabonneerd' : 'Abonneren'}
                      leading={checkoutLoadingPlanId === primaryPlan.id ? <ActivityIndicator size="small" color="#FFFFFF" /> : undefined}
                      style={[
                        styles.subscribeButton,
                        selectedPlanId === primaryPlan.id ? styles.subscribeButtonSubscribed : styles.subscribeButtonCta,
                      ]}
                      onPress={() => {
                        if (selectedPlanId === primaryPlan.id || checkoutLoadingPlanId) return
                        void handleSelectPlan(primaryPlan.id)
                      }}
                      variant={selectedPlanId === primaryPlan.id ? 'neutral' : 'filled'}
                      isDisabled={selectedPlanId === primaryPlan.id || !!checkoutLoadingPlanId}
                    />
                  </View>
              </View>
              <View style={styles.footerRow}>
                <Text style={styles.footnoteText}>Gespreksverslagen worden berekend op basis van 60 minuten per gesprek.</Text>
                {selectedPlanId ? (
                <Pressable
                  onPress={() => {
                    if (isCancelBusy) return
                    if (typeof window !== 'undefined') {
                      const confirmed = window.confirm('Weet je zeker dat je je abonnement wilt opzeggen? Je toegang blijft actief tot het einde van de huidige periode.')
                      if (!confirmed) return
                    }
                    void handleCancelSubscription()
                  }}
                  style={({ hovered }) => [styles.cancelLinkWrap, hovered ? styles.cancelLinkWrapHovered : undefined]}
                >
                  <Text style={styles.cancelLinkText}>{isCancelBusy ? 'bezig...' : 'opzeggen'}</Text>
                </Pressable>
                ) : (
                  <View />
                )}
              </View>
            </>
          </>
        )}
      </View>
    </AnimatedOverlayModal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 1360,
    maxWidth: '96vw',
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
  plansRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 16,
    flex: 1,
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
  calculatorCard: {
    flex: 1,
    minWidth: 320,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 20,
  },
  calculatorSection: {
    gap: 8,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fieldTitle: {
    fontSize: 20,
    lineHeight: 24,
    color: colors.textStrong,
  },
  fieldValueBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fieldValueBadgeText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  rangeWrap: {
    width: '100%',
  },
  rangeInput: {
    width: '100%',
  },
  rangeLegendRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangeLegendText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  calculatorHintText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  textInputWrap: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textInput: {
    width: '100%',
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  roiCard: {
    flex: 1,
    minWidth: 320,
    borderRadius: 16,
    backgroundColor: colors.selected,
    padding: 24,
    gap: 14,
  },
  roiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  roiLabel: {
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
    flex: 1,
  },
  roiValue: {
    fontSize: 22,
    lineHeight: 28,
    color: '#FFFFFF',
  },
  roiDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginVertical: 2,
  },
  roiNetLabel: {
    fontSize: 26,
    lineHeight: 30,
    color: '#FFFFFF',
  },
  roiNetValue: {
    fontSize: 42,
    lineHeight: 46,
    color: '#FFFFFF',
  },
  roiNetHint: {
    fontSize: 20,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.9)',
  },
  planCard: {
    flex: 1,
    minWidth: 320,
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
  subscribeButton: {
    marginTop: 'auto',
    height: 46,
    borderRadius: 14,
  },
  subscribeButtonCta: {
    borderColor: '#8A004A',
    ...( { backgroundColor: colors.selected } as any ),
  },
  subscribeButtonSubscribed: {
    ...( { boxShadow: 'none' } as any ),
  },
  footnoteText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    flex: 1,
  },
  footerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
})
