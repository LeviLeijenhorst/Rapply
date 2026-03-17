import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { semanticColorTokens } from '@/design/tokens/colors'
import { fontSizes } from '@/design/tokens/fontSizes'
import { radius } from '@/design/tokens/radius'
import { spacing } from '@/design/tokens/spacing'
import { CalendarCircleIcon } from '@/icons/CalendarCircleIcon'
import { ChevronLeftIcon } from '@/icons/ChevronLeftIcon'
import { ProfileCircleIcon } from '@/icons/ProfileCircleIcon'
import type { HeaderProps } from '@/screens/session/sessionScreen.types'
import { Text } from '@/ui/Text'

export function Header({ title, clientName, date, onBack }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable onPress={onBack} style={({ hovered }) => [styles.titlePill, hovered ? styles.titlePillHover : undefined]}>
          <View style={styles.backIconWrap}>
            <ChevronLeftIcon color={semanticColorTokens.light.textHeading} size={18} />
          </View>
          <Text isBold style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </Pressable>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <ProfileCircleIcon size={24} />
            <Text isBold style={styles.metaText} numberOfLines={1}>
              {clientName}
            </Text>
          </View>
          {date ? (
            <View style={styles.metaPill}>
              <CalendarCircleIcon size={24} />
              <Text isBold style={styles.metaText}>{date}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    flexWrap: 'nowrap',
  },
  titlePill: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'transparent',
    borderRadius: radius.sm,
    paddingLeft: spacing.xxs,
    paddingRight: spacing.xs,
    minWidth: 0,
    maxWidth: 560,
    flexShrink: 1,
  },
  titlePillHover: {
    backgroundColor: semanticColorTokens.light.hoverAccent,
  },
  backIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flexShrink: 1,
    color: semanticColorTokens.light.textHeading,
    fontSize: fontSizes.md,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    flexWrap: 'nowrap',
    flexShrink: 0,
  },
  metaPill: {
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  metaText: {
    color: semanticColorTokens.light.textHeading,
    fontSize: fontSizes.md,
    lineHeight: 20,
  },
})
