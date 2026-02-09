import React, { useState } from 'react'
import { Image, Pressable, StyleSheet, View } from 'react-native'

import { AuthCard } from '../components/AuthCard'
import { CoachscribeLogo } from '../../components/CoachscribeLogo'
import { CheckmarkIcon } from '../../components/icons/CheckmarkIcon'
import { Text } from '../../components/Text'
import { colors } from '../../theme/colors'

type Props = {
  mode: 'inloggen' | 'registreren'
  onStartLogin?: () => void
}

export function AuthEntryScreen({ mode, onStartLogin }: Props) {
  const [hasAgreedToPolicy, setHasAgreedToPolicy] = useState(false)
  const illustrationSource = require('../../../assets/authhumans_1.png')

  async function startLogin() {
    try {
      onStartLogin?.()
      const { signInWithEntra } = await import('../entraAuth')
      await signInWithEntra()
    } catch (error) {
      console.error('Entra sign in failed:', error)
      alert('Inloggen mislukt. Probeer het opnieuw.')
    }
  }

  const isActionDisabled = !hasAgreedToPolicy

  return (
    <AuthCard>
      {/* Welcome layout */}
      <View style={styles.layoutRow}>
        {/* Branding panel */}
        <View style={styles.brandingPanel}>
          {/* Brand header */}
          <View style={styles.brandHeader}>
            {/* Brand logo */}
            <CoachscribeLogo />
            {/* Brand tagline */}
            <Text style={styles.brandTagline}>Focus je op wat er echt toe doet</Text>
          </View>
          {/* Welcome illustration */}
          <View style={styles.illustrationContainer}>
            <Image source={illustrationSource} resizeMode="contain" style={styles.illustrationImage} />
          </View>
        </View>

        {/* Welcome panel */}
        <View style={styles.welcomePanel}>
          {/* Welcome content */}
          <View style={styles.welcomeContent}>
            {/* Welcome title */}
            <Text isBold style={styles.welcomeTitle}>
              Welkom
            </Text>
            {/* Welcome description */}
            <Text style={styles.welcomeParagraph}>
              CoachScribe helpt coaches bij de verslaglegging van hun sessies en het bewaren van het overzicht.
            </Text>
            {/* Welcome description */}
            <Text style={styles.welcomeParagraph}>
              Gesprekken worden veilig vastgelegd en georganiseerd, zodat jij je volledig kunt richten op de cliënt.
            </Text>
            {/* Continue button */}
            <Pressable
              onPress={isActionDisabled ? undefined : startLogin}
              style={({ hovered }) => [
                styles.actionButton,
                hovered ? styles.actionButtonHovered : undefined,
                isActionDisabled ? styles.actionButtonDisabled : undefined,
              ]}
            >
              <Text isBold style={styles.actionButtonText}>
                Doorgaan
              </Text>
            </Pressable>
            {/* Agreement checkbox */}
            <Pressable style={styles.checkboxRow} onPress={() => setHasAgreedToPolicy((value) => !value)}>
              <View style={[styles.checkbox, hasAgreedToPolicy ? styles.checkboxChecked : undefined]}>
                {hasAgreedToPolicy ? <CheckmarkIcon color={colors.selected} width={14} height={12} /> : null}
              </View>
              <Text style={styles.checkboxText}>
                Ik ga akkoord met de privacy policy en gebruikersovereenkomst
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </AuthCard>
  )
}

const styles = StyleSheet.create({
  layoutRow: {
    width: '100%',
    flexDirection: 'row',
    minHeight: 560,
  },
  brandingPanel: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    padding: 48,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  brandHeader: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  brandTagline: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1C0E0A',
    textAlign: 'center',
  },
  illustrationContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationImage: {
    width: 420,
    height: 320,
  },
  welcomePanel: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    backgroundColor: colors.selected,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeContent: {
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 24,
  },
  welcomeTitle: {
    fontSize: 44,
    lineHeight: 52,
    color: '#FFFFFF',
    textAlign: 'left',
  },
  welcomeParagraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
    textAlign: 'left',
  },
  actionButton: {
    width: '100%',
    maxWidth: '100%',
    height: 48,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonHovered: {
    backgroundColor: '#F6E6F0',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.selected,
  },
  checkboxRow: {
    width: '100%',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
})

