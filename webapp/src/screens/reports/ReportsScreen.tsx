import React, { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { useLocalAppData } from '../../storage/LocalAppDataProvider'
import { colors } from '../../design/theme/colors'
import { typography } from '../../design/theme/typography'
import { Text } from '../../ui/Text'
import { ReportsSearch } from './components/ReportsSearch'
import { ReportsList } from './components/ReportsList'
import { selectReportListItems } from './selectors/reportListSelectors'
import { filterReportItems } from './viewModels/reportsViewModel'

type Props = {
  onOpenReport: (sessionId: string) => void
}

export function ReportsScreen({ onOpenReport }: Props) {
  const { data } = useLocalAppData()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const allItems = useMemo(() => selectReportListItems(data), [data])
  const visibleItems = useMemo(() => filterReportItems(allItems, query), [allItems, query])
  const pageSize = 11
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  React.useEffect(() => {
    setPage(1)
  }, [query])

  return (
    <View style={styles.container}>
      <ReportsSearch value={query} onChange={setQuery} />

      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <Text isSemibold style={[styles.headerText, styles.reportColumn]}>Rapportage</Text>
          <Text isSemibold style={[styles.headerText, styles.clientColumn]}>Cliënt</Text>
          <Text isSemibold style={[styles.headerText, styles.createdColumn]}>Aangemaakt</Text>
          <Text isSemibold style={[styles.headerText, styles.statusColumn]}>Status</Text>
          <Text isSemibold style={[styles.headerText, styles.updatedColumn]}>Laatst bewerkt</Text>
          <View style={styles.chevronColumn} />
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ReportsList items={paginatedItems} onSelect={onOpenReport} />
        </ScrollView>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerInfo}>
          Toont {paginatedItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
          {(currentPage - 1) * pageSize + paginatedItems.length} van {visibleItems.length} rapportages
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
  tableCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
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
  headerText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: 16,
    lineHeight: 20,
    color: 'rgba(44,17,31,0.5)',
  },
  reportColumn: {
    flex: 1.4,
    minWidth: 180,
  },
  clientColumn: {
    flex: 1.2,
    minWidth: 170,
  },
  createdColumn: {
    width: 160,
  },
  statusColumn: {
    width: 100,
  },
  updatedColumn: {
    width: 160,
  },
  chevronColumn: {
    width: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
