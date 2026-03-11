import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { semanticColorTokens, brandColors } from '@/design/tokens/colors'
import { borderWidths } from '@/design/tokens/borderWidths'
import { fontSizes } from '@/design/tokens/fontSizes'
import { radius } from '@/design/tokens/radius'
import { spacing } from '@/design/tokens/spacing'
import { ClientPageAiChatIcon, ClientPageSessiesIcon } from '@/icons/ClientPageSvgIcons'
import type { RightTabsProps } from '@/screens/session/sessionScreen.types'
import { Text } from '@/ui/Text'

export function RightTabs({ activeTabKey, onTabChange }: RightTabsProps) {
  return (
    <View style={styles.row}>
      {/* Chatbot tab */}
      <Pressable
        onPress={() => onTabChange('chatbot')}
        style={({ hovered }) => [
          styles.tab,
          activeTabKey === 'chatbot' ? styles.tabActive : styles.tabInactive,
          hovered && activeTabKey !== 'chatbot' ? styles.tabHover : undefined,
        ]}
      >
        <View style={styles.tabInner}>
          <ClientPageAiChatIcon color={activeTabKey === 'chatbot' ? brandColors.primary : semanticColorTokens.light.textHeading} size={14} />
          <Text isSemibold style={[styles.tabText, activeTabKey === 'chatbot' ? styles.tabTextActive : undefined]}>
            Chatbot
          </Text>
        </View>
      </Pressable>

      {/* Notes tab */}
      <Pressable
        onPress={() => onTabChange('notes')}
        style={({ hovered }) => [
          styles.tab,
          activeTabKey === 'notes' ? styles.tabActive : styles.tabInactive,
          hovered && activeTabKey !== 'notes' ? styles.tabHover : undefined,
        ]}
      >
        <View style={styles.tabInner}>
          <ClientPageSessiesIcon color={activeTabKey === 'notes' ? brandColors.primary : semanticColorTokens.light.textHeading} size={18} />
          <Text isSemibold style={[styles.tabText, activeTabKey === 'notes' ? styles.tabTextActive : undefined]}>
            Notities
          </Text>
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tab: {
    height: 46,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: borderWidths.hairline,
    paddingHorizontal: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: semanticColorTokens.light.elevatedSurface,
    borderColor: semanticColorTokens.light.panelBorder,
    borderBottomColor: semanticColorTokens.light.elevatedSurface,
    top: borderWidths.hairline,
  },
  tabInactive: {
    backgroundColor: semanticColorTokens.light.elevatedSurface,
    borderColor: semanticColorTokens.light.panelBorder,
  },
  tabHover: {
    backgroundColor: semanticColorTokens.light.hoverAccent,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tabText: {
    fontSize: fontSizes.md,
    lineHeight: 20,
    color: semanticColorTokens.light.textHeading,
  },
  tabTextActive: {
    color: brandColors.primary,
  },
})
