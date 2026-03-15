import React from 'react'
import { StyleSheet, View } from 'react-native'

import { Text } from '../../../ui/Text'
import type { ReportListItem } from '../selectors/reportListSelectors'
import { ReportCard } from './ReportCard'

type Props = {
  items: ReportListItem[]
  onSelect: (reportId: string) => void
}

export function ReportsList({ items, onSelect }: Props) {
  if (items.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Geen rapportages gevonden.</Text>
      </View>
    )
  }

  return (
      <View style={styles.list}>
        {items.map((item) => (
        <ReportCard key={item.reportId} item={item} onPress={onSelect} />
        ))}
      </View>
  )
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  emptyState: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
  },
})
