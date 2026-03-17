import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../../../design/theme/colors'
import { ChevronRightIcon } from '../../../icons/ChevronRightIcon'
import { Text } from '../../../ui/Text'
import type { ReportListItem } from '../selectors/reportListSelectors'

type Props = {
  item: ReportListItem
  onPress: (reportId: string) => void
}

export function ReportCard({ item, onPress }: Props) {
  return (
    <Pressable onPress={() => onPress(item.reportId)} style={({ hovered }) => [styles.row, hovered ? styles.rowHovered : undefined]}>
      <View style={[styles.cell, styles.reportColumn]}>
        <Text isSemibold style={styles.reportTitle}>
          {item.title}
        </Text>
      </View>
      <View style={[styles.cell, styles.clientColumn]}>
        <Text isSemibold style={styles.clientName}>
          {item.clientName}
        </Text>
      </View>
      <View style={[styles.cell, styles.dateColumn]}>
        <Text isSemibold style={styles.dateText}>{item.createdAtLabel}</Text>
      </View>
      <View style={[styles.cell, styles.lastEditedColumn]}>
        <Text style={styles.lastEditedText}>{item.updatedRelativeLabel}</Text>
      </View>
      <View style={[styles.cell, styles.chevronColumn]}>
        <ChevronRightIcon color="#93858D" size={16} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
    paddingLeft: 24,
    paddingRight: 16,
    gap: 12,
  },
  rowHovered: {
    backgroundColor: colors.hoverBackground,
  },
  cell: {
    justifyContent: 'center',
  },
  reportColumn: {
    flex: 1.4,
    minWidth: 180,
  },
  clientColumn: {
    flex: 1.2,
    minWidth: 170,
  },
  dateColumn: {
    width: 160,
  },
  lastEditedColumn: {
    width: 180,
  },
  chevronColumn: {
    width: 24,
    alignItems: 'center',
  },
  reportTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  clientName: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  dateText: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  lastEditedText: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textSecondary,
  },
})
