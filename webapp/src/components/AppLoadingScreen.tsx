import React from 'react'
import { StyleSheet, View } from 'react-native'
import { LoadingSpinner } from './LoadingSpinner'

import { Text } from './Text'
import { colors } from '../theme/colors'

type Props = {
  label?: string
}

export function AppLoadingScreen({ label }: Props) {
  return (
    <View style={styles.container}>
      {/* Loading indicator */}
      <LoadingSpinner size="small" />
      {/* Loading label */}
      <Text style={styles.label}>{label ?? 'Gegevens laden...'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
})

