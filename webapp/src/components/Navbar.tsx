import React from 'react'
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'

import { colors } from '../theme/colors'
import { CoachscribeLogo } from './CoachscribeLogo'
import { UsageIndicator } from './UsageIndicator'
import { Text } from './Text'

type Props = {
  onLogout: () => void
  onOpenSubscription: () => void
}

export function Navbar({ onLogout, onOpenSubscription }: Props) {
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
            <Pressable onPress={onOpenSubscription} style={({ hovered }) => [styles.usagePressable, hovered ? styles.usagePressableHovered : undefined]}>
              {/* Usage indicator */}
              <UsageIndicator usedMinutes={24} availableMinutes={60} planLabel="Basis" />
            </Pressable>
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
    padding: 24,
    justifyContent: 'center',
  },
  rightArea: {
    flex: 1,
    height: '100%',
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoutButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
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
  usagePressable: {
    borderRadius: 12,
  },
  usagePressableHovered: {
    opacity: 0.9,
  },
})

