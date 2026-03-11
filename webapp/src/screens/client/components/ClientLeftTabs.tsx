import React from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

import {
  ClientPageDocumentenIcon,
  ClientPageNotesIcon,
  ClientPageRapportageIcon,
  ClientPageSessiesIcon,
} from '@/icons/ClientPageSvgIcons'
import { MoreOptionsIcon } from '@/icons/MoreOptionsIcon'
import { PlusIcon } from '@/icons/PlusIcon'
import { colors } from '@/design/theme/colors'
import { typography } from '@/design/theme/typography'
import { MainContainer } from '@/ui/animated/MainContainer'
import { ExpandableSearchField } from '@/ui/inputs/ExpandableSearchField'
import { Text } from '@/ui/Text'
import type { ClientLeftTabsProps } from '@/screens/client/clientScreen.types'

export function ClientLeftTabs({
  activeTabKey,
  filteredSessions,
  hoveredItemId,
  hoveredMenuItemId,
  isDocumentsTab,
  isSearchExpanded,
  leftColumnStyle,
  menuSessionId,
  searchInputRef,
  searchPlaceholder,
  searchQuery,
  title,
  shouldShowSearch,
  showsDurationColumn,
  tableFirstColumnLabel,
  onAddItem,
  onOpenRowMenu,
  onPressRow,
  onSelectTab,
  setHoveredItemId,
  setHoveredMenuItemId,
  setIsSearchOpen,
  setSearchQuery,
}: ClientLeftTabsProps) {
  return (
    <View style={[styles.leftColumn, leftColumnStyle]}>
      <View style={styles.tabsRow}>
        <View style={[styles.leftTabsList, styles.leftTabsListWeb]}>
          <LeftTabButton
            label="Sessies"
            icon={(color) => <ClientPageNotesIcon color={color} size={18} />}
            isSelected={activeTabKey === 'sessies'}
            onPress={() => onSelectTab('sessies')}
          />
          <LeftTabButton
            label="Notities"
            icon={(color) => <ClientPageSessiesIcon color={color} size={18} />}
            isSelected={activeTabKey === 'notities'}
            onPress={() => onSelectTab('notities')}
          />
          <LeftTabButton
            label="Rapportages"
            icon={(color) => <ClientPageRapportageIcon color={color} size={18} />}
            isSelected={activeTabKey === 'rapportages'}
            onPress={() => onSelectTab('rapportages')}
          />
          <LeftTabButton
            label="Documenten"
            icon={(color) => <ClientPageDocumentenIcon color={color} size={18} />}
            isSelected={activeTabKey === 'documenten'}
            onPress={() => onSelectTab('documenten')}
          />
        </View>
      </View>

      <View style={[styles.card, styles.bottomCardConnected]}>
        <View style={styles.sessionsHeaderRow}>
          <View style={styles.sessionsHeaderTitleWrap}>
            <Text isSemibold style={styles.sessionsHeaderTitle}>
              {title}
            </Text>
            <Text style={styles.sessionsHeaderCount}>{`(${filteredSessions.length})`}</Text>
          </View>
          <View style={styles.sessionsHeaderActions}>
            {shouldShowSearch ? (
              <ExpandableSearchField
                isExpanded={isSearchExpanded}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={searchPlaceholder}
                onExpand={() => setIsSearchOpen(true)}
                onBlur={() => {
                  if (searchQuery.trim().length === 0) setIsSearchOpen(false)
                }}
                inputRef={searchInputRef}
                collapsedLabel="Zoeken"
                expandedWidth={220}
                collapsedWidth={138}
                containerStyle={styles.searchField}
                inputStyle={styles.searchFieldInput}
              />
            ) : null}
            <Pressable
              onPress={onAddItem}
              accessibilityRole="button"
              accessibilityLabel={
                activeTabKey === 'notities'
                  ? 'Nieuwe notitie'
                  : activeTabKey === 'rapportages'
                    ? 'Nieuwe rapportage'
                    : activeTabKey === 'documenten'
                      ? 'Nieuw document'
                      : 'Nieuwe sessie'
              }
              style={({ hovered }) => [styles.quickAddButton, hovered ? styles.quickAddButtonHovered : undefined]}
            >
              <PlusIcon color="#FFFFFF" size={18} />
            </Pressable>
          </View>
        </View>

        <MainContainer contentKey={`client-list-${activeTabKey}`}>
          {isDocumentsTab ? (
            <View style={styles.documentsPlaceholder}>
              <Text style={styles.documentsPlaceholderText}>Documenten worden hier binnenkort toegevoegd.</Text>
            </View>
          ) : (
            <>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderText, styles.tableSessionCol]}>{tableFirstColumnLabel}</Text>
                <Text style={[styles.tableHeaderText, styles.tableDateCol]}>Datum</Text>
                {showsDurationColumn ? <Text style={[styles.tableHeaderText, styles.tableDurationCol]}>Duur</Text> : null}
              </View>

              <ScrollView style={styles.sessionsScroll} contentContainerStyle={styles.sessionsScrollContent} showsVerticalScrollIndicator={false}>
                {filteredSessions.length === 0 ? (
                  <View style={styles.emptyTableState}>
                    <Text style={styles.emptySessionsText}>Geen items gevonden.</Text>
                  </View>
                ) : null}
                {filteredSessions.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => onPressRow(item)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      item.rowType === 'note'
                        ? `Open notitie ${item.title}`
                        : item.rowType === 'report'
                          ? `Open rapportage ${item.title}`
                          : `Open sessie ${item.title}`
                    }
                    onHoverIn={() => setHoveredItemId(item.id)}
                    onHoverOut={() => setHoveredItemId((previous) => (previous === item.id ? null : previous))}
                    style={({ hovered }) => [styles.tableRow, hovered ? styles.tableRowHovered : undefined]}
                  >
                    <View style={styles.tableSessionCol}>
                      <Text isSemibold style={styles.tableSessionTitle}>
                        {item.title}
                      </Text>
                      <Text style={styles.tableSessionSub}>{item.trajectoryLabel}</Text>
                    </View>
                    <View style={styles.tableDateCol}>
                      <Text style={styles.tableDateMain}>{item.dateLabel}</Text>
                      {!item.isReport ? <Text style={styles.tableDateSub}>{item.timeLabel}</Text> : null}
                    </View>
                    {showsDurationColumn ? (
                      <View style={styles.tableDurationCol}>
                        <Text style={styles.tableDurationText}>{item.durationLabel || '-'}</Text>
                      </View>
                    ) : null}
                    <Pressable
                      pointerEvents={
                        hoveredItemId === item.id || hoveredMenuItemId === item.id || menuSessionId === item.id
                          ? 'auto'
                          : 'none'
                      }
                      onHoverIn={() => setHoveredMenuItemId(item.id)}
                      onHoverOut={() => setHoveredMenuItemId((previous) => (previous === item.id ? null : previous))}
                      onPress={(event) => {
                        ;(event as any)?.stopPropagation?.()
                        onOpenRowMenu(item, event)
                      }}
                      style={({ hovered }) => [
                        styles.rowMenuButton,
                        hoveredItemId === item.id || hoveredMenuItemId === item.id || menuSessionId === item.id
                          ? undefined
                          : styles.rowMenuButtonHidden,
                        hovered ? styles.rowMenuButtonHovered : undefined,
                      ]}
                    >
                      <MoreOptionsIcon color="#656565" size={18} />
                    </Pressable>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </MainContainer>
      </View>
    </View>
  )
}

