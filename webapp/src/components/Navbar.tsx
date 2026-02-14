import React from 'react'
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'

import { radius, spacing } from '../foundation/theme/tokens'
import { colors } from '../theme/colors'
import { CoachscribeLogo } from './CoachscribeLogo'
import { UsageIndicator } from './UsageIndicator'
import { Text } from './Text'

type Props = {
  onLogout: () => void
  usedMinutes: number
  totalMinutes: number
  isUsageLoading?: boolean
}

export function Navbar({ onLogout, usedMinutes, totalMinutes, isUsageLoading = false }: Props) {
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
            <View style={styles.usageContainer}>
              {/* Usage indicator */}
              <UsageIndicator usedMinutes={usedMinutes} totalMinutes={totalMinutes} isLoading={isUsageLoading} />
            </View>
          ) : null}
          <Pressable onPress={onLogout} style={({ hovered }) => [styles.logoutButton, hovered ? styles.logoutButtonHovered : undefined]}>
            {/* Logout */}
            <Text isBold style={styles.logoutButtonText}>
              Uitloggen
            </Text>
          </Pressable>
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
  logoutButton: {
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    ...( { cursor: 'pointer' } as any ),
  },
  logoutButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  logoutButtonText: {
    fontSize: 13,
    lineHeight: 16,
    color: colors.textStrong,
  },
  usageContainer: {
    borderRadius: radius.md,
  },
})

