import React from 'react'
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'

import { radius, spacing } from '../foundation/theme/tokens'
import { colors } from '../theme/colors'
import { CoachscribeLogo } from './CoachscribeLogo'
import { UsageIndicator } from './UsageIndicator'

type Props = {
  usedMinutes: number
  totalMinutes: number
  isUsageLoading?: boolean
  isUsageClickable?: boolean
  onPressUsage?: () => void
}

export function Navbar({ usedMinutes, totalMinutes, isUsageLoading = false, isUsageClickable = false, onPressUsage }: Props) {
  const { width } = useWindowDimensions()
  const hideUsage = width < 600

  return (
    <View style={styles.container}>
      {/* Navbar area above sidebar */}
      <View style={styles.leftArea}>
        {/* Coachscribe logo */}
        <CoachscribeLogo />
      </View>

      {/* Navbar area to the right of the sidebar */}
      <View style={styles.rightArea}>
        {/* Right actions */}
        <View style={styles.rightActions}>
          {/* Usage indicator */}
          {!hideUsage ? (
            <Pressable
              onPress={() => {
                if (!isUsageClickable) return
                onPressUsage?.()
              }}
              disabled={!isUsageClickable}
              style={({ hovered }) => [styles.usageContainer, isUsageClickable && hovered ? styles.usageContainerHovered : undefined]}
            >
              <UsageIndicator usedMinutes={usedMinutes} totalMinutes={totalMinutes} isLoading={isUsageLoading} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 72,
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftArea: {
    width: 240,
    height: '100%',
    padding: spacing.lg,
    justifyContent: 'center',
  },
  rightArea: {
    flex: 1,
    height: '100%',
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  usageContainer: {
    borderRadius: radius.md,
  },
  usageContainerHovered: {
    opacity: 0.9,
  },
})

