import React, { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native'

import { colors } from '../../design/theme/colors'
import { typography } from '../../design/theme/typography'
import { ChevronDownIcon } from '../../icons/ChevronDownIcon'
import { NewClientAddIcon } from '../../icons/NewClientAddIcon'
import { useLocalAppData } from '../../storage/LocalAppDataProvider'
import { Text } from '../../ui/Text'
import { SearchBar } from '../../ui/inputs/SearchBar'
import { ClientTableRow } from './components/ClientTableRow'
import { type ClientListStatus, selectClientListItems } from './selectors/clientListSelectors'
import { filterClientListItems } from './viewModels/clientsViewModel'

type Props = {
  onSelectCoachee: (coacheeId: string) => void
  onOpenNewClientPage?: () => void
}

type ClientFilter = 'all' | ClientListStatus

const FILTER_OPTIONS: Array<{ key: ClientFilter; label: string }> = [
  { key: 'all', label: 'Alle cliënten' },
  { key: 'active', label: 'Actief' },
  { key: 'closed', label: 'Afgesloten' },
]

export function ClientsScreen({ onSelectCoachee, onOpenNewClientPage }: Props) {
  const { width: windowWidth } = useWindowDimensions()
  const { data } = useLocalAppData()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ClientFilter>('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [page, setPage] = useState(1)

  const allItems = useMemo(() => selectClientListItems(data), [data])
  const searchedItems = useMemo(() => filterClientListItems(allItems, query), [allItems, query])
  const visibleItems = useMemo(() => {
    if (filter === 'all') return searchedItems
    return searchedItems.filter((item) => item.status === filter)
  }, [filter, searchedItems])

  const pageSize = 11
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const searchInputRef = React.useRef<TextInput | null>(null)
  const isCompactHeader = windowWidth < 1320

  React.useEffect(() => {
    setPage(1)
  }, [filter, query])

  const currentFilterLabel = FILTER_OPTIONS.find((option) => option.key === filter)?.label || 'Alle cliënten'

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, isCompactHeader ? styles.headerRowCompact : undefined]}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Zoek cliënten..."
          inputRef={searchInputRef}
          containerStyle={styles.searchField}
        />

        <View style={styles.headerActions}>
          <View style={styles.filterWrap}>
            <Pressable
              onPress={() => setIsFilterOpen((value) => !value)}
              style={({ hovered }) => [styles.filterButton, hovered ? styles.filterButtonHovered : undefined]}
            >
              <Text style={styles.filterButtonText}>{currentFilterLabel}</Text>
              <ChevronDownIcon color="#93858D" size={18} />
            </Pressable>
            {isFilterOpen ? (
              <View style={styles.filterMenu}>
                {FILTER_OPTIONS.map((option) => (
                  <Pressable
                    key={option.key}
                    onPress={() => {
                      setFilter(option.key)
                      setIsFilterOpen(false)
                    }}
                    style={({ hovered }) => [
                      styles.filterMenuItem,
                      option.key === filter ? styles.filterMenuItemSelected : undefined,
                      hovered ? styles.filterMenuItemHovered : undefined,
                    ]}
                  >
                    <Text style={[styles.filterMenuText, option.key === filter ? styles.filterMenuTextSelected : undefined]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={() => onOpenNewClientPage?.()}
            style={({ hovered }) => [styles.newClientButton, hovered ? styles.newClientButtonHovered : undefined]}
          >
            <NewClientAddIcon color={colors.selected} size={18} />
            <Text style={styles.newClientButtonText}>
              Nieuwe cliënt
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <Text isSemibold style={[styles.headerText, styles.clientColumn]}>Cliënt</Text>
          <Text isSemibold style={[styles.headerText, styles.trajectoryColumn]}>Trajecten</Text>
          <Text isSemibold style={[styles.headerText, styles.sessionColumn]}>Sessies</Text>
          <Text isSemibold style={[styles.headerText, styles.reportsColumn]}>Rapportages</Text>
          <Text isSemibold style={[styles.headerText, styles.statusColumn]}>Status</Text>
          <Text isSemibold style={[styles.headerText, styles.lastSessionColumn]}>Laatste sessie</Text>
          <View style={styles.chevronColumn} />
        </View>

        <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
          {paginatedItems.map((item) => (
            <ClientTableRow key={item.clientId} item={item} onPress={onSelectCoachee} />
          ))}
          {paginatedItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Geen cliënten gevonden.</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerInfo}>
          Toont {paginatedItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
          {(currentPage - 1) * pageSize + paginatedItems.length} van {visibleItems.length} cliënten
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
  filterWrap: {
    position: 'relative',
    zIndex: 2,
  },
  filterButton: {
    width: 147,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  filterButtonText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: 16,
    lineHeight: 20,
    color: '#2C111F',
  },
  filterMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    width: 147,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    ...( { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } as any ),
    overflow: 'hidden',
  },
  filterMenuItem: {
    minHeight: 36,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterMenuItemHovered: {
    backgroundColor: colors.hoverBackground,
  },
  filterMenuItemSelected: {
    backgroundColor: '#FFF7FB',
  },
  filterMenuText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#2C111F',
  },
  filterMenuTextSelected: {
    color: colors.selected,
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
  statusColumn: {
    width: 100,
  },
  lastSessionColumn: {
    width: 160,
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
