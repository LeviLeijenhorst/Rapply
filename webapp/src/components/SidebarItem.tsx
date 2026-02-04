import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../theme/colors'
import { webTransitionSmooth } from '../theme/webTransitions'
import { typography } from '../theme/typography'
import { Text } from './Text'

type Props = {
  icon: React.ReactNode
  label: string
  isSelected: boolean
  onPress: (event?: any) => void
  isCompact?: boolean
}

export function SidebarItem({ icon, label, isSelected, onPress, isCompact }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [
        styles.pressable,
        webTransitionSmooth,
        isCompact ? styles.pressableCompact : undefined,
        isSelected ? styles.pressableSelected : undefined,
        hovered ? (isSelected ? styles.pressableSelectedHovered : styles.pressableHovered) : undefined,
      ]}
    >
      {/* Sidebar item */}
      <View style={[styles.container, isCompact ? styles.containerCompact : undefined]}>
        {/* Sidebar item icon */}
        {icon}
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
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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

