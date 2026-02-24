import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { useE2ee } from '../e2ee/E2eeProvider'
import { colors } from '../theme/colors'
import { Text } from '../components/Text'
import { useToast } from '../toast/ToastProvider'

type Props = {
  onBack: () => void
}

export function EndToEndEncryptieScreen({ onBack }: Props) {
  const e2ee = useE2ee()
  const [isBusy, setIsBusy] = useState(false)
  const { showErrorToast } = useToast()

  function startSetup() {
    if (isBusy) return
    setIsBusy(true)
    try {
      e2ee.beginSetup()
    } catch {
      showErrorToast('Het openen van het instelscherm is mislukt. Probeer het opnieuw.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text isBold style={styles.title}>
          End-to-end encryptie
        </Text>
        <Text style={styles.bodyText}>
          Als je end-to-end encryptie aanzet, blijft je data versleuteld met sleutels die alleen jij beheert. Zelfs als Microsoft daartoe zou worden verplicht, kunnen zij je data dan niet lezen.
        </Text>
        <Text style={styles.bodyText}>
          Let op: tijdens AI-verwerking is de data niet end-to-end versleuteld. De versleuteling geldt voor opslag en toegang in je account.
        </Text>
        {e2ee.isEnabled ? (
          <Text style={styles.successText}>End-to-end encryptie staat al aan voor dit account.</Text>
        ) : (
          <Pressable onPress={startSetup} style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined]}>
            <Text isBold style={styles.primaryButtonText}>
              End-to-end encryptie aanzetten
            </Text>
          </Pressable>
        )}
        <Pressable onPress={onBack} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}>
          <Text isBold style={styles.secondaryButtonText}>Terug</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 820,
    maxWidth: '100%',
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 22,
    lineHeight: 26,
    color: colors.textStrong,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  successText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#1F7A33',
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  primaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  secondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  secondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
})
