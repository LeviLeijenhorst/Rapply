import React from 'react'
import { StyleSheet, View } from 'react-native'

import { semanticColorTokens } from '@/design/tokens/colors'
import { fontSizes } from '@/design/tokens/fontSizes'
import { spacing } from '@/design/tokens/spacing'
import { SessionCalendarIcon, SessionUserProfileIcon } from '@/icons/SessionPageIcons'
import type { HeaderProps } from '@/screens/session/sessionScreen.types'
import { Text } from '@/ui/Text'

export function Header({ title, clientName, date }: HeaderProps) {
  return (
    <View style={styles.container}>
      {/* Session title */}
      <Text isSemibold style={styles.title}>{title}</Text>

      {/* Session meta row */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <SessionUserProfileIcon size={16} />
          <Text style={styles.metaText}>{clientName}</Text>
        </View>
        {date ? (
          <View style={styles.metaItem}>
            <Text style={styles.separator}>•</Text>
            <SessionCalendarIcon size={16} />
            <Text style={styles.metaText}>{date}</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSizes.xxl,
    lineHeight: 46,
    color: semanticColorTokens.light.textHeading,
  },
  metaRow: {
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
  separator: {
    marginRight: spacing.xxs,
    color: semanticColorTokens.light.textHeading,
    fontSize: fontSizes.md,
    lineHeight: 18,
  },
  metaText: {
    color: semanticColorTokens.light.textHeading,
    fontSize: fontSizes.md,
    lineHeight: 20,
  },
})
