import React from 'react'
import { StyleSheet, View } from 'react-native'

import { Text } from '../../../ui/Text'
import type { ClientListStatus } from '../selectors/clientListSelectors'

type Props = {
  status: ClientListStatus
  label: string
}

export function ClientStatusPill({ status, label }: Props) {
  const isActive = status === 'active'
  return (
    <View style={[styles.pill, isActive ? styles.activePill : styles.closedPill]}>
      <Text isSemibold style={[styles.pillText, isActive ? styles.activeText : styles.closedText]}>
        {`• ${label}`}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  activePill: {
    backgroundColor: '#D4FDE5',
  },
  closedPill: {
    backgroundColor: '#F3F4F6',
  },
  pillText: {
    fontSize: 12,
    lineHeight: 14,
  },
  activeText: {
    color: '#008234',
  },
  closedText: {
    color: '#2C111F',
  },
})
