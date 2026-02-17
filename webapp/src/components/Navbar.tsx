import React from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'

import { radius, spacing } from '../foundation/theme/tokens'
import { colors } from '../theme/colors'
import { CoachscribeLogo } from './CoachscribeLogo'
import { Text } from './Text'
import { UsageIndicator } from './UsageIndicator'

type Props = {
  usedMinutes: number
  totalMinutes: number
  isUsageLoading?: boolean
  accountName?: string | null
}

export function Navbar({ usedMinutes, totalMinutes, isUsageLoading = false, accountName = null }: Props) {
  const { width } = useWindowDimensions()
  const hideUsage = width < 600
  const showAccount = Boolean(accountName)

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
          {showAccount ? (
            <View style={styles.accountBadge}>
              {accountName ? (
                <Text isSemibold style={styles.accountName} numberOfLines={1}>
                  {accountName}
                </Text>
              ) : null}
            </View>
          ) : null}
          {/* Usage indicator */}
          {!hideUsage ? (
            <View style={styles.usageContainer}>
              {/* Usage indicator */}
              <UsageIndicator usedMinutes={usedMinutes} totalMinutes={totalMinutes} isLoading={isUsageLoading} />
            </View>
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
  accountBadge: {
    maxWidth: 320,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    backgroundColor: colors.pageBackground,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  accountName: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
})

