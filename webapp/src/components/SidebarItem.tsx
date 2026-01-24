import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../theme/colors'
import { typography } from '../theme/typography'
import { Text } from './Text'

type Props = {
  icon: React.ReactNode
  label: string
  isSelected: boolean
  onPress: () => void
}

export function SidebarItem({ icon, label, isSelected, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      {/* Sidebar item */}
      <View style={styles.container}>
        {/* Sidebar item icon */}
        {icon}
        {/* Sidebar item label */}
        <Text isBold={isSelected} numberOfLines={1} style={[styles.label, isSelected ? styles.labelSelected : undefined]}>
          {label}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    padding: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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

