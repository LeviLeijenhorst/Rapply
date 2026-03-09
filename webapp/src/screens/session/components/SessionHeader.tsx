import React from 'react'
import { StyleSheet, View } from 'react-native'

import { colors } from '../../../design/theme/colors'
import { fontSizes } from '../../../design/tokens/fontSizes'
import { spacing } from '../../../design/tokens/spacing'
import { Text } from '../../../ui/Text'
import { SessionCalendarIcon, SessionUserProfileIcon } from './SessionIcons'

type Props = {
  title: string
  clientName: string
  dateLabel: string
  onBack: () => void
}

export function SessionHeader({ title, clientName, dateLabel }: Props) {
  return (
    <View style={styles.row}>
      <Text isSemibold style={styles.title}>{title}</Text>
      <View style={styles.metaInline}>
        <View style={styles.metaItem}>
          <SessionUserProfileIcon size={18} />
          <Text style={styles.metaText}>{clientName}</Text>
        </View>
        {dateLabel ? (
          <View style={styles.metaItem}>
            <Text style={styles.separator}>·</Text>
            <SessionCalendarIcon size={18} />
            <Text style={styles.metaText}>{dateLabel}</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.md,
  },
  title: {
    fontSize: 32,
    lineHeight: 45,
    color: colors.textStrong,
  },
  metaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSizes.md,
    lineHeight: 24,
    color: colors.textStrong,
  },
  separator: {
    fontSize: fontSizes.md,
    lineHeight: 24,
    color: '#2C111F',
  },
})
