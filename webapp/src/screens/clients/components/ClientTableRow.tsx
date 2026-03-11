import React from 'react'
import { Image, Pressable, StyleSheet, View } from 'react-native'

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
  const fallbackInitial = (item.clientName || 'C').trim().slice(0, 1).toUpperCase() || 'C'

  return (
    <Pressable onPress={() => onPress(item.clientId)} style={({ hovered }) => [styles.row, hovered ? styles.rowHovered : undefined]}>
      <View style={[styles.cell, styles.clientCell]}>
        <View style={styles.clientIdentityRow}>
          <View style={styles.avatarWrap}>
            {item.profilePhotoUri ? (
              <Image source={{ uri: item.profilePhotoUri }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Text isSemibold style={styles.avatarFallbackText}>{fallbackInitial}</Text>
            )}
          </View>
          <Text numberOfLines={1} isSemibold style={styles.clientName}>
            {item.clientName}
          </Text>
        </View>
      </View>
      <View style={[styles.cell, styles.trajectoryCell]}>
        <Text isSemibold style={styles.numberText}>
          {item.trajectoryCount}
        </Text>
      </View>
      <View style={[styles.cell, styles.sessionCell]}>
        <Text isSemibold style={styles.numberText}>
          {item.sessionCount}
        </Text>
      </View>
      <View style={[styles.cell, styles.reportsCell]}>
        <Text isSemibold style={styles.numberText}>
          {item.reportCount}
        </Text>
      </View>
      <View style={[styles.cell, styles.statusCell]}>
        <ClientStatusPill status={item.status} label={item.statusLabel} />
      </View>
      <View style={[styles.cell, styles.lastInputCell]}>
        <Text style={styles.lastInputText}>{item.lastInputLabel}</Text>
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
    flex: 1.7,
    minWidth: 180,
  },
  clientIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 16,
  },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#DADBDD',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallbackText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#2C111F',
  },
  trajectoryCell: {
    width: 150,
    alignItems: 'flex-start',
  },
  sessionCell: {
    width: 137,
    alignItems: 'flex-start',
  },
  reportsCell: {
    width: 168,
    alignItems: 'flex-start',
  },
  statusCell: {
    width: 100,
  },
  lastInputCell: {
    width: 160,
  },
  chevronCell: {
    width: 24,
    alignItems: 'center',
  },
  clientName: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
    flexShrink: 1,
  },
  numberText: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  lastInputText: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textSecondary,
  },
})

