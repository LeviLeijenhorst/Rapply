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
        <View style={styles.titlePill}>
          <Pressable onPress={onBack} style={({ hovered }) => [styles.backButton, hovered ? styles.backButtonHover : undefined]}>
            <ChevronLeftIcon color={semanticColorTokens.light.textHeading} size={24} />
          </Pressable>
          <Text isSemibold style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <ProfileCircleIcon size={24} />
            <Text isSemibold style={styles.metaText} numberOfLines={1}>
              {clientName}
            </Text>
          </View>
          {date ? (
            <View style={styles.metaPill}>
              <CalendarCircleIcon size={24} />
              <Text isSemibold style={styles.metaText}>{date}</Text>
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
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  titlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#ECEDEF',
    borderRadius: radius.lg,
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 260,
    maxWidth: 560,
    flexShrink: 1,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonHover: {
    backgroundColor: semanticColorTokens.light.hoverAccent,
  },
  title: {
    flexShrink: 1,
    color: semanticColorTokens.light.textHeading,
    fontSize: fontSizes.xxl,
    lineHeight: 40,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  metaPill: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: '#ECEDEF',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    color: semanticColorTokens.light.textHeading,
    fontSize: fontSizes.xl,
    lineHeight: 24,
  },
})
