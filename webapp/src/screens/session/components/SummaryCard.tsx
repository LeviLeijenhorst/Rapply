import React from 'react'
import { LayoutAnimation, Platform, Pressable, StyleSheet, UIManager, View } from 'react-native'

import { semanticColorTokens } from '@/design/tokens/colors'
import { borderWidths } from '@/design/tokens/borderWidths'
import { fontSizes } from '@/design/tokens/fontSizes'
import { radius } from '@/design/tokens/radius'
import { rnShadows } from '@/design/tokens/shadows'
import { spacing } from '@/design/tokens/spacing'
import { InputEditIcon } from '@/icons/InputPageIcons'
import type { SummaryCardProps } from '@/screens/session/sessionScreen.types'
import { LoadingSpinner } from '@/ui/LoadingSpinner'
import { Text } from '@/ui/Text'

const summaryBodyMinHeight = 192

if (Platform.OS === 'android' && (UIManager as any).setLayoutAnimationEnabledExperimental) {
  ;(UIManager as any).setLayoutAnimationEnabledExperimental(true)
}

export function SummaryCard({ summary, title = 'Samenvatting', emptyText, transcriptionStatus, onPressEdit = null }: SummaryCardProps) {
  const summaryText = String(summary || '')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  const isSummaryLoading = (transcriptionStatus === 'transcribing' || transcriptionStatus === 'generating') && summaryText.length === 0

  React.useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
  }, [isSummaryLoading, summaryText])

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text isBold style={styles.title}>{title}</Text>
        {onPressEdit ? (
          <Pressable onPress={onPressEdit} style={({ hovered }) => [styles.editButton, hovered ? styles.editButtonHover : undefined]}>
            <InputEditIcon size={18} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.bodyContainer}>
        {isSummaryLoading ? (
          <View style={styles.loadingState}>
            <LoadingSpinner size="small" />
            <Text style={styles.emptyText}>Samenvatting wordt gegenereerd...</Text>
          </View>
        ) : summaryText.length === 0 ? (
          <Text style={styles.emptyText}>{emptyText || 'Er is nog geen samenvatting beschikbaar voor deze sessie.'}</Text>
        ) : (
          <Text style={styles.summaryText}>{summaryText}</Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: borderWidths.hairline,
    borderColor: semanticColorTokens.light.border,
    backgroundColor: semanticColorTokens.light.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...rnShadows.card,
  },
  title: {
    color: semanticColorTokens.light.textStrong,
    fontSize: fontSizes.lg,
    lineHeight: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semanticColorTokens.light.hoverAccent,
  },
  editButtonHover: {
    backgroundColor: semanticColorTokens.light.badgeBackground,
  },
  bodyContainer: {
    minHeight: summaryBodyMinHeight,
    justifyContent: 'flex-start',
  },
  summaryText: {
    color: semanticColorTokens.light.text,
    fontSize: fontSizes.sm,
    lineHeight: 22,
  },
  emptyText: {
    color: semanticColorTokens.light.textSecondary,
    fontSize: fontSizes.sm,
    lineHeight: 21,
  },
  loadingState: {
    minHeight: summaryBodyMinHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
  },
})
