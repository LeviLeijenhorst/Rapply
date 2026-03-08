import React from 'react'
import { StyleSheet, View } from 'react-native'
import { LoadingSpinner } from '../ui/LoadingSpinner'

import { fontSizes, radius, spacing } from '../design/tokens'
import { colors } from '../design/theme/colors'
import { MicrophoneSmallIcon } from '../icons/MicrophoneSmallIcon'
import { Text } from '../ui/Text'

type Props = {
  usedMinutes: number
  totalMinutes: number
  isLoading?: boolean
}

export function UsageIndicator({ usedMinutes, totalMinutes, isLoading = false }: Props) {
  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContent}>
          <View style={styles.loadingSpinnerScale}>
            <LoadingSpinner size="small" />
          </View>
        </View>
      ) : (
        <View style={styles.leftContent}>
          {/* Microphone icon */}
          <MicrophoneSmallIcon color={colors.selected} size={20} />
          <Text style={styles.usageText}>
            Gebruikt: {usedMinutes}/{totalMinutes} minuten
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 315,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.pageBackground,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    flex: 1,
  },
  loadingContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinnerScale: {
    ...( { transform: [{ scale: 0.82 }] } as any ),
  },
  usageText: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
    color: colors.text,
  },
})



