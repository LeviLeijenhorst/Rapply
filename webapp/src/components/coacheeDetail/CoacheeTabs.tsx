import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../../theme/colors'
import { Text } from '../Text'
import { NotitiesSessieIcon } from '../icons/NotitiesSessieIcon'
import { SessiesIcon } from '../icons/SessiesIcon'
import { SnelleVragenIcon } from '../icons/SnelleVragenIcon'

export type CoacheeTabKey = 'sessies' | 'snelleVragen' | 'notities'

type Props = {
  activeTabKey: CoacheeTabKey
  onSelectTab: (tabKey: CoacheeTabKey) => void
}

export function CoacheeTabs({ activeTabKey, onSelectTab }: Props) {
  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={[styles.row, styles.rowWeb]}>
        <TabButton
          label="Sessies"
          isSelected={activeTabKey === 'sessies'}
          icon={(color) => <SessiesIcon color={color} size={24} />}
          onPress={() => onSelectTab('sessies')}
        />
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
    borderRadius: 12,
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

