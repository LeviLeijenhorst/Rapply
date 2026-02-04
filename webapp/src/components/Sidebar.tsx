import React from 'react'
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'

import { colors } from '../theme/colors'
import { CoacheesIcon } from './icons/CoacheesIcon'
import { HelpCircleIcon } from './icons/HelpCircleIcon'
import { SessiesIcon } from './icons/SessiesIcon'
import { SettingsIcon } from './icons/SettingsIcon'
import { TemplatesIcon } from './icons/TemplatesIcon'
import { SidebarItem } from './SidebarItem'
import { Text } from './Text'

export type SidebarItemKey = 'coachees' | 'sessies' | 'templates'

type AnchorPoint = { x: number; y: number }

type Props = {
  selectedSidebarItemKey: SidebarItemKey
  onSelectSidebarItem: (sidebarItemKey: SidebarItemKey) => void
  onPressCreateSession: () => void
  onOpenHelpMenu: (anchorPoint: AnchorPoint) => void
  onOpenSettingsMenu: (anchorPoint: AnchorPoint) => void
}

export function Sidebar({ selectedSidebarItemKey, onSelectSidebarItem, onPressCreateSession, onOpenHelpMenu, onOpenSettingsMenu }: Props) {
  const { width } = useWindowDimensions()
  const isCompact = width < 700

  const selectedColor = colors.selected
  const unselectedColor = colors.text

  return (
    <View style={[styles.container, isCompact ? styles.containerCompact : undefined]}>
      <View style={styles.topSection}>
        <Pressable
          onPress={onPressCreateSession}
          style={({ hovered }) => [
            styles.createSessionButton,
            isCompact ? styles.createSessionButtonCompact : undefined,
            hovered ? styles.createSessionButtonHovered : undefined,
          ]}
        >
          {/* Nieuwe sessie button */}
          <View style={[styles.createSessionButtonContent, isCompact ? styles.createSessionButtonContentCompact : undefined]}>
            {/* Nieuwe sessie button label */}
            <Text
              numberOfLines={1}
              isBold
              style={[styles.createSessionButtonText, isCompact ? styles.createSessionButtonTextCompact : undefined]}
            >
              {isCompact ? '+' : '+ Nieuwe sessie'}
            </Text>
          </View>
        </Pressable>

        {/* Sidebar menu items */}
        <View style={styles.menuItems}>
          <SidebarItem
            label="Coachees"
            isSelected={selectedSidebarItemKey === 'coachees'}
            onPress={() => onSelectSidebarItem('coachees')}
            icon={<CoacheesIcon color={selectedSidebarItemKey === 'coachees' ? selectedColor : unselectedColor} size={24} />}
            isCompact={isCompact}
          />
          <SidebarItem
            label="Sessies"
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
        </View>
      </View>

      {/* Sidebar bottom items */}
      <View style={styles.bottomSection}>
        <SidebarItem
          label="Help"
          isSelected={false}
          onPress={(event) => {
            const rectFromCurrentTarget = (event as any)?.currentTarget?.getBoundingClientRect?.()
            const rectFromNativeTarget = (event?.nativeEvent as any)?.target?.getBoundingClientRect?.()
            const rect = rectFromCurrentTarget ?? rectFromNativeTarget

            const clientX = (event?.nativeEvent as any)?.clientX
            const clientY = (event?.nativeEvent as any)?.clientY
            const pageX = (event?.nativeEvent as any)?.pageX
            const pageY = (event?.nativeEvent as any)?.pageY

            const nextX = rect ? rect.left : typeof clientX === 'number' ? clientX : typeof pageX === 'number' ? pageX : 0
            const nextY = rect ? rect.top : typeof clientY === 'number' ? clientY : typeof pageY === 'number' ? pageY : 0
            onOpenHelpMenu({ x: nextX, y: nextY })
          }}
          icon={<HelpCircleIcon />}
          isCompact={isCompact}
        />
        <SidebarItem
          label="Instellingen"
          isSelected={false}
          onPress={(event) => {
            const rectFromCurrentTarget = (event as any)?.currentTarget?.getBoundingClientRect?.()
            const rectFromNativeTarget = (event?.nativeEvent as any)?.target?.getBoundingClientRect?.()
            const rect = rectFromCurrentTarget ?? rectFromNativeTarget

            const clientX = (event?.nativeEvent as any)?.clientX
            const clientY = (event?.nativeEvent as any)?.clientY
            const pageX = (event?.nativeEvent as any)?.pageX
            const pageY = (event?.nativeEvent as any)?.pageY

            const nextX = rect ? rect.left : typeof clientX === 'number' ? clientX : typeof pageX === 'number' ? pageX : 0
            const nextY = rect ? rect.top : typeof clientY === 'number' ? clientY : typeof pageY === 'number' ? pageY : 0
            onOpenSettingsMenu({ x: nextX, y: nextY })
          }}
          icon={<SettingsIcon color={unselectedColor} size={24} />}
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
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.selected,
    padding: 12,
    justifyContent: 'center',
  },
  createSessionButtonCompact: {
    width: 48,
    height: 48,
    borderRadius: 12,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createSessionButtonHovered: {
    backgroundColor: 'rgba(190,1,101,0.08)',
  },
  createSessionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: colors.selected,
    textAlign: 'center',
  },
  createSessionButtonTextCompact: {
    fontSize: 28,
    lineHeight: 32,
  },
  menuItems: {
    gap: 8,
  },
  bottomSection: {
    gap: 8,
  },
})

