import React, { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { colors } from '../../theme/colors'
import { Text } from '../Text'
import { ModalCloseDarkIcon } from '../icons/ModalCloseDarkIcon'
import { MijnAbonnementIcon } from '../icons/MijnAbonnementIcon'
import { HoursPerMonthIcon } from '../icons/HoursPerMonthIcon'

type BillingInterval = 'yearly' | 'monthly'
type CancelReasonKey = 'not-working' | 'not-enough-value' | 'too-expensive' | 'other-software' | 'other'

type Props = {
  visible: boolean
  onClose: () => void
}

type PlanCard = {
  key: 'part-time' | 'professional' | 'fulltime' | 'praktijk'
  title: string
  monthlyPriceLabel: string
  yearlyPriceLabel: string
  highlightLabel?: string
  features: { label: string }[]
  primaryActionLabel: string
  primaryActionKind: 'primary' | 'secondary'
  onPressPrimaryAction: () => void
}

export function MySubscriptionModal({ visible, onClose }: Props) {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('yearly')
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [cancelReasonKey, setCancelReasonKey] = useState<CancelReasonKey | null>(null)
  const [cancelOtherText, setCancelOtherText] = useState('')

  useEffect(() => {
    if (!visible) return
    setBillingInterval('yearly')
    setIsCancelOpen(false)
    setCancelReasonKey(null)
    setCancelOtherText('')
  }, [visible])

  const plans = useMemo<PlanCard[]>(() => {
    return [
      {
        key: 'part-time',
        title: 'Part-time',
        yearlyPriceLabel: '€18,-',
        monthlyPriceLabel: '€22,-',
        features: [{ label: '20 gespreksverslagen*' }],
        primaryActionLabel: 'Opzeggen',
        primaryActionKind: 'secondary',
        onPressPrimaryAction: () => setIsCancelOpen(true),
      },
      {
        key: 'professional',
        title: 'Professioneel',
        yearlyPriceLabel: '€28,-',
        monthlyPriceLabel: '€34,-',
        highlightLabel: 'Meest populair',
        features: [{ label: '50 gespreksverslagen*' }],
        primaryActionLabel: 'Pas aan',
        primaryActionKind: 'primary',
        onPressPrimaryAction: () => undefined,
      },
      {
        key: 'fulltime',
        title: 'Fulltime',
        yearlyPriceLabel: '€44,-',
        monthlyPriceLabel: '€52,-',
        features: [{ label: '100 gespreksverslagen*' }],
        primaryActionLabel: 'Pas aan',
        primaryActionKind: 'primary',
        onPressPrimaryAction: () => undefined,
      },
      {
        key: 'praktijk',
        title: 'Praktijk',
        yearlyPriceLabel: 'Op aanvraag',
        monthlyPriceLabel: 'Op aanvraag',
        features: [{ label: 'Afgestemd op behoefte' }],
        primaryActionLabel: 'Contact',
        primaryActionKind: 'primary',
        onPressPrimaryAction: () => undefined,
      },
    ]
  }, [])

  if (!visible) return null

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

  return (
    <AnimatedOverlayModal
      visible={visible}
      onClose={() => {
        if (isCancelOpen) {
          setIsCancelOpen(false)
          return
        }
        onClose()
      }}
      contentContainerStyle={styles.container}
    >
      {/* Modal header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Header icon */}
          <View style={styles.headerIconCircle}>
            <MijnAbonnementIcon />
          </View>
          {/* Header title */}
          <Text isBold style={styles.headerTitle}>
            {isCancelOpen ? 'Abonnement opzeggen :(' : 'Mijn abonnement'}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            if (isCancelOpen) {
              setIsCancelOpen(false)
              return
            }
            onClose()
          }}
          style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}
        >
          {/* Close */}
          <ModalCloseDarkIcon />
        </Pressable>
      </View>

      {/* Modal body */}
      <View style={styles.body}>
        {isCancelOpen ? (
          <View style={styles.cancelBody}>
            {/* Cancel description */}
            <Text style={styles.cancelDescription}>
              Wat jammer dat jij jouw abonnement wil opzeggen. Kan je ons misschien vertellen wat hier de reden voor is?
            </Text>

            {/* Cancel reasons */}
            <View style={styles.cancelGrid}>
              <CancelReasonCard
                label="Het werkt niet goed"
                isSelected={cancelReasonKey === 'not-working'}
                onPress={() => setCancelReasonKey('not-working')}
              />
              <CancelReasonCard
                label="Ik vind het niet genoeg toegevoegde waarden leveren"
                isSelected={cancelReasonKey === 'not-enough-value'}
                onPress={() => setCancelReasonKey('not-enough-value')}
              />
              <CancelReasonCard
                label="Ik vind het te duur"
                isSelected={cancelReasonKey === 'too-expensive'}
                onPress={() => setCancelReasonKey('too-expensive')}
              />
              <View style={styles.otherCard}>
                {/* Other reason */}
                <Text isSemibold style={styles.otherLabel}>
                  Anders namelijk:
                </Text>
                <View style={styles.otherTextArea}>
                  <TextInput
                    value={cancelOtherText}
                    onChangeText={(value) => {
                      setCancelOtherText(value)
                      setCancelReasonKey('other')
                    }}
                    placeholder="Typ hier je antwoord..."
                    placeholderTextColor="#656565"
                    multiline
                    style={[styles.otherInput, inputWebStyle]}
                  />
                </View>
              </View>
              <CancelReasonCard
                label="Ik gebruik een andere software"
                isSelected={cancelReasonKey === 'other-software'}
                onPress={() => setCancelReasonKey('other-software')}
              />
            </View>

            {/* Cancel action */}
            <Pressable onPress={() => undefined} style={({ hovered }) => [styles.cancelButton, hovered ? styles.cancelButtonHovered : undefined]}>
              {/* Cancel subscription */}
              <Text isSemibold style={styles.cancelButtonText}>
                Abonnement opzeggen
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Billing toggle */}
            <BillingToggle billingInterval={billingInterval} onChange={setBillingInterval} />

            {/* Plans */}
            <View style={styles.plansRow}>
              {plans.map((plan) => (
                <PlanCardView key={plan.key} billingInterval={billingInterval} plan={plan} />
              ))}
            </View>
            <Text style={styles.plansFootnoteText}>*er vanuit gaande dat een gesprek gemiddeld een uur duurt</Text>

            {/* Extra minutes */}
            <Pressable onPress={() => undefined} style={({ hovered }) => [styles.buyMinutesButton, hovered ? styles.buyMinutesButtonHovered : undefined]}>
              {/* Buy minutes */}
              <Text isBold style={styles.buyMinutesButtonText}>
                60 minuten bijkopen
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </AnimatedOverlayModal>
  )
}

