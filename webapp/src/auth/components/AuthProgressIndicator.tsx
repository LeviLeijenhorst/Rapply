import React from 'react'
import { StyleSheet, View } from 'react-native'

import { colors } from '../../theme/colors'

type Props = {
  stepsCount: number
  activeStepsCount: number
}

export function AuthProgressIndicator({ stepsCount, activeStepsCount }: Props) {
  return (
    <View style={styles.container}>
      {/* Progress segments */}
      {Array.from({ length: stepsCount }).map((_, index) => {
        const isActive = index < activeStepsCount
        return <View key={index} style={[styles.segment, isActive ? styles.segmentActive : styles.segmentInactive]} />
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  segment: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    maxWidth: 220,
  },
  segmentActive: {
    backgroundColor: colors.selected,
  },
  segmentInactive: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.selected,
  },
})

