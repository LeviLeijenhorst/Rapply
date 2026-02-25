import React from 'react'
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'

import { colors } from '../theme/colors'
import { CoacheesIcon } from './icons/CoacheesIcon'
import { FeedbackIcon } from './icons/FeedbackIcon'
import { MijnPraktijkIcon } from './icons/MijnPraktijkIcon'
import { PlusIcon } from './icons/PlusIcon'
import { SessiesIcon } from './icons/SessiesIcon'
import { SettingsIcon } from './icons/SettingsIcon'
import { TemplatesIcon } from './icons/TemplatesIcon'
import { ArchiefMenuIcon } from './icons/ArchiefMenuIcon'
import { ContactIcon } from './icons/ContactIcon'
import { SidebarItem } from './SidebarItem'
import { Text } from './Text'

export type SidebarItemKey = 'coachees' | 'sessies' | 'templates' | 'mijnPraktijk' | 'archief' | 'admin' | 'adminContact' | 'adminWachtlijst'

type AnchorPoint = { x: number; y: number }

type Props = {
  selectedSidebarItemKey: SidebarItemKey
  isSettingsSelected: boolean
  isAdminUser?: boolean
  isCreateSessionDisabled?: boolean
  onSelectSidebarItem: (sidebarItemKey: SidebarItemKey) => void
  onPressCreateSession: () => void
  onOpenContact: () => void
  onOpenSettingsMenu: (anchorPoint: AnchorPoint) => void
}

export function Sidebar({
  selectedSidebarItemKey,
  isSettingsSelected,
  isAdminUser = false,
  isCreateSessionDisabled = false,
  onSelectSidebarItem,
  onPressCreateSession,
  onOpenContact,
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
        <Pressable
          disabled={isCreateSessionDisabled}
          onPress={onPressCreateSession}
          style={({ hovered }) => [
            styles.createSessionButton,
            isCompact ? styles.createSessionButtonCompact : undefined,
            isCreateSessionDisabled ? styles.createSessionButtonDisabled : undefined,
            hovered && !isCreateSessionDisabled ? styles.createSessionButtonHovered : undefined,
          ]}
        >
          {/* Nieuw verslag button */}
          <View style={[styles.createSessionButtonContent, isCompact ? styles.createSessionButtonContentCompact : undefined]}>
            <PlusIcon color="#FFFFFF" size={22} />
            {/* Nieuw verslag button label */}
            <Text
              numberOfLines={1}
              style={[styles.createSessionButtonText, isCompact ? styles.createSessionButtonTextCompact : undefined]}
            >
              {isCompact ? '' : 'Nieuw verslag'}
            </Text>
          </View>
        </Pressable>

        {/* Sidebar menu items */}
        <View style={styles.menuItems}>
          <SidebarItem
            label="Cliënten"
            isSelected={selectedSidebarItemKey === 'coachees'}
            onPress={() => onSelectSidebarItem('coachees')}
            icon={<CoacheesIcon color={selectedSidebarItemKey === 'coachees' ? selectedColor : unselectedColor} size={24} />}
            isCompact={isCompact}
          />
          <SidebarItem
            label="Verslagen"
            isSelected={selectedSidebarItemKey === 'sessies'}
            onPress={() => onSelectSidebarItem('sessies')}
            icon={<SessiesIcon color={selectedSidebarItemKey === 'sessies' ? selectedColor : unselectedColor} size={24} />}
            isCompact={isCompact}
          />
          <SidebarItem
            label="Templates"
            isSelected={selectedSidebarItemKey === 'templates'}
            onPress={() => onSelectSidebarItem('templates')}
            icon={<TemplatesIcon color={selectedSidebarItemKey === 'templates' ? selectedColor : unselectedColor} size={24} />}
            isCompact={isCompact}
          />
          <SidebarItem
            label="Huisstijl"
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
          label="Contact"
          isSelected={false}
          onPress={onOpenContact}
          icon={<ContactIcon color={unselectedColor} size={24} />}
          isCompact={isCompact}
        />
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
    backgroundColor: colors.surface,
    borderRightColor: colors.border,
    borderRightWidth: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  containerCompact: {
    width: 72,
    padding: 12,
  },
  topSection: {
    gap: 16,
  },
  createSessionButton: {
    width: 188,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.selected,
    borderWidth: 1,
    borderColor: colors.selected,
    padding: 12,
    justifyContent: 'center',
  },
  createSessionButtonCompact: {
    width: 48,
    height: 48,
    borderRadius: 10,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createSessionButtonHovered: {
    backgroundColor: '#A50058',
  },
  createSessionButtonDisabled: {
    backgroundColor: '#C6C6C6',
    borderColor: '#C6C6C6',
  },
  createSessionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  createSessionButtonContentCompact: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createSessionButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    ...( { transform: [{ translateY: 1 }] } as any ),
  },
  createSessionButtonTextCompact: {
    fontSize: 0,
    lineHeight: 0,
    width: 0,
  },
  menuItems: {
    gap: 8,
  },
  bottomSection: {
    gap: 8,
  },
})
