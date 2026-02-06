import React, { useState } from 'react'
import { Image, Pressable, StyleSheet, View } from 'react-native'

import { AuthCard } from '../components/AuthCard'
import { CheckmarkIcon } from '../../components/icons/CheckmarkIcon'
import { Text } from '../../components/Text'
import { colors } from '../../theme/colors'

type Props = {
  mode: 'inloggen' | 'registreren'
  onStartLogin?: () => void
}

export function AuthEntryScreen({ mode, onStartLogin }: Props) {
  const [hasAgreedToPolicy, setHasAgreedToPolicy] = useState(false)
  const illustrationSource =
    mode === 'registreren'
      ? require('../../../assets/authhuman_2.png')
      : require('../../../assets/authhuman_1.png')

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
      {/* Authentication panels */}
      <View style={styles.panelsRow}>
        {/* Left panel */}
        <View style={styles.leftPanel}>
          {/* Welcome title */}
          <Text isBold style={styles.titleText}>
            Welkom
          </Text>
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image source={illustrationSource} resizeMode="contain" style={styles.illustrationImage} />
          </View>
        </View>

        {/* Right panel */}
        <View style={styles.rightPanel}>
          <View style={styles.rightPanelContent}>
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
    minHeight: 560,
  },
  leftPanel: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  titleText: {
    fontSize: 40,
    lineHeight: 44,
    color: colors.selected,
    textAlign: 'center',
  },
  illustrationContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationImage: {
    width: 360,
    height: 300,
  },
  rightPanel: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    backgroundColor: colors.selected,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightPanelContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  actionButton: {
    width: 400,
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
    width: 400,
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

