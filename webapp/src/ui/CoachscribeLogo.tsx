import React from 'react'
import { StyleSheet, View } from 'react-native'
import { spacing } from '../design/tokens'
import { CoachscribeMarkIcon } from '../icons/CoachscribeMarkIcon'
import { CoachscribeWordmarkIcon } from '../icons/CoachscribeWordmarkIcon'

// Renders the brand logo using dedicated mark and wordmark icon components.
export function CoachscribeLogo() {
  return (
    <View style={styles.container}>
      <CoachscribeMarkIcon />
      <CoachscribeWordmarkIcon />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
})


