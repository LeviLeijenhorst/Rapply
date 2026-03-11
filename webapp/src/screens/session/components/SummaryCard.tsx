import React from 'react'
import { StyleSheet, View } from 'react-native'

import { semanticColorTokens } from '@/design/tokens/colors'
import { borderWidths } from '@/design/tokens/borderWidths'
import { fontSizes } from '@/design/tokens/fontSizes'
import { radius } from '@/design/tokens/radius'
import { rnShadows } from '@/design/tokens/shadows'
import { spacing } from '@/design/tokens/spacing'
import type { SummaryCardProps } from '@/screens/session/sessionScreen.types'
import { LoadingSpinner } from '@/ui/LoadingSpinner'
import { Text } from '@/ui/Text'

export function SummaryCard({ summary, transcriptionStatus }: SummaryCardProps) {
  const summaryText = String(summary || '').trim()
  const isSummaryLoading = transcriptionStatus === 'generating' && summaryText.length === 0

  return (
    <View style={styles.card}>
      {/* Card title */}
      <Text isSemibold style={styles.title}>Sessie Samenvatting</Text>

      {isSummaryLoading ? (
        <View style={styles.loadingState}>
          <LoadingSpinner size="small" />
          <Text style={styles.emptyText}>Samenvatting wordt gegenereerd...</Text>
        </View>
      ) : summaryText.length === 0 ? (
        <Text style={styles.emptyText}>Er is nog geen samenvatting beschikbaar voor deze sessie.</Text>
      ) : (
        <Text style={styles.summaryText}>{summaryText}</Text>
      )}
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
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
  },
})

