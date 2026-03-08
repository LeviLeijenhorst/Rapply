import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../../../design/theme/colors'
import { Text } from '../../../ui/Text'
import {
  ClientPageDocumentenIcon,
  ClientPageNotesIcon,
  ClientPageRapportageIcon,
} from '../../../icons/ClientPageSvgIcons'

export type CoacheeTabKey = 'sessies' | 'notities' | 'rapportages' | 'documenten'

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
          icon={(color) => <ClientPageRapportageIcon color={color} size={18} />}
          onPress={() => onSelectTab('sessies')}
        />
        <TabButton
          label="Notities"
          isSelected={activeTabKey === 'notities'}
          icon={(color) => <ClientPageNotesIcon color={color} size={18} />}
          onPress={() => onSelectTab('notities')}
        />
        <TabButton
          label="Rapportages"
          isSelected={activeTabKey === 'rapportages'}
          icon={(color) => <ClientPageRapportageIcon color={color} size={18} />}
          onPress={() => onSelectTab('rapportages')}
        />
        <TabButton
          label="Documenten"
          isSelected={activeTabKey === 'documenten'}
          icon={(color) => <ClientPageDocumentenIcon color={color} size={18} />}
          onPress={() => onSelectTab('documenten')}
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
  const iconColor = isSelected ? colors.selected : colors.text
  const textColor = isSelected ? colors.selected : colors.text

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
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  rowWeb: {
    ...( { overflowX: 'auto', overflowY: 'hidden' } as any ),
    ...( { scrollbarWidth: 'none' } as any ),
    ...( { msOverflowStyle: 'none' } as any ),
  },
  tabButton: {
    height: 48,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    top: 1,
    position: 'relative',
  },
  tabButtonSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DFE0E2',
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF',
  },
  tabButtonSelectedHovered: {
    backgroundColor: '#FAFAFA',
    borderColor: '#DFE0E2',
  },
  tabButtonUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DFE0E2',
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
    fontSize: 16,
    lineHeight: 20,
  },
})



