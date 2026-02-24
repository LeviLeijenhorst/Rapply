import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'

import { AuthCard } from '../components/AuthCard'
import { CoachscribeLogo } from '../../components/CoachscribeLogo'
import { Text } from '../../components/Text'
import { colors } from '../../theme/colors'
import { useToast } from '../../toast/ToastProvider'

type Props = {
  mode: 'inloggen' | 'registreren'
  onStartLogin?: () => void
  errorMessage?: string | null
}

export function AuthEntryScreen({ mode, onStartLogin, errorMessage }: Props) {
  const { width, height } = useWindowDimensions()
  const [isStartingLogin, setIsStartingLogin] = useState(false)
  const { showErrorToast } = useToast()
  const squareSize = Math.min(640, width - 140, height - 140)

  useEffect(() => {
    if (!errorMessage) return
    showErrorToast(errorMessage, 'Inloggen mislukt. Probeer het opnieuw.')
  }, [errorMessage, showErrorToast])

  async function startLogin() {
    if (isStartingLogin) return
    setIsStartingLogin(true)
    try {
      onStartLogin?.()
      if (mode === 'registreren') {
        const { signUpWithEntra } = await import('../entraAuth')
        await signUpWithEntra()
        return
      }
      const { signInWithEntra } = await import('../entraAuth')
      await signInWithEntra()
    } catch (error) {
      setIsStartingLogin(false)
      console.error('Entra sign in failed:', error)
      showErrorToast(error instanceof Error ? error.message : String(error || ''), 'Inloggen mislukt. Probeer het opnieuw.')
    }
  }

  return (
    <AuthCard style={[styles.squareCard, { width: squareSize, height: squareSize }]}>
      {/* Welcome panel */}
      <View style={styles.welcomePanel}>
        {/* Welcome content */}
        <View style={styles.welcomeContent}>
          <View style={styles.topContent}>
            {/* Brand header */}
            <View style={styles.brandHeader}>
              {/* Brand logo */}
              <CoachscribeLogo />
              {/* Brand tagline */}
              <Text style={styles.brandTagline}>Focus op de mens</Text>
            </View>
            {/* Welcome title */}
            <Text isBold style={styles.welcomeTitle}>
              Welkom
            </Text>
            {/* Welcome description */}
            <Text style={styles.welcomeParagraph}>
              CoachScribe ondersteunt <Text isBold style={styles.welcomeParagraphBold}>loopbaan- en re-integratieprofessionals</Text> bij heldere dossiervorming en het bewaren van overzicht.
            </Text>
            {/* Welcome description */}
            <Text style={styles.welcomeParagraph}>
              Gesprekken en afspraken worden veilig vastgelegd en gestructureerd, zodat jij meer tijd houdt voor de begeleiding van je client.
            </Text>
          </View>
          {/* Continue button */}
          <Pressable
            disabled={isStartingLogin}
            onPress={startLogin}
            style={({ hovered }) => [
              styles.actionButton,
              styles.actionButtonBottom,
              isStartingLogin ? styles.actionButtonDisabled : undefined,
              !isStartingLogin && hovered ? styles.actionButtonHovered : undefined,
            ]}
          >
            {isStartingLogin ? (
              <ActivityIndicator size="small" color={colors.selected} />
            ) : (
              <Text isBold style={styles.actionButtonText}>
                Doorgaan
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </AuthCard>
  )
}

const styles = StyleSheet.create({
  squareCard: {
    maxWidth: '100%',
    alignSelf: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
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
  welcomePanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 48,
    paddingTop: 48,
    paddingBottom: 48,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  welcomeContent: {
    flex: 1,
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  topContent: {
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: 24,
  },
  welcomeTitle: {
    fontSize: 44,
    lineHeight: 52,
    color: '#1C0E0A',
    textAlign: 'left',
  },
  welcomeParagraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1C0E0A',
    textAlign: 'left',
  },
  welcomeParagraphBold: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1C0E0A',
  },
  actionButton: {
    width: '100%',
    maxWidth: '100%',
    height: 48,
    borderRadius: 6,
    backgroundColor: colors.selected,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonHovered: {
    opacity: 0.9,
  },
  actionButtonDisabled: {
    opacity: 0.85,
  },
  actionButtonBottom: {
    marginTop: 'auto',
  },
  actionButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})


