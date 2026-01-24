import React from 'react'
import { StyleSheet, View } from 'react-native'

import { colors } from '../theme/colors'
import { AssistentIcon } from './icons/AssistentIcon'
import { CoacheeBewerkenIcon } from './icons/CoacheeBewerkenIcon'
import { GesprekkenIcon } from './icons/GesprekkenIcon'
import { NotitiesIcon } from './icons/NotitiesIcon'
import { SidebarItem } from './SidebarItem'

export type SidebarItemKey = 'gesprekken' | 'assistent' | 'notities' | 'coacheeBewerken'

type Props = {
  selectedSidebarItemKey: SidebarItemKey
  onSelectSidebarItem: (sidebarItemKey: SidebarItemKey) => void
}

export function Sidebar({ selectedSidebarItemKey, onSelectSidebarItem }: Props) {
  const selectedColor = colors.selected
  const unselectedColor = colors.text

  return (
    <View style={styles.container}>
      {/* Sidebar navigation */}
      <SidebarItem
        label="Gesprekken"
        isSelected={selectedSidebarItemKey === 'gesprekken'}
        onPress={() => onSelectSidebarItem('gesprekken')}
        icon={<GesprekkenIcon color={selectedSidebarItemKey === 'gesprekken' ? selectedColor : unselectedColor} />}
      />
      <SidebarItem
        label="Assistent"
        isSelected={selectedSidebarItemKey === 'assistent'}
        onPress={() => onSelectSidebarItem('assistent')}
        icon={<AssistentIcon color={selectedSidebarItemKey === 'assistent' ? selectedColor : unselectedColor} />}
      />
      <SidebarItem
        label="Notities"
        isSelected={selectedSidebarItemKey === 'notities'}
        onPress={() => onSelectSidebarItem('notities')}
        icon={<NotitiesIcon color={selectedSidebarItemKey === 'notities' ? selectedColor : unselectedColor} />}
      />
      <SidebarItem
        label="Coachee bewerken"
        isSelected={selectedSidebarItemKey === 'coacheeBewerken'}
        onPress={() => onSelectSidebarItem('coacheeBewerken')}
        icon={<CoacheeBewerkenIcon color={selectedSidebarItemKey === 'coacheeBewerken' ? selectedColor : unselectedColor} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    backgroundColor: colors.surface,
    borderRightColor: colors.border,
    borderRightWidth: 1,
    padding: 24,
    gap: 8,
  },
})

