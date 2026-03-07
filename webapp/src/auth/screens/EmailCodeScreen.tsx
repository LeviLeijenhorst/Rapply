import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'

import { BackButton } from '../components/BackButton'
import { AuthCard } from '../components/AuthCard'
import { AuthCodeEntry } from '../components/AuthCodeEntry'
import { AuthProgressIndicator } from '../components/AuthProgressIndicator'
import { AuthResendLink } from '../components/AuthResendLink'
import { Text } from '../../ui/Text'
import { colors } from '../../design/theme/colors'
import { maskEmail } from '../utils/masking'

type Props = {
  email: string
  onBack: () => void
  onContinue: () => void
}

export function EmailCodeScreen({ email, onBack, onContinue }: Props) {
  const { width } = useWindowDimensions()
  const isCompact = width < 900
  const [code, setCode] = useState('')

  const maskedEmail = useMemo(() => maskEmail(email), [email])
  const canContinue = code.length === 6

  return (
    <AuthCard>
      <View style={[styles.container, isCompact ? styles.containerCompact : undefined]}>
        {/* Header */}
        <View style={styles.headerRow}>
          {/* Back */}
          <BackButton onPress={onBack} />
          {/* Progress */}
          <View style={styles.progressContainer}>
            <AuthProgressIndicator stepsCount={3} activeStepsCount={2} />
          </View>
          <View style={styles.backSpacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text isBold style={[styles.title, isCompact ? styles.titleCompact : undefined]}>
            Er is een Email met een code verstuurd naar {maskedEmail}
          </Text>
          {/* Subtitle */}
          <Text isSemibold style={styles.subtitle}>
            Vul de code hier in om door te gaan
          </Text>

          {/* Code entry */}
          <View style={[styles.codeEntryContainer, isCompact ? styles.codeEntryContainerCompact : undefined]}>
            <AuthCodeEntry value={code} onChangeValue={setCode} length={6} />
          </View>

          {/* Resend */}
          <View style={styles.resendContainer}>
            <Text isSemibold style={styles.resendLabel}>
              Geen code ontvangen?
            </Text>
            <AuthResendLink label="Verzend opnieuw" onPress={() => {}} />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <View style={styles.footerSpacer} />
          <Pressable
            disabled={!canContinue}
            onPress={onContinue}
            style={({ hovered }) => [
              styles.primaryButton,
              isCompact ? styles.primaryButtonCompact : undefined,
              hovered ? styles.primaryButtonHovered : undefined,
              !canContinue ? styles.primaryButtonDisabled : undefined,
            ]}
          >
            {/* Continue */}
            <Text isBold style={styles.primaryButtonText}>
              Doorgaan
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthCard>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 720,
    padding: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    gap: 24,
  },
  containerCompact: {
    minHeight: 0,
    padding: 20,
    gap: 18,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: 40,
    height: 40,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    color: colors.textStrong,
    textAlign: 'center',
    maxWidth: 820,
  },
  titleCompact: {
    fontSize: 19,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
    textAlign: 'center',
  },
  codeEntryContainer: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeEntryContainerCompact: {
    padding: 12,
  },
  resendContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  resendLabel: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  footerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerSpacer: {
    flex: 1,
  },
  primaryButton: {
    minWidth: 220,
    height: 46,
    borderRadius: 8,
    backgroundColor: colors.selected,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonCompact: {
    width: '100%',
    minWidth: 0,
    height: 52,
  },
  primaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})


