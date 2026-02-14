import React from 'react'
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'

import { AuthCard } from '../components/AuthCard'
import { CoachscribeLogo } from '../../components/CoachscribeLogo'
import { Text } from '../../components/Text'
import { colors } from '../../theme/colors'

type Props = {
  mode: 'inloggen' | 'registreren'
  onStartLogin?: () => void
  errorMessage?: string | null
}

export function AuthEntryScreen({ mode, onStartLogin, errorMessage }: Props) {
  const { width } = useWindowDimensions()
  const isCompact = width < 980
  const illustrationSource = require('../../../assets/authhumans.png')

  async function startLogin() {
    try {
      onStartLogin?.()
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const queryMode = urlParams?.get('mode')
      const shouldSignUp =
        mode === 'registreren' || queryMode === 'signup' || (mode === 'inloggen' && queryMode !== 'signin')

      if (shouldSignUp) {
        const { signUpWithEntra } = await import('../entraAuth')
        await signUpWithEntra()
        return
      }
      const { signInWithEntra } = await import('../entraAuth')
      await signInWithEntra()
    } catch (error) {
      console.error('Entra sign in failed:', error)
      alert('Inloggen mislukt. Probeer het opnieuw.')
    }
  }

  return (
    <AuthCard>
      {/* Welcome layout */}
      <View style={[styles.layoutRow, isCompact ? styles.layoutColumn : undefined]}>
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
            <Image source={illustrationSource} resizeMode="contain" style={[styles.illustrationImage, isCompact ? styles.illustrationImageCompact : undefined]} />
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
              onPress={startLogin}
              style={({ hovered }) => [
                styles.actionButton,
                hovered ? styles.actionButtonHovered : undefined,
              ]}
            >
              <Text isBold style={styles.actionButtonText}>
                Doorgaan
              </Text>
            </Pressable>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
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
  layoutColumn: {
    flexDirection: 'column',
    minHeight: 0,
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
  illustrationImageCompact: {
    width: 300,
    height: 220,
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
  actionButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.selected,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#FFE5E5',
  },
})

