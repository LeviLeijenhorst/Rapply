import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { ClientPageAiChatIcon, ClientPageStatusIcon } from '@/icons/ClientPageSvgIcons'
import { colors } from '@/design/theme/colors'
import { typography } from '@/design/theme/typography'
import { MainContainer } from '@/ui/animated/MainContainer'
import { Text } from '@/ui/Text'
import type { ClientRightTabsProps } from '@/screens/client/clientScreen.types'

export function ClientRightTabs({
  activeTabKey,
  chatContent,
  isStatusSummaryLoading,
  rightColumnStyle,
  statusSummary,
  onSelectTab,
}: ClientRightTabsProps) {
  return (
    <View style={[styles.rightColumn, rightColumnStyle]}>
      <View style={styles.tabsRow}>
        <RightTabButton
          label="AI-chat"
          icon={(color) => <ClientPageAiChatIcon color={color} size={14} />}
          isSelected={activeTabKey === 'chatbot'}
          onPress={() => onSelectTab('chatbot')}
        />
        <RightTabButton
          label="Status"
          icon={(color) => <ClientPageStatusIcon color={color} size={18} />}
          isSelected={activeTabKey === 'status'}
          onPress={() => onSelectTab('status')}
        />
      </View>

      <View style={[styles.card, styles.bottomCardConnected]}>
        <MainContainer contentKey={`client-assistant-${activeTabKey}`} style={styles.assistantCardContent}>
          {activeTabKey === 'status' ? (
            <View style={styles.statusPanel}>
              <Text style={styles.statusText}>{isStatusSummaryLoading ? 'Status wordt gegenereerd...' : statusSummary}</Text>
            </View>
          ) : (
            chatContent
          )}
        </MainContainer>
      </View>
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
        hovered && !isSelected ? styles.tabButtonHovered : undefined,
      ]}
    >
      <View style={styles.tabButtonContent}>
        <View style={styles.statusIconWrap}>{icon(isSelected ? colors.selected : '#2C111F')}</View>
        <Text isSemibold style={[styles.tabText, isSelected ? styles.tabTextActive : undefined]}>
          {label}
        </Text>
      </View>
      {isSelected ? <View pointerEvents="none" style={styles.selectedTabBridge} /> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  rightColumn: { flex: 1, minWidth: 420, minHeight: 640 },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    zIndex: 50,
    marginBottom: 0,
    position: 'relative',
    ...({ overflow: 'visible' } as any),
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
    top: 0,
    position: 'relative',
  },
  tabButtonSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DFE0E2',
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    ...({ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } as any),
    zIndex: 1000,
    top: 1,
  },
  tabButtonUnselected: { backgroundColor: '#FFFFFF', borderColor: '#DFE0E2' },
  tabButtonHovered: { backgroundColor: colors.hoverBackground },
  tabButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  statusIconWrap: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 16, lineHeight: 20, color: '#2C111F', fontFamily: typography.fontFamilySemibold },
  tabTextActive: { color: colors.selected },
  selectedTabBridge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -8,
    height: 10,
    backgroundColor: '#FFFFFF',
    zIndex: 1001,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    gap: 0,
    minHeight: 0,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    ...({ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } as any),
    zIndex: 1,
  },
  bottomCardConnected: { marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 12 },
  assistantCardContent: { flex: 1, minHeight: 0 },
  statusPanel: { flex: 1, margin: 12, padding: 14 },
  statusText: { fontSize: 14, lineHeight: 20, color: '#2C111F' },
})
