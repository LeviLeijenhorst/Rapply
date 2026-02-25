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

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function MySubscriptionModal({ visible, onClose }: Props) {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [canSeePricingPage, setCanSeePricingPage] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [isPricingLoading, setIsPricingLoading] = useState(false)
  const [checkoutLoadingPlanId, setCheckoutLoadingPlanId] = useState<string | null>(null)
  const [isCancelBusy, setIsCancelBusy] = useState(false)
  const [hourlyRate, setHourlyRate] = useState(75)
  const [sessionsPerWeek, setSessionsPerWeek] = useState(10)
  const [currentMinutes, setCurrentMinutes] = useState(20)
  const [newSessionsPercentage, setNewSessionsPercentage] = useState(50)
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
  const monthlySubscriptionCost = primaryPlan?.monthlyPrice ?? 0
  const toolMinutes = 8
  const weeksPerYear = 46
  const currentHoursWeek = (sessionsPerWeek * currentMinutes) / 60
  const toolHoursWeek = (sessionsPerWeek * toolMinutes) / 60
  const hoursSavedWeek = Math.max(0, currentHoursWeek - toolHoursWeek)
  const eurSavedWeek = hoursSavedWeek * hourlyRate * (newSessionsPercentage / 100)
  const eurSavedMonth = eurSavedWeek * 4.33
  const eurSavedYear = eurSavedWeek * weeksPerYear
  const monthlyNetProfit = eurSavedMonth - monthlySubscriptionCost

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
                      <Text isSemibold style={styles.fieldTitle}>Uurtarief (EUR)</Text>
                      <View style={styles.inputRow}>
                        <View style={styles.textInputWrap}>
                          <TextInput
                            value={String(hourlyRate)}
                            onChangeText={(value) => {
                              const digitsOnly = value.replace(/[^\d]/g, '')
                              setHourlyRate(clamp(digitsOnly ? Number(digitsOnly) : 0, 20, 250))
                            }}
                            keyboardType="numeric"
                            style={[styles.textInput, inputWebStyle]}
                            placeholder="75"
                            placeholderTextColor={colors.textSecondary}
                          />
                        </View>
                        <Text style={styles.inputUnit}>EUR</Text>
                      </View>
                      <View style={styles.rangeWrap}>
                        <input
                          type="range"
                          min={20}
                          max={250}
                          step={1}
                          value={hourlyRate}
                          onChange={(event) => setHourlyRate(Number(event.currentTarget.value))}
                          style={{ ...(styles.rangeInput as any), ...rangeInputWebStyle }}
                        />
                      </View>
                    </View>

                    <View style={styles.calculatorSection}>
                      <Text isSemibold style={styles.fieldTitle}>Sessies per week</Text>
                      <View style={styles.inputRow}>
                        <View style={styles.textInputWrap}>
                          <TextInput
                            value={String(sessionsPerWeek)}
                            onChangeText={(value) => {
                              const digitsOnly = value.replace(/[^\d]/g, '')
                              setSessionsPerWeek(clamp(digitsOnly ? Number(digitsOnly) : 0, 1, 40))
                            }}
                            keyboardType="numeric"
                            style={[styles.textInput, inputWebStyle]}
                            placeholder="10"
                            placeholderTextColor={colors.textSecondary}
                          />
                        </View>
                        <Text style={styles.inputUnit}>sessies</Text>
                      </View>
                      <View style={styles.rangeWrap}>
                        <input
                          type="range"
                          min={1}
                          max={40}
                          step={1}
                          value={sessionsPerWeek}
                          onChange={(event) => setSessionsPerWeek(Number(event.currentTarget.value))}
                          style={{ ...(styles.rangeInput as any), ...rangeInputWebStyle }}
                        />
                      </View>
                    </View>

                    <View style={styles.calculatorSection}>
                      <Text isSemibold style={styles.fieldTitle}>Minuten verslaglegging per sessie (nu)</Text>
                      <View style={styles.inputRow}>
                        <View style={styles.textInputWrap}>
                          <TextInput
                            value={String(currentMinutes)}
                            onChangeText={(value) => {
                              const digitsOnly = value.replace(/[^\d]/g, '')
                              setCurrentMinutes(clamp(digitsOnly ? Number(digitsOnly) : 0, 5, 90))
                            }}
                            keyboardType="numeric"
                            style={[styles.textInput, inputWebStyle]}
                            placeholder="20"
                            placeholderTextColor={colors.textSecondary}
                          />
                        </View>
                        <Text style={styles.inputUnit}>min</Text>
                      </View>
                      <View style={styles.rangeWrap}>
                        <input
                          type="range"
                          min={5}
                          max={90}
                          step={1}
                          value={currentMinutes}
                          onChange={(event) => setCurrentMinutes(Number(event.currentTarget.value))}
                          style={{ ...(styles.rangeInput as any), ...rangeInputWebStyle }}
                        />
                      </View>
                    </View>

                    <View style={styles.calculatorSection}>
                      <Text isSemibold style={styles.fieldTitle}>
                        In welk deel van je bespaarde tijd help je nieuwe mensen?
                      </Text>
                      <View style={styles.inputRow}>
                        <View style={styles.textInputWrap}>
                          <TextInput
                            value={String(newSessionsPercentage)}
                            onChangeText={(value) => {
                              const digitsOnly = value.replace(/[^\d]/g, '')
                              setNewSessionsPercentage(clamp(digitsOnly ? Number(digitsOnly) : 0, 0, 100))
                            }}
                            keyboardType="numeric"
                            style={[styles.textInput, inputWebStyle]}
                            placeholder="50"
                            placeholderTextColor={colors.textSecondary}
                          />
                        </View>
                        <Text style={styles.inputUnit}>%</Text>
                      </View>
                      <View style={styles.rangeWrap}>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={newSessionsPercentage}
                          onChange={(event) => setNewSessionsPercentage(Number(event.currentTarget.value))}
                          style={{ ...(styles.rangeInput as any), ...rangeInputWebStyle }}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.roiCard}>
                    <View style={styles.metricGrid}>
                      <View style={styles.metricTile}>
                        <Text style={styles.metricLabel}>Uren bespaard per week</Text>
                        <Text isSemibold style={styles.metricValue}>{hoursSavedWeek.toFixed(1).replace('.', ',')} uur</Text>
                      </View>
                      <View style={styles.metricTile}>
                        <Text style={styles.metricLabel}>Besparing per maand</Text>
                        <Text isSemibold style={styles.metricValue}>{formatEuroPrice(eurSavedMonth)}</Text>
                      </View>
                      <View style={styles.metricTile}>
                        <Text style={styles.metricLabel}>Besparing per jaar</Text>
                        <Text isSemibold style={styles.metricValue}>{formatEuroPrice(eurSavedYear)}</Text>
                      </View>
                    </View>
                    <View style={styles.netSavingCard}>
                      <Text style={styles.netSavingLabel}>Netto besparing per maand</Text>
                      <Text style={styles.netSavingFormula}>
                        {`${formatEuroPrice(eurSavedMonth)} - `}
                        <Text style={styles.netSavingFormulaPrice}>
                          {`${formatEuroPrice(monthlySubscriptionCost)}`}
                          <Text style={styles.netSavingFormulaStar}>*</Text>
                        </Text>
                        {` = ${formatEuroPrice(monthlyNetProfit)}`}
                      </Text>
                    </View>
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
    padding: 16,
    gap: 12,
  },
  calculatorSection: {
    gap: 6,
  },
  fieldTitle: {
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInputWrap: {
    width: '50%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  inputUnit: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  textInput: {
    width: '100%',
    fontSize: 13,
    lineHeight: 16,
    color: colors.textStrong,
  },
  roiCard: {
    flex: 1,
    minWidth: 320,
    borderRadius: 16,
    backgroundColor: '#FEFEFE',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 12,
  },
  metricGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricTile: {
    flexBasis: '48%' as any,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 4,
  },
  metricLabel: {
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  metricValue: {
    fontSize: 20,
    lineHeight: 24,
    color: colors.textStrong,
  },
  netSavingCard: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 4,
  },
  netSavingLabel: {
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  netSavingFormula: {
    fontSize: 20,
    lineHeight: 24,
    color: colors.textStrong,
    fontWeight: '600',
  },
  netSavingFormulaPrice: {
    position: 'relative',
    paddingRight: 6,
  },
  netSavingFormulaStar: {
    fontSize: 10,
    lineHeight: 10,
    transform: [{ translateY: -6 }],
  },
  netSavingNote: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
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
