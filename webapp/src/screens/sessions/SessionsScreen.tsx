import React, { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { colors } from '../../design/theme/colors'
import { typography } from '../../design/theme/typography'
import { useLocalAppData } from '../../storage/LocalAppDataProvider'
import { Text } from '../../ui/Text'
import { SearchBar } from '../../ui/inputs/SearchBar'
import { SessionTableRow } from './components/SessionTableRow'
import { selectSessionListItems, type SessionListItem } from './selectors/sessionListSelectors'
import { filterSessionListItems } from './viewModels/sessionsViewModel'

type Props = {
  onSelectSession: (item: SessionListItem) => void
}

export function SessionsScreen({ onSelectSession }: Props) {
  const { data } = useLocalAppData()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const allItems = useMemo(() => selectSessionListItems(data), [data])
  const visibleItems = useMemo(() => filterSessionListItems(allItems, query), [allItems, query])

  const pageSize = 11
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const searchInputRef = React.useRef<TextInput | null>(null)

  React.useEffect(() => {
    setPage(1)
  }, [query])

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Zoek sessies..."
          inputRef={searchInputRef}
          containerStyle={styles.searchField}
        />
      </View>

      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <Text isSemibold style={[styles.headerText, styles.clientColumn]}>Client</Text>
          <Text isSemibold style={[styles.headerText, styles.titleColumn]}>Titel</Text>
          <Text isSemibold style={[styles.headerText, styles.dateColumn]}>Datum</Text>
          <View style={styles.chevronColumn} />
        </View>

        <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
          {paginatedItems.map((item) => (
            <SessionTableRow key={item.inputId} item={item} onPress={onSelectSession} />
          ))}
          {paginatedItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Geen sessies gevonden.</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerInfo}>
          Toont {paginatedItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
          {(currentPage - 1) * pageSize + paginatedItems.length} van {visibleItems.length} sessies
        </Text>
        {totalPages > 1 ? (
          <View style={styles.paginationRow}>
            <Pressable
              onPress={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage <= 1}
              style={({ hovered }) => [
                styles.paginationButton,
                currentPage <= 1 ? styles.paginationButtonDisabled : undefined,
                hovered && currentPage > 1 ? styles.paginationButtonHovered : undefined,
              ]}
            >
              <Text style={styles.paginationButtonText}>Vorige</Text>
            </Pressable>
            <View style={styles.paginationBadge}>
              <Text style={styles.paginationBadgeText}>{currentPage}</Text>
            </View>
            <Pressable
              onPress={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={currentPage >= totalPages}
              style={({ hovered }) => [
                styles.paginationButton,
                currentPage >= totalPages ? styles.paginationButtonDisabled : undefined,
                hovered && currentPage < totalPages ? styles.paginationButtonHovered : undefined,
              ]}
            >
              <Text style={styles.paginationButtonText}>Volgende</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 14,
  },
  headerRow: {
    position: 'relative',
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  searchField: {
    width: 296,
    maxWidth: '100%',
  },
  tableCard: {
    position: 'relative',
    zIndex: 1,
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    ...( { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } as any ),
    overflow: 'hidden',
  },
  tableHeaderRow: {
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE0E2',
    paddingLeft: 24,
    paddingRight: 16,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tableBody: {
    flex: 1,
  },
  headerText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: 16,
    lineHeight: 20,
    color: 'rgba(44,17,31,0.5)',
  },
  clientColumn: {
    flex: 1.5,
    minWidth: 180,
  },
  titleColumn: {
    flex: 2.1,
    minWidth: 220,
  },
  dateColumn: {
    width: 180,
  },
  chevronColumn: {
    width: 24,
  },
  emptyState: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerInfo: {
    fontSize: 16,
    lineHeight: 20,
    color: 'rgba(44,17,31,0.5)',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paginationButton: {
    minWidth: 92,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  paginationButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  paginationButtonDisabled: {
    opacity: 0.4,
  },
  paginationButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  paginationBadge: {
    minWidth: 36,
    height: 28,
    borderRadius: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.selected,
  },
  paginationBadgeText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})
