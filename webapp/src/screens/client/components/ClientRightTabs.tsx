import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'

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
          isSelected={false}
          isDisabled
          onPress={() => onSelectTab('status')}
        />
      </View>

      <View style={[styles.card, styles.bottomCardConnected]}>
        <MainContainer contentKey={`client-assistant-${activeTabKey}`} style={styles.assistantCardContent}>
          {activeTabKey === 'status' ? (
            <View style={styles.statusPanel}>
              {isStatusSummaryLoading ? (
                <View style={styles.statusLoadingState}>
                  <ActivityIndicator size="small" color={colors.selected} />
                </View>
              ) : (
                <Text style={styles.statusText}>{statusSummary}</Text>
              )}
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
  isDisabled?: boolean
  icon: (color: string) => React.ReactNode
  onPress: () => void
}

function RightTabButton({ label, isSelected, isDisabled = false, icon, onPress }: RightTabButtonProps) {
  const iconColor = isDisabled ? '#9AA0A6' : isSelected ? colors.selected : '#2C111F'
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      style={({ hovered }) => [
        styles.tabButton,
        isDisabled ? styles.tabButtonDisabled : undefined,
        isSelected ? styles.tabButtonSelected : styles.tabButtonUnselected,
        isSelected ? styles.tabButtonConnected : undefined,
        hovered && !isSelected && !isDisabled ? styles.tabButtonHovered : undefined,
      ]}
    >
      <View style={styles.tabButtonContent}>
        <View style={styles.statusIconWrap}>{icon(iconColor)}</View>
        <Text
          isSemibold
          style={[styles.tabText, isSelected ? styles.tabTextActive : undefined, isDisabled ? styles.tabTextDisabled : undefined]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  rightColumn: { flex: 1, minWidth: 420, minHeight: 640 },
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
    paddingHorizontal: 12,
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
  tabButtonDisabled: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  tabButtonConnected: {
    zIndex: 3,
  },
  tabButtonUnselected: { backgroundColor: '#F9FAFB', borderColor: '#DFE0E2', borderBottomWidth: 1 },
  tabButtonHovered: { backgroundColor: colors.hoverBackground },
  tabButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  statusIconWrap: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 16, lineHeight: 20, color: '#2C111F', fontFamily: typography.fontFamilySemibold },
  tabTextActive: { color: colors.selected },
  tabTextDisabled: { color: '#9AA0A6' },
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
  statusLoadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { fontSize: 14, lineHeight: 20, color: '#2C111F' },
})


