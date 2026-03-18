import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { ClientPageAiChatIcon, ClientPageSessiesIcon } from '@/icons/ClientPageSvgIcons'
import { colors } from '@/design/theme/colors'
import { typography } from '@/design/theme/typography'
import type { RightTabsProps } from '@/screens/session/sessionScreen.types'
import { Text } from '@/ui/Text'

export function RightTabs({ activeTabKey, onTabChange }: RightTabsProps) {
  return (
    <View style={styles.tabsRow}>
      <RightTabButton
        label="Rapply"
        icon={(color) => <ClientPageAiChatIcon color={color} size={14} />}
        isSelected={activeTabKey === 'chatbot'}
        onPress={() => onTabChange('chatbot')}
      />
      <RightTabButton
        label="Notities"
        icon={(color) => <ClientPageSessiesIcon color={color} size={18} />}
        isSelected={activeTabKey === 'notes'}
        onPress={() => onTabChange('notes')}
      />
    </View>
  )
}

type RightTabButtonProps = {
  label: string
  isSelected: boolean
  icon: (color: string) => React.ReactNode
  onPress: () => void
}

function RightTabButton({ label, isSelected, icon, onPress }: RightTabButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [
        styles.tabButton,
        isSelected ? styles.tabButtonSelected : styles.tabButtonUnselected,
        isSelected ? styles.tabButtonConnected : undefined,
        hovered && !isSelected ? styles.tabButtonHovered : undefined,
      ]}
    >
      <View style={styles.tabButtonContent}>
        <View style={styles.iconWrap}>{icon(isSelected ? colors.selected : '#2C111F')}</View>
        <Text isSemibold style={[styles.tabText, isSelected ? styles.tabTextActive : undefined]}>
          {label}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: 0,
    zIndex: 2,
    marginBottom: -1,
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
    borderBottomWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    position: 'relative',
  },
  tabButtonSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DFE0E2',
  },
  tabButtonConnected: {
    zIndex: 3,
  },
  tabButtonUnselected: {
    backgroundColor: '#F9FAFB',
    borderColor: '#DFE0E2',
    borderBottomWidth: 1,
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
  iconWrap: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#2C111F',
    fontFamily: typography.fontFamilySemibold,
  },
  tabTextActive: {
    color: colors.selected,
  },
})
