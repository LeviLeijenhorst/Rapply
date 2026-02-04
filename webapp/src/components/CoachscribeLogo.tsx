import React from 'react'
import { StyleSheet, View } from 'react-native'

import { CoachscribeMarkIcon } from './icons/CoachscribeMarkIcon'
import { CoachscribeWordmarkIcon } from './icons/CoachscribeWordmarkIcon'

export function CoachscribeLogo() {
  return (
    <View style={styles.container}>
      {/* Coachscribe icon */}
      <CoachscribeMarkIcon />
      {/* Coachscribe wordmark */}
      <CoachscribeWordmarkIcon />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
})

