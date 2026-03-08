import React, { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../../../design/theme/colors'
import { fontSizes, radius, spacing } from '../../../design/tokens'
import type { Snippet, SnippetStatus } from '../../../storage/types'
import { Text } from '../../../ui/Text'
import { SessionThumbsDownIcon, SessionThumbsUpIcon } from './SessionIcons'

type Props = {
  snippets: Snippet[]
  onUpdateSnippetStatus: (snippetId: string, status: SnippetStatus) => void
}

type SnippetTone = {
  label: string
  chipBackground: string
  chipText: string
}

function getSnippetTone(field: string): SnippetTone {
  const normalized = String(field || '').toLowerCase()
  if (normalized.includes('actie')) {
    return { label: 'Actiepunt', chipBackground: '#EDF6FF', chipText: '#0065F4' }
  }
  if (normalized.includes('belemmer')) {
    return { label: 'Belemmering', chipBackground: '#FEF3C7', chipText: '#B45309' }
  }
  return { label: 'Voortgang', chipBackground: '#D4FDE5', chipText: '#008234' }
}

function getBorderColor(status: SnippetStatus): string {
  if (status === 'rejected') return '#EA1818'
  return '#008234'
}

export function SnippetApprovalSection({ snippets, onUpdateSnippetStatus }: Props) {
  const sortedSnippets = useMemo(() => [...snippets].sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs), [snippets])

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text isSemibold style={styles.heading}>Snippets goedkeuren</Text>
        {sortedSnippets.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              sortedSnippets.forEach((snippet) => {
                if (snippet.status !== 'approved') onUpdateSnippetStatus(snippet.id, 'approved')
              })
            }}
            style={({ hovered }) => [styles.approveAllButton, hovered ? styles.approveAllButtonHover : undefined]}
          >
            <SessionThumbsUpIcon size={18} />
            <Text style={styles.approveAllText}>Alles goedkeuren</Text>
          </Pressable>
        ) : null}
      </View>

      {sortedSnippets.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nog geen snippets in deze sessie.</Text>
        </View>
      ) : (
        <View style={styles.cardList}>
          {sortedSnippets.map((snippet) => {
            const tone = getSnippetTone(snippet.field)
            const borderColor = getBorderColor(snippet.status)

            return (
              <View key={snippet.id} style={[styles.snippetCard, { borderColor }]}>
                <View style={styles.snippetTopRow}>
                  <View style={[styles.chip, { backgroundColor: tone.chipBackground }]}>
                    <Text isSemibold style={[styles.chipText, { color: tone.chipText }]}>{tone.label}</Text>
                  </View>
                  <View style={styles.actionsRow}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onUpdateSnippetStatus(snippet.id, 'approved')}
                      style={({ hovered }) => [
                        styles.iconButton,
                        snippet.status === 'approved' ? styles.iconButtonApproveActive : styles.iconButtonNeutral,
                        hovered ? styles.iconButtonHover : undefined,
                      ]}
                    >
                      <SessionThumbsUpIcon size={18} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onUpdateSnippetStatus(snippet.id, 'rejected')}
                      style={({ hovered }) => [
                        styles.iconButton,
                        snippet.status === 'rejected' ? styles.iconButtonRejectActive : styles.iconButtonNeutral,
                        hovered ? styles.iconButtonHover : undefined,
                      ]}
                    >
                      <SessionThumbsDownIcon size={18} />
                    </Pressable>
                  </View>
                </View>
                <Text style={styles.snippetText}>{snippet.text}</Text>
              </View>
            )
          })}
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
    fontSize: fontSizes.md,
    lineHeight: 24,
    color: '#2C111F',
  },
  approveAllButton: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  approveAllButtonHover: {
    backgroundColor: '#F8EDF3',
  },
  approveAllText: {
    fontSize: fontSizes.md,
    lineHeight: 24,
    color: colors.selected,
  },
  emptyCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
  },
  emptyText: {
    fontSize: fontSizes.sm,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  cardList: {
    gap: spacing.sm,
  },
  snippetCard: {
    minHeight: 104,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  snippetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: fontSizes.xs,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonNeutral: {
    backgroundColor: '#F9FAFB',
  },
  iconButtonApproveActive: {
    backgroundColor: '#D4FDE5',
  },
  iconButtonRejectActive: {
    backgroundColor: '#FDDDDD',
  },
  iconButtonHover: {
    opacity: 0.88,
  },
  snippetText: {
    maxWidth: 623,
    fontSize: fontSizes.sm,
    lineHeight: 20,
    color: '#374151',
  },
})
