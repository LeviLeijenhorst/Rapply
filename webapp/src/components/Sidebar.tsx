import React from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'

import { colors } from '../design/theme/colors'
import { CoacheesIcon } from '../icons/CoacheesIcon'
import { ClientPageDashboardIcon, ClientPageRapportageIcon } from '../icons/ClientPageSvgIcons'
import { FeedbackIcon } from '../icons/FeedbackIcon'
import { MijnPraktijkIcon } from '../icons/MijnPraktijkIcon'
import { SettingsIcon } from '../icons/SettingsIcon'
import { ArchiefMenuIcon } from '../icons/ArchiefMenuIcon'
import { ContactIcon } from '../icons/ContactIcon'
import { SidebarItem } from './SidebarItem'
import { features } from '../config/features'

export type SidebarItemKey = 'coachees' | 'activities' | 'templates' | 'mijnPraktijk' | 'archief' | 'admin' | 'adminContact' | 'adminWachtlijst'

type AnchorPoint = { x: number; y: number }

type Props = {
  selectedSidebarItemKey: SidebarItemKey
  isSettingsSelected: boolean
  isAdminUser?: boolean
  onSelectSidebarItem: (sidebarItemKey: SidebarItemKey) => void
  onOpenSettingsMenu: (anchorPoint: AnchorPoint) => void
}

export function Sidebar({
  selectedSidebarItemKey,
  isSettingsSelected,
  isAdminUser = false,
  onSelectSidebarItem,
  onOpenSettingsMenu,
}: Props) {
  const { width } = useWindowDimensions()
  const isCompact = width < 700

  const selectedColor = colors.selected
  const unselectedColor = colors.text
  const settingsColor = isSettingsSelected ? selectedColor : unselectedColor
  function getMenuAnchorPoint(event: any): AnchorPoint {
    const rectFromCurrentTarget = event?.currentTarget?.getBoundingClientRect?.()
    const rectFromNativeTarget = event?.nativeEvent?.target?.getBoundingClientRect?.()
    const rect = rectFromCurrentTarget ?? rectFromNativeTarget

    const clientX = event?.nativeEvent?.clientX
    const clientY = event?.nativeEvent?.clientY
    const pageX = event?.nativeEvent?.pageX
    const pageY = event?.nativeEvent?.pageY

    return {
      x: rect ? rect.left : typeof clientX === 'number' ? clientX : typeof pageX === 'number' ? pageX : 0,
      y: rect ? rect.top : typeof clientY === 'number' ? clientY : typeof pageY === 'number' ? pageY : 0,
    }
  }

  return (
    <View style={[styles.container, isCompact ? styles.containerCompact : undefined]}>
      <View style={styles.topSection}>
        {/* Sidebar menu items */}
        <View style={styles.menuItems}>
          {/* Future-facing: only render when explicitly enabled. */}
          {features.activities ? (
            <SidebarItem
              label="Dashboard"
              isSelected={selectedSidebarItemKey === 'activities'}
              onPress={() => onSelectSidebarItem('activities')}
              icon={<ClientPageDashboardIcon color={selectedSidebarItemKey === 'activities' ? selectedColor : '#2C111F'} size={24} />}
              isCompact={isCompact}
            />
          ) : null}
          <SidebarItem
            label="Cliënten"
            isSelected={selectedSidebarItemKey === 'coachees'}
            onPress={() => onSelectSidebarItem('coachees')}
            icon={<CoacheesIcon color={selectedSidebarItemKey === 'coachees' ? selectedColor : unselectedColor} size={24} />}
            isCompact={isCompact}
          />
          {features.templates ? (
            <SidebarItem
              label="Rapportages"
              isSelected={selectedSidebarItemKey === 'templates'}
              onPress={() => onSelectSidebarItem('templates')}
              icon={<ClientPageRapportageIcon color={selectedSidebarItemKey === 'templates' ? selectedColor : '#2C111F'} size={24} />}
              isCompact={isCompact}
            />
          ) : null}
          <SidebarItem
            label="Mijn organisatie"
            isSelected={selectedSidebarItemKey === 'mijnPraktijk'}
            onPress={() => onSelectSidebarItem('mijnPraktijk')}
            icon={<MijnPraktijkIcon color={selectedSidebarItemKey === 'mijnPraktijk' ? selectedColor : unselectedColor} size={24} />}
            isCompact={isCompact}
          />
          {selectedSidebarItemKey === 'archief' ? (
            <SidebarItem
              label="Archief"
              isSelected
              onPress={() => onSelectSidebarItem('archief')}
              icon={<ArchiefMenuIcon color={selectedColor} size={24} />}
              isCompact={isCompact}
            />
          ) : null}
          {isAdminUser ? (
            <SidebarItem
              label="Admin"
              isSelected={selectedSidebarItemKey === 'admin'}
              onPress={() => onSelectSidebarItem('admin')}
              icon={<FeedbackIcon color={selectedSidebarItemKey === 'admin' ? selectedColor : unselectedColor} size={24} />}
              isCompact={isCompact}
            />
          ) : null}
          {isAdminUser ? (
            <SidebarItem
              label="Contactberichten"
              isSelected={selectedSidebarItemKey === 'adminContact'}
              onPress={() => onSelectSidebarItem('adminContact')}
              icon={<ContactIcon color={selectedSidebarItemKey === 'adminContact' ? selectedColor : unselectedColor} size={24} />}
              isCompact={isCompact}
            />
          ) : null}
          {isAdminUser ? (
            <SidebarItem
              label="Wachtlijst"
              isSelected={selectedSidebarItemKey === 'adminWachtlijst'}
              onPress={() => onSelectSidebarItem('adminWachtlijst')}
              icon={<ContactIcon color={selectedSidebarItemKey === 'adminWachtlijst' ? selectedColor : unselectedColor} size={24} />}
              isCompact={isCompact}
            />
          ) : null}
        </View>
      </View>

      {/* Sidebar bottom items */}
      <View style={styles.bottomSection}>
        <SidebarItem
          label="Instellingen"
          isSelected={isSettingsSelected}
          onPress={(event) => {
            onOpenSettingsMenu(getMenuAnchorPoint(event))
          }}
          icon={<SettingsIcon color={settingsColor} size={24} />}
          isCompact={isCompact}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 240,
    backgroundColor: '#FEFEFE',
    padding: 24,
    justifyContent: 'space-between',
    shadowColor: 'rgba(101,101,101,1)',
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 8,
    shadowOpacity: 0.02,
    ...( { boxShadow: '0px -4px 8px 8px rgba(101, 101, 101, 0.02)' } as any ),
  },
  containerCompact: {
    width: 72,
    padding: 12,
  },
  topSection: {
    gap: 8,
  },
  menuItems: {
    gap: 8,
  },
  bottomSection: {
    gap: 8,
  },
})

