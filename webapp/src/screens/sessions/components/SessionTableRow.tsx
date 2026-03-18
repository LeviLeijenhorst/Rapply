import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../../../design/theme/colors'
import { ChevronRightIcon } from '../../../icons/ChevronRightIcon'
import { Text } from '../../../ui/Text'
import type { SessionListItem } from '../selectors/sessionListSelectors'

type Props = {
  item: SessionListItem
  onPress: (item: SessionListItem) => void
}

export function SessionTableRow({ item, onPress }: Props) {
  return (
    <Pressable onPress={() => onPress(item)} style={({ hovered }) => [styles.row, hovered ? styles.rowHovered : undefined]}>
      <View style={[styles.cell, styles.clientCell]}>
        <Text numberOfLines={1} isSemibold style={styles.clientName}>
          {item.clientName}
        </Text>
      </View>
      <View style={[styles.cell, styles.titleCell]}>
        <Text numberOfLines={1} isSemibold style={styles.titleText}>
          {item.title}
        </Text>
      </View>
      <View style={[styles.cell, styles.dateCell]}>
        <Text style={styles.dateText}>{item.dateLabel}</Text>
      </View>
      <View style={[styles.cell, styles.chevronCell]}>
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
    borderBottomWidth: 0,
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
  clientCell: {
    flex: 1.5,
    minWidth: 180,
  },
  titleCell: {
    flex: 2.1,
    minWidth: 220,
  },
  dateCell: {
    width: 180,
  },
  chevronCell: {
    width: 24,
    alignItems: 'center',
  },
  clientName: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  titleText: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  dateText: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textSecondary,
  },
})
