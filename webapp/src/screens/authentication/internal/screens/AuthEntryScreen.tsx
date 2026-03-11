import React, { useEffect, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import { LoadingSpinner } from '../../../../ui/LoadingSpinner'
import Svg, { G, Rect } from 'react-native-svg'

import { AuthCard } from '../ui/AuthCard'
import { CoachscribeLogo } from '../../../../components/brand/CoachscribeLogo'
import { Text } from '../../../../ui/Text'
import { colors } from '../../../../design/theme/colors'
import { useToast } from '../../../../toast/ToastProvider'

type Props = {
  mode: 'inloggen' | 'registreren'
  onStartLogin?: () => void
  errorMessage?: string | null
}

const BACKGROUND_RECT_ROTATIONS = [-14.3046, -30.2452, -58.7584, -78.4897, -94.1937]
const BACKGROUND_RECT_RADIUS_RATIO = 149.5 / 687

function AuthEntryBackgroundPattern({ size }: { size: number }) {
  const center = size / 2
  const radius = size * BACKGROUND_RECT_RADIUS_RATIO

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {BACKGROUND_RECT_ROTATIONS.map((angle) => (
        <G key={angle} rotation={angle} originX={center} originY={center}>
          <Rect
            x={0}
            y={0}
            width={size}
            height={size}
            rx={radius}
            fill="#FFFFFF"
            fillOpacity={0.35}
            stroke="none"
          />
        </G>
      ))}
    </Svg>
  )
}

export function AuthEntryScreen({ mode, onStartLogin, errorMessage }: Props) {
  const { width, height } = useWindowDimensions()
  const [isStartingLogin, setIsStartingLogin] = useState(false)
  const { showErrorToast } = useToast()
  const isCompact = width < 900
  const squareSize = Math.max(320, Math.min(640, width - (isCompact ? 24 : 140), height - (isCompact ? 24 : 140)))
  const entranceProgress = React.useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!errorMessage) return
    showErrorToast(errorMessage, 'Inloggen mislukt. Probeer het opnieuw.')
  }, [errorMessage, showErrorToast])

  useEffect(() => {
    entranceProgress.setValue(0)
    Animated.timing(entranceProgress, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [entranceProgress])

  const entranceStyle = {
    opacity: entranceProgress,
    transform: [
      {
        translateY: entranceProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
      {
        scale: entranceProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.985, 1],
        }),
      },
    ],
  }

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
    <Animated.View style={entranceStyle}>
      <View style={[styles.cardStack, { width: squareSize, height: squareSize }]}>
        <View pointerEvents="none" style={styles.backgroundPattern}>
          <AuthEntryBackgroundPattern size={squareSize} />
        </View>
        <AuthCard style={styles.squareCard}>
          {/* Welcome panel */}
          <View style={[styles.welcomePanel, isCompact ? styles.welcomePanelCompact : undefined]}>
            {/* Welcome content */}
            <View style={styles.welcomeContent}>
              <View style={[styles.topContent, isCompact ? styles.topContentCompact : undefined]}>
                {/* Brand header */}
                <View style={styles.brandHeader}>
                  {/* Brand logo */}
                  <CoachscribeLogo />
                  {/* Brand tagline */}
                  <Text style={styles.brandTagline}>Focus op de mens</Text>
                </View>
                {/* Welcome title */}
                <Text isBold style={[styles.welcomeTitle, isCompact ? styles.welcomeTitleCompact : undefined]}>
                  Welkom
                </Text>
                {/* Welcome description */}
                <Text style={[styles.welcomeParagraph, isCompact ? styles.welcomeParagraphCompact : undefined]}>
                  CoachScribe ondersteunt <Text isBold style={styles.welcomeParagraphBold}>loopbaan- en re-integratieprofessionals</Text> bij heldere dossiervorming en het bewaren van overzicht.
                </Text>
                {/* Welcome description */}
                <Text style={[styles.welcomeParagraph, isCompact ? styles.welcomeParagraphCompact : undefined]}>
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
                  isCompact ? styles.actionButtonCompact : undefined,
                  isStartingLogin ? styles.actionButtonDisabled : undefined,
                  !isStartingLogin && hovered ? styles.actionButtonHovered : undefined,
                ]}
              >
                {isStartingLogin ? (
                  <LoadingSpinner size="small" color="#FFFFFF" />
                ) : (
                  <Text isBold style={styles.actionButtonText}>
                    Doorgaan
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </AuthCard>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  cardStack: {
    maxWidth: '100%',
    alignSelf: 'center',
    position: 'relative',
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  squareCard: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 1,
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
  welcomePanelCompact: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 20,
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
  topContentCompact: {
    gap: 16,
  },
  welcomeTitle: {
    fontSize: 44,
    lineHeight: 52,
    color: '#1C0E0A',
    textAlign: 'left',
  },
  welcomeTitleCompact: {
    fontSize: 34,
    lineHeight: 40,
  },
  welcomeParagraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1C0E0A',
    textAlign: 'left',
  },
  welcomeParagraphCompact: {
    fontSize: 14,
    lineHeight: 20,
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
  actionButtonCompact: {
    height: 52,
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