type LeftTabButtonProps = {
  label: string
  isSelected: boolean
  icon: (color: string) => React.ReactNode
  onPress: () => void
}

function LeftTabButton({ label, isSelected, icon, onPress }: LeftTabButtonProps) {
  const iconColor = isSelected ? colors.selected : colors.text
  const textColor = isSelected ? colors.selected : colors.text

  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [
        styles.leftTabButton,
        isSelected ? styles.leftTabButtonSelected : styles.leftTabButtonUnselected,
        hovered && !isSelected ? styles.leftTabButtonHovered : undefined,
      ]}
    >
      <View style={styles.leftTabButtonContent}>
        {icon(iconColor)}
        <Text isSemibold style={[styles.leftTabLabel, { color: textColor }]}>
          {label}
        </Text>
      </View>
      {isSelected ? <View pointerEvents="none" style={styles.leftTabSelectedBridge} /> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  leftColumn: { flex: 1.65, minWidth: 0, minHeight: 640 },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingLeft: 0,
    zIndex: 50,
    marginBottom: 0,
    position: 'relative',
    overflow: 'visible',
  },
  leftTabsList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 0,
    paddingVertical: 0,
    position: 'relative',
    zIndex: 30,
  },
  leftTabsListWeb: {
    ...({ overflow: 'visible' } as any),
    ...({ scrollbarWidth: 'none' } as any),
    ...({ msOverflowStyle: 'none' } as any),
  },
  leftTabButton: {
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
    ...({ overflow: 'visible' } as any),
  },
  leftTabButtonSelected: {
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
    zIndex: 100,
    top: 1,
  },
  leftTabButtonUnselected: { backgroundColor: '#FFFFFF', borderColor: '#DFE0E2' },
  leftTabButtonHovered: { backgroundColor: colors.hoverBackground },
  leftTabButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  leftTabLabel: { fontSize: 16, lineHeight: 20 },
  leftTabSelectedBridge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -10,
    height: 12,
    backgroundColor: '#FFFFFF',
    zIndex: 200,
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
  sessionsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 24, paddingVertical: 20 },
  sessionsHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0 },
  sessionsHeaderTitleWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  sessionsHeaderTitle: { fontSize: 24, lineHeight: 34, color: '#2C111F' },
  sessionsHeaderCount: { fontSize: 24, lineHeight: 34, color: 'rgba(44,17,31,0.5)', fontFamily: typography.fontFamilyRegular },
  searchField: { backgroundColor: '#F9FAFB', borderColor: '#DFE0E2' },
  searchFieldInput: { fontFamily: typography.fontFamilyMedium, color: '#656565' },
  quickAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.selected,
    borderWidth: 1,
    borderColor: colors.selected,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddButtonHovered: { backgroundColor: '#A50058', borderColor: '#A50058' },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#DFE0E2',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#F9FAFB',
  },
  tableHeaderText: { fontSize: 16, lineHeight: 20, color: 'rgba(44,17,31,0.5)' },
  tableSessionCol: { flex: 1.45, minWidth: 0 },
  tableDateCol: { width: 170 },
  tableDurationCol: { width: 90 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#DFE0E2',
    paddingVertical: 14,
    paddingHorizontal: 24,
    position: 'relative',
    ...({ cursor: 'pointer' } as any),
  },
  tableRowHovered: { backgroundColor: '#FAFAFA' },
  tableSessionTitle: { fontSize: 16, lineHeight: 20, color: '#2C111F', paddingRight: 8 },
  tableSessionSub: { marginTop: 4, fontSize: 14, lineHeight: 18, color: 'rgba(44,17,31,0.5)' },
  tableDateMain: { fontSize: 14, lineHeight: 16, color: 'rgba(44,17,31,0.5)', fontFamily: typography.fontFamilySemibold },
  tableDateSub: { marginTop: 2, fontSize: 14, lineHeight: 16, color: 'rgba(44,17,31,0.5)' },
  tableDurationText: { fontSize: 14, lineHeight: 16, color: 'rgba(44,17,31,0.5)' },
  rowMenuButton: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -17,
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMenuButtonHidden: { opacity: 0 },
  rowMenuButtonHovered: { backgroundColor: colors.hoverBackground },
  sessionsScroll: { flex: 1 },
  sessionsScrollContent: { gap: 0, paddingBottom: 0 },
  emptyTableState: { paddingVertical: 24, alignItems: 'center', justifyContent: 'center' },
  emptySessionsText: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, textAlign: 'center' },
  documentsPlaceholder: { borderTopWidth: 1, borderTopColor: '#DFE0E2', paddingHorizontal: 24, paddingVertical: 28 },
  documentsPlaceholderText: { fontSize: 15, lineHeight: 22, color: 'rgba(44,17,31,0.6)' },
})
