import React, { useMemo } from 'react'
import { Image, Pressable, StyleSheet, View } from 'react-native'

import { BackButton } from '../components/BackButton'
import { AuthCard } from '../components/AuthCard'
import { AuthResendLink } from '../components/AuthResendLink'
import { Text } from '../../ui/Text'
import { colors } from '../../design/theme/colors'
import { maskEmail } from '../utils/masking'

type Props = {
  email: string
  onBack: () => void
  onContinue: () => void
}

export function PasswordResetSentScreen({ email, onBack, onContinue }: Props) {
  const maskedEmail = useMemo(() => maskEmail(email), [email])

  return (
    <AuthCard>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          {/* Back */}
          <BackButton onPress={onBack} />
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text isBold style={styles.title}>
            Er is een Email met een link verstuurd naar {maskedEmail}
          </Text>
          {/* Subtitle */}
          <Text isSemibold style={styles.subtitle}>
            Open de link om je wachtwoord te resetten
          </Text>

          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image source={require('../../../assets/authhuman_3.png')} resizeMode="contain" style={styles.illustrationImage} />
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
          <Pressable onPress={onContinue} style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined]}>
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
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
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
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
    textAlign: 'center',
  },
  illustrationContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  illustrationImage: {
    width: 260,
    height: 260,
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
  primaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})


