import React, { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { semanticColorTokens, brandColors } from '@/design/tokens/colors'
import { borderWidths } from '@/design/tokens/borderWidths'
import { fontSizes } from '@/design/tokens/fontSizes'
import { radius } from '@/design/tokens/radius'
import { rnShadows } from '@/design/tokens/shadows'
import { spacing } from '@/design/tokens/spacing'
import { SessionThumbsDownIcon, SessionThumbsUpIcon } from '@/icons/SessionPageIcons'
import { TrashIcon } from '@/icons/TrashIcon'
import type { SnippetSectionProps } from '@/screens/session/sessionScreen.types'
import type { SnippetStatus } from '@/storage/types'
import { Text } from '@/ui/Text'

function resolveSnippetBorderColor(status: SnippetStatus): string {
  if (status === 'rejected') return semanticColorTokens.light.danger
  if (status === 'approved') return semanticColorTokens.light.success
  return semanticColorTokens.light.panelBorder
}

export function SnippetSection({
  snippets,
  canRegenerate = false,
  isRegenerating = false,
  onRegenerate,
  onUpdateSnippetStatus,
  onDeleteSnippet,
}: SnippetSectionProps) {
  const sortedSnippets = useMemo(
    () => [...snippets].sort((leftSnippet, rightSnippet) => leftSnippet.createdAtUnixMs - rightSnippet.createdAtUnixMs),
    [snippets],
  )

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.headerRow}>
        <Text isSemibold style={styles.heading}>Snippets goedkeuren</Text>
        {sortedSnippets.length > 0 ? (
          <Pressable
            onPress={() => {
              sortedSnippets.forEach((snippet) => {
                if (snippet.status !== 'approved') onUpdateSnippetStatus(snippet.id, 'approved')
              })
            }}
            style={({ hovered }) => [styles.approveAllButton, hovered ? styles.approveAllButtonHover : undefined]}
          >
            <Text style={styles.approveAllText}>Alles goedkeuren</Text>
          </Pressable>
        ) : null}
      </View>

      {sortedSnippets.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nog geen snippets in deze sessie.</Text>
          {canRegenerate ? (
            <Pressable
              disabled={isRegenerating}
              onPress={onRegenerate}
              style={({ hovered }) => [
                styles.regenerateButton,
                hovered && !isRegenerating ? styles.approveAllButtonHover : undefined,
                isRegenerating ? styles.disabledButton : undefined,
              ]}
            >
              <Text style={styles.approveAllText}>
                {isRegenerating ? 'Snippets genereren...' : 'Snippets genereren'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.list}>
          {sortedSnippets.map((snippet) => (
            <View key={snippet.id} style={[styles.snippetCard, { borderColor: resolveSnippetBorderColor(snippet.status) }]}>
              <View style={styles.topRow}>
                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={() => onUpdateSnippetStatus(snippet.id, 'approved')}
                    style={({ hovered }) => [
                      styles.iconButton,
                      snippet.status === 'approved' ? styles.iconApprove : styles.iconNeutral,
                      hovered ? styles.iconHover : undefined,
                    ]}
                  >
                    <SessionThumbsUpIcon size={18} />
                  </Pressable>
                  <Pressable
                    onPress={() => onUpdateSnippetStatus(snippet.id, 'rejected')}
                    style={({ hovered }) => [
                      styles.iconButton,
                      snippet.status === 'rejected' ? styles.iconReject : styles.iconNeutral,
                      hovered ? styles.iconHover : undefined,
                    ]}
                  >
                    <SessionThumbsDownIcon size={18} />
                  </Pressable>
                  <Pressable
                    onPress={() => onDeleteSnippet(snippet.id)}
                    style={({ hovered }) => [styles.iconButton, styles.iconNeutral, hovered ? styles.iconHover : undefined]}
                  >
                    <TrashIcon size={16} color={semanticColorTokens.light.textSecondary} />
                  </Pressable>
                </View>
              </View>
              <Text style={styles.snippetText}>{snippet.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: fontSizes.lg,
    lineHeight: 24,
    color: semanticColorTokens.light.textHeading,
  },
  approveAllButton: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  approveAllButtonHover: {
    backgroundColor: semanticColorTokens.light.hoverAccent,
  },
  approveAllText: {
    fontSize: fontSizes.md,
    lineHeight: 20,
    color: brandColors.primary,
  },
  emptyCard: {
    borderRadius: radius.md,
    borderWidth: borderWidths.hairline,
    borderColor: semanticColorTokens.light.panelBorder,
    backgroundColor: semanticColorTokens.light.elevatedSurface,
    padding: spacing.md,
    gap: spacing.xs,
  },
  emptyText: {
    color: semanticColorTokens.light.textMuted,
    fontSize: fontSizes.sm,
    lineHeight: 21,
  },
  regenerateButton: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  disabledButton: {
    opacity: 0.55,
  },
  list: {
    gap: spacing.sm,
  },
  snippetCard: {
    borderRadius: radius.md,
    borderWidth: borderWidths.hairline,
    backgroundColor: semanticColorTokens.light.elevatedSurface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xs + 2,
    ...rnShadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs + 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconNeutral: {
    backgroundColor: semanticColorTokens.light.neutralSurface,
  },
  iconApprove: {
    backgroundColor: semanticColorTokens.light.successBackground,
  },
  iconReject: {
    backgroundColor: semanticColorTokens.light.dangerBackground,
  },
  iconHover: {
    opacity: 0.88,
  },
  snippetText: {
    color: semanticColorTokens.light.textBody,
    fontSize: fontSizes.sm,
    lineHeight: 22,
  },
})
