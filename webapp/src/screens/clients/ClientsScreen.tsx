import React, { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native'

import { colors } from '../../design/theme/colors'
import { typography } from '../../design/theme/typography'
import { NewClientAddIcon } from '../../icons/NewClientAddIcon'
import { useLocalAppData } from '../../storage/LocalAppDataProvider'
import { Text } from '../../ui/Text'
import { SearchBar } from '../../ui/inputs/SearchBar'
import { ClientTableRow } from './components/ClientTableRow'
import { selectClientListItems } from './selectors/clientListSelectors'
import { filterClientListItems } from './viewModels/clientsViewModel'

type Props = {
  onSelectClient: (clientId: string) => void
  onOpenNewClientPage?: () => void
}

export function ClientsScreen({ onSelectClient, onOpenNewClientPage }: Props) {
  const { width: windowWidth } = useWindowDimensions()
  const { data } = useLocalAppData()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const allItems = useMemo(() => selectClientListItems(data), [data])
  const visibleItems = useMemo(() => filterClientListItems(allItems, query), [allItems, query])

  const pageSize = 11
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const searchInputRef = React.useRef<TextInput | null>(null)
  const isCompactHeader = windowWidth < 1320

  React.useEffect(() => {
    setPage(1)
  }, [query])

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, isCompactHeader ? styles.headerRowCompact : undefined]}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Zoek clienten..."
          inputRef={searchInputRef}
          containerStyle={styles.searchField}
        />

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => onOpenNewClientPage?.()}
            style={({ hovered }) => [styles.newClientButton, hovered ? styles.newClientButtonHovered : undefined]}
          >
            <NewClientAddIcon color={colors.selected} size={18} />
            <Text style={styles.newClientButtonText}>
              Nieuwe client
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <Text isSemibold style={[styles.headerText, styles.clientColumn]}>Client</Text>
          <Text isSemibold style={[styles.headerText, styles.trajectoryColumn]}>Trajecten</Text>
          <Text isSemibold style={[styles.headerText, styles.sessionColumn]}>Sessies</Text>
          <Text isSemibold style={[styles.headerText, styles.reportsColumn]}>Rapportages</Text>
          <Text isSemibold style={[styles.headerText, styles.lastInputColumn]}>Laatste sessie</Text>
          <View style={styles.chevronColumn} />
        </View>

        <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
          {paginatedItems.map((item) => (
            <ClientTableRow key={item.clientId} item={item} onPress={onSelectClient} />
          ))}
          {paginatedItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Geen clienten gevonden.</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerInfo}>
          Toont {paginatedItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
          {(currentPage - 1) * pageSize + paginatedItems.length} van {visibleItems.length} clienten
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
  headerRowCompact: {
    flexWrap: 'wrap',
  },
  searchField: {
    width: 296,
    maxWidth: '100%',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  newClientButton: {
    width: 168,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.selected,
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  newClientButtonHovered: {
    backgroundColor: '#FFF7FB',
  },
  newClientButtonText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: 16,
    lineHeight: 20,
    color: colors.selected,
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
    flex: 1.7,
    minWidth: 180,
  },
  trajectoryColumn: {
    width: 150,
  },
  sessionColumn: {
    width: 137,
  },
  reportsColumn: {
    width: 168,
  },
  lastInputColumn: {
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

