import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../../../design/theme/colors'
import { ChevronRightIcon } from '../../../icons/ChevronRightIcon'
import { Text } from '../../../ui/Text'
import type { ClientListItem } from '../selectors/clientListSelectors'
import { ClientStatusPill } from './ClientStatusPill'

type Props = {
  item: ClientListItem
  onPress: (clientId: string) => void
}

export function ClientTableRow({ item, onPress }: Props) {
  return (
    <Pressable onPress={() => onPress(item.clientId)} style={({ hovered }) => [styles.row, hovered ? styles.rowHovered : undefined]}>
      <View style={[styles.cell, styles.clientCell]}>
        <Text isSemibold style={styles.clientName}>
          {item.clientName}
        </Text>
      </View>
      <View style={[styles.cell, styles.numberCell]}>
        <Text isSemibold style={styles.numberText}>
          {item.trajectoryCount}
        </Text>
      </View>
      <View style={[styles.cell, styles.numberCell]}>
        <Text isSemibold style={styles.numberText}>
          {item.sessionCount}
        </Text>
      </View>
      <View style={[styles.cell, styles.numberCell]}>
        <Text isSemibold style={styles.numberText}>
          {item.reportCount}
        </Text>
      </View>
      <View style={[styles.cell, styles.statusCell]}>
        <ClientStatusPill status={item.status} label={item.statusLabel} />
      </View>
      <View style={[styles.cell, styles.lastSessionCell]}>
        <Text style={styles.lastSessionText}>{item.lastSessionLabel}</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
    paddingHorizontal: 16,
    gap: 12,
  },
  rowHovered: {
    backgroundColor: colors.hoverBackground,
  },
  cell: {
    justifyContent: 'center',
  },
  clientCell: {
    flex: 1.7,
    minWidth: 180,
  },
  numberCell: {
    width: 86,
    alignItems: 'flex-start',
  },
  statusCell: {
    width: 110,
  },
  lastSessionCell: {
    width: 140,
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
  numberText: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  lastSessionText: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textSecondary,
  },
})
