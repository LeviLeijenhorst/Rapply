import React from 'react'
import { StyleSheet, View } from 'react-native'

import { colors } from '../theme/colors'
import { MicrophoneSmallIcon } from './icons/MicrophoneSmallIcon'
import { Text } from './Text'

type Props = {
  usedMinutes: number
  totalMinutes: number
}

export function UsageIndicator({ usedMinutes, totalMinutes }: Props) {
  return (
    <View style={styles.container}>
      {/* Usage indicator left content */}
      <View style={styles.leftContent}>
        {/* Microphone icon */}
        <MicrophoneSmallIcon color={colors.selected} size={20} />
        {/* Usage text */}
        <Text style={styles.usageText}>
          Gebruikt: {usedMinutes}/{totalMinutes} minuten
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 315,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.pageBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  usageText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
})

