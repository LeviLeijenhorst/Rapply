import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { Text } from '../Text'
import { colors } from '../../theme/colors'
import { SnelleVragenIcon } from '../icons/SnelleVragenIcon'
import { NotitiesSessieIcon } from '../icons/NotitiesSessieIcon'
import { VolledigeSessieIcon } from '../icons/VolledigeSessieIcon'

export type ConversationTabKey = 'snelleVragen' | 'notities' | 'volledigeSessie'

type Props = {
  activeTabKey: ConversationTabKey
  onSelectTab: (tabKey: ConversationTabKey) => void
}

export function ConversationTabs({ activeTabKey, onSelectTab }: Props) {
  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={[styles.row, styles.rowWeb]}>
        <TabButton
          label="Snelle vragen"
          isSelected={activeTabKey === 'snelleVragen'}
          icon={(color) => <SnelleVragenIcon color={color} size={24} />}
          onPress={() => onSelectTab('snelleVragen')}
        />
        <TabButton
          label="Notities"
          isSelected={activeTabKey === 'notities'}
          icon={(color) => <NotitiesSessieIcon color={color} size={24} />}
          onPress={() => onSelectTab('notities')}
        />
        <TabButton
          label="Volledig gesprek"
          isSelected={activeTabKey === 'volledigeSessie'}
          icon={(color) => <VolledigeSessieIcon color={color} size={24} />}
          onPress={() => onSelectTab('volledigeSessie')}
        />
      </View>
    </View>
  )
}

type TabButtonProps = {
  label: string
  isSelected: boolean
  icon: (color: string) => React.ReactNode
  onPress: () => void
}

function TabButton({ label, isSelected, icon, onPress }: TabButtonProps) {
  const iconColor = isSelected ? '#FFFFFF' : colors.selected
  const textColor = isSelected ? '#FFFFFF' : colors.selected

  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [
        styles.tabButton,
        isSelected ? styles.tabButtonSelected : styles.tabButtonUnselected,
        hovered ? (isSelected ? styles.tabButtonSelectedHovered : styles.tabButtonHovered) : undefined,
      ]}
    >
      {/* Tab button */}
      <View style={styles.tabButtonContent}>
        {/* Tab icon */}
        {icon(iconColor)}
        {/* Tab label */}
        <Text isSemibold style={[styles.tabLabel, { color: textColor }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  rowWeb: {
    ...( { overflowX: 'auto', overflowY: 'hidden' } as any ),
    ...( { scrollbarWidth: 'none' } as any ),
    ...( { msOverflowStyle: 'none' } as any ),
  },
  tabButton: {
    height: 40,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tabButtonSelected: {
    backgroundColor: colors.selected,
    borderColor: colors.selected,
  },
  tabButtonSelectedHovered: {
    backgroundColor: '#A50058',
    borderColor: '#A50058',
  },
  tabButtonUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  tabButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  tabButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabLabel: {
    fontSize: 14,
    lineHeight: 18,
  },
})