type BillingToggleProps = {
  billingInterval: BillingInterval
  onChange: (value: BillingInterval) => void
}

function BillingToggle({ billingInterval, onChange }: BillingToggleProps) {
  const isYearly = billingInterval === 'yearly'

  return (
    <View style={styles.toggleRow}>
      {/* Monthly label */}
      <Text style={styles.toggleLabel}>Maandelijks</Text>
      <Pressable
        onPress={() => onChange(isYearly ? 'monthly' : 'yearly')}
        style={({ hovered }) => [styles.toggleTrack, isYearly ? styles.toggleTrackOn : styles.toggleTrackOff, hovered ? styles.toggleTrackHovered : undefined]}
      >
        {/* Toggle thumb */}
        <View style={[styles.toggleThumb, isYearly ? styles.toggleThumbOn : styles.toggleThumbOff]} />
      </Pressable>
      {/* Yearly label */}
      <Text style={styles.toggleLabel}>Jaarlijks</Text>
    </View>
  )
}

type PlanCardViewProps = {
  billingInterval: BillingInterval
  plan: PlanCard
}

function PlanCardView({ billingInterval, plan }: PlanCardViewProps) {
  const priceLabel = billingInterval === 'yearly' ? plan.yearlyPriceLabel : plan.monthlyPriceLabel
  const isOnDemand = priceLabel === 'Op aanvraag'
  const isCurrentPlan = plan.primaryActionLabel === 'Opzeggen'

  return (
    <View style={[styles.planCard, isCurrentPlan ? styles.planCardSelected : undefined]}>
      {/* Plan header */}
      <View style={styles.planHeaderRow}>
        <Text isSemibold style={styles.planTitle}>
          {plan.title}
        </Text>
        {plan.highlightLabel ? (
          <View style={styles.planHighlightBadge}>
            {/* Highlight badge */}
            <Text isSemibold style={styles.planHighlightText}>
              {plan.highlightLabel}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Plan price */}
      <View style={styles.priceRow}>
        <Text isBold style={[styles.priceText, isOnDemand ? styles.priceTextOnDemand : undefined]}>
          {priceLabel}
        </Text>
        {!isOnDemand ? <Text style={styles.priceSuffix}>/maand</Text> : null}
      </View>

      {/* Plan features */}
      <View style={styles.featuresColumn}>
        {plan.features.map((feature) => (
          <View key={`${plan.key}-${feature.label}`} style={styles.featureRow}>
            {/* Feature icon */}
            <HoursPerMonthIcon size={24} />
            <Text style={styles.featureText}>{feature.label}</Text>
          </View>
        ))}
      </View>

      {/* Plan action */}
      <Pressable
        onPress={plan.onPressPrimaryAction}
        style={({ hovered }) => [
          styles.planButton,
          plan.primaryActionKind === 'primary' ? styles.planButtonPrimary : styles.planButtonSecondary,
          hovered ? (plan.primaryActionKind === 'primary' ? styles.planButtonPrimaryHovered : styles.planButtonSecondaryHovered) : undefined,
        ]}
      >
        {/* Plan action label */}
        <Text isBold style={[styles.planButtonText, plan.primaryActionKind === 'primary' ? styles.planButtonTextPrimary : styles.planButtonTextSecondary]}>
          {plan.primaryActionLabel}
        </Text>
      </Pressable>
    </View>
  )
}

type CancelReasonCardProps = {
  label: string
  isSelected: boolean
  onPress: () => void
}

function CancelReasonCard({ label, isSelected, onPress }: CancelReasonCardProps) {
  return (
    <Pressable onPress={onPress} style={({ hovered }) => [styles.cancelCard, isSelected ? styles.cancelCardSelected : undefined, hovered ? styles.cancelCardHovered : undefined]}>
      {/* Cancel reason */}
      <Text style={styles.cancelCardText}>{label}</Text>
    </Pressable>
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  body: {
    width: '100%',
    flex: 1,
    padding: 24,
    gap: 24,
  },
  toggleRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
  },
  toggleTrack: {
    width: 54,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
  },
  toggleTrackOn: {
    backgroundColor: colors.selected,
  },
  toggleTrackOff: {
    backgroundColor: '#C8C8C8',
  },
  toggleTrackHovered: {
    opacity: 0.9,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  toggleThumbOff: {
    alignSelf: 'flex-start',
  },
  plansRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 16,
    flex: 1,
  },
  plansFootnoteText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  planCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 16,
    justifyContent: 'space-between',
  },
  planCardSelected: {
    borderColor: colors.selected,
    borderWidth: 2,
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  planTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  planHighlightBadge: {
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.selected,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planHighlightText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
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
  priceTextOnDemand: {
    fontSize: 32,
    lineHeight: 36,
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
  },
  planButton: {
    height: 48,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planButtonPrimary: {
    backgroundColor: colors.selected,
  },
  planButtonPrimaryHovered: {
    backgroundColor: '#A50058',
  },
  planButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.selected,
  },
  planButtonSecondaryHovered: {
    backgroundColor: 'rgba(190,1,101,0.08)',
  },
  planButtonText: {
    fontSize: 14,
    lineHeight: 18,
  },
  planButtonTextPrimary: {
    color: '#FFFFFF',
  },
  planButtonTextSecondary: {
    color: colors.selected,
  },
  buyMinutesButton: {
    width: '100%',
    height: 72,
    borderRadius: 16,
    backgroundColor: colors.selected,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyMinutesButtonHovered: {
    backgroundColor: '#A50058',
  },
  buyMinutesButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  cancelBody: {
    width: '100%',
    flex: 1,
    gap: 24,
  },
  cancelDescription: {
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
  },
  cancelGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  cancelCard: {
    flexGrow: 1,
    flexBasis: '48%' as any,
    minHeight: 64,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    justifyContent: 'center',
  },
  cancelCardSelected: {
    borderColor: colors.selected,
    borderWidth: 2,
  },
  cancelCardHovered: {
    backgroundColor: colors.hoverBackground,
  },
  cancelCardText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  otherCard: {
    flexGrow: 1,
    flexBasis: '48%' as any,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  otherLabel: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  otherTextArea: {
    width: '100%',
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  otherInput: {
    width: '100%',
    padding: 0,
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
    ...( { textAlignVertical: 'top' } as any ),
  },
  cancelButton: {
    width: '100%',
    height: 72,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.selected,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonHovered: {
    backgroundColor: 'rgba(190,1,101,0.08)',
  },
  cancelButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.selected,
  },
})

