import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../../theme/colors'
import { Text } from '../../components/Text'

const CONTACT_EMAIL = 'contact@jnlsolutions.nl'

export function AllowlistLaunchScreen() {
  function openContactEmail() {
    if (typeof window === 'undefined') return
    window.location.href = `mailto:${CONTACT_EMAIL}`
  }

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text isBold style={styles.badgeText}>
          CoachScribe Early Access
        </Text>
      </View>
      <Text isBold style={styles.title}>
        Je bent er vroeg bij
      </Text>
      <Text style={styles.description}>
        CoachScribe zit nu nog in een vroege fase en is daardoor nog niet voor iedereen beschikbaar.
      </Text>
      <Text style={styles.description}>
        We voegen nieuwe gebruikers stap voor stap toe. Stuur ons een mailtje en we sturen je zo snel mogelijk een reactie.
      </Text>
      <Pressable onPress={openContactEmail} style={({ hovered }) => [styles.button, hovered ? styles.buttonHovered : undefined]}>
        <Text isBold style={styles.buttonText}>
          Laat mij weten wanneer ik kan starten
        </Text>
      </Pressable>
      <Text style={styles.helperText}>Mail naar {CONTACT_EMAIL}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 760,
    maxWidth: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  badge: {
    borderRadius: 999,
    backgroundColor: colors.badgeBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.selected,
  },
  title: {
    fontSize: 38,
    lineHeight: 44,
    color: colors.textStrong,
    textAlign: 'center',
  },
  description: {
    maxWidth: 620,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: colors.selected,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonHovered: {
    backgroundColor: '#A50058',
  },
  buttonText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
})
