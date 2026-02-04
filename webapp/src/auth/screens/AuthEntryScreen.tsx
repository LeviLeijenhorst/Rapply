import React, { useState } from 'react'
import { Image, Pressable, StyleSheet, View } from 'react-native'

import { AuthCard } from '../components/AuthCard'
import { CoachscribeLogo } from '../../components/CoachscribeLogo'
import { Text } from '../../components/Text'
import { colors } from '../../theme/colors'

type Props = {
  mode: 'inloggen' | 'registreren'
  onStartLogin?: () => void
}

export function AuthEntryScreen({ mode, onStartLogin }: Props) {
  const [hasAgreed, setHasAgreed] = useState(false)
  const illustrationSource =
    mode === 'registreren'
      ? require('../../../assets/authhuman_2.png')
      : require('../../../assets/authhuman_1.png')

  return (
    <AuthCard>
      {/* Split panels */}
      <View style={styles.panelsRow}>
        {/* Left panel (magenta) */}
        <View style={styles.leftPanel}>
          {/* Slogan */}
          <Text isBold style={styles.sloganText}>
            Betere coaching begint bij volledige aandacht
          </Text>
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image source={illustrationSource} resizeMode="contain" style={styles.illustrationImage} />
          </View>
        </View>

        {/* Right panel (white) */}
        <View style={styles.rightPanel}>
          <View style={styles.rightPanelContent}>
            {/* CoachScribe logo */}
            <CoachscribeLogo />
            {/* Continue button */}
            <Pressable
              onPress={async () => {
                try {
                  onStartLogin?.()
                  const { signInWithEntra } = await import('../entraAuth')
                  await signInWithEntra()
                } catch (error) {
                  console.error('Entra sign in failed:', error)
                  alert('Inloggen mislukt. Probeer het opnieuw.')
                }
              }}
              style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined]}
            >
              <Text isBold style={styles.primaryButtonText}>
                Doorgaan
              </Text>
            </Pressable>
            {/* Agreement checkbox */}
            <Pressable style={styles.checkboxRow} onPress={() => setHasAgreed(!hasAgreed)}>
              <View style={[styles.checkbox, hasAgreed ? styles.checkboxChecked : undefined]} />
              <Text style={styles.checkboxText}>
                Ik ga akkoord met de privacy policy en gebruikersovereenkomst.
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </AuthCard>
  )
}

const styles = StyleSheet.create({
  panelsRow: {
    width: '100%',
    flexDirection: 'row',
    height: '100%',
  },
  leftPanel: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    backgroundColor: colors.selected,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  sloganText: {
    fontSize: 26,
    lineHeight: 34,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  illustrationContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationImage: {
    width: 300,
    height: 240,
  },
  rightPanel: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  rightPanelContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  primaryButton: {
    width: 420,
    maxWidth: '100%',
    height: 52,
    borderRadius: 6,
    backgroundColor: colors.selected,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonHovered: {
    backgroundColor: 'rgba(123,14,100,0.92)',
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  checkboxRow: {
    width: 420,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: colors.selected,
    borderColor: colors.selected,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
})

