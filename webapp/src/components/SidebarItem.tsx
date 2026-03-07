import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../design/theme/colors'
import { webTransitionSmooth } from '../design/theme/webTransitions'
import { typography } from '../design/theme/typography'
import { Text } from '../ui/Text'

type Props = {
  icon: React.ReactNode
  label: string
  isSelected: boolean
  onPress: (event?: any) => void
  isCompact?: boolean
  disabled?: boolean
}

export function SidebarItem({ icon, label, isSelected, onPress, isCompact, disabled = false }: Props) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ hovered }) => [
        styles.pressable,
        webTransitionSmooth,
        isCompact ? styles.pressableCompact : undefined,
        isSelected ? styles.pressableSelected : undefined,
        hovered && !disabled ? (isSelected ? styles.pressableSelectedHovered : styles.pressableHovered) : undefined,
        disabled ? styles.pressableDisabled : undefined,
      ]}
    >
      {/* Sidebar item */}
      <View style={[styles.container, isCompact ? styles.containerCompact : undefined]}>
        {/* Sidebar item icon */}
        <View style={styles.iconSlot}>{icon}</View>
        {/* Sidebar item label */}
        {!isCompact ? (
          <Text isSemibold={isSelected} numberOfLines={1} style={[styles.label, isSelected ? styles.labelSelected : undefined]}>
            {label}
          </Text>
        ) : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    width: 188,
    height: 40,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
  },
  pressableCompact: {
    width: 48,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressableSelected: {
    backgroundColor: '#FFE5F6',
  },
  pressableHovered: {
    backgroundColor: colors.hoverBackground,
  },
  pressableSelectedHovered: {
    backgroundColor: '#FFD1EE',
  },
  pressableDisabled: {
    opacity: 0.5,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconSlot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerCompact: {
    width: 48,
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: typography.fontSizeSidebarItem,
    color: colors.text,
  },
  labelSelected: {
    color: colors.selected,
  },
})


