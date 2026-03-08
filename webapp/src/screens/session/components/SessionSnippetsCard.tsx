import React, { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../../../design/theme/colors'
import type { Snippet, SnippetStatus } from '../../../storage/types'
import { Text } from '../../../ui/Text'

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

export function SessionSnippetsCard({ snippets, onUpdateSnippetStatus }: Props) {
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
            <Text style={styles.approveAllText}>Alles goedkeuren</Text>
          </Pressable>
        ) : null}
      </View>

      {sortedSnippets.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Wanneer snippets beschikbaar zijn, kunt u ze hier beoordelen en goedkeuren.</Text>
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
                      <Text isBold style={[styles.iconGlyph, snippet.status === 'approved' ? styles.iconGlyphApprove : styles.iconGlyphNeutral]}>?</Text>
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
                      <Text isBold style={[styles.iconGlyph, snippet.status === 'rejected' ? styles.iconGlyphReject : styles.iconGlyphNeutral]}>?</Text>
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
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heading: {
    fontSize: 28,
    lineHeight: 32,
    color: colors.textStrong,
  },
  approveAllButton: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  approveAllButtonHover: {
    backgroundColor: '#F8EDF3',
  },
  approveAllText: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.selected,
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  cardList: {
    gap: 12,
  },
  snippetCard: {
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  snippetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  chip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  iconGlyph: {
    fontSize: 16,
    lineHeight: 20,
  },
  iconGlyphNeutral: {
    color: '#656565',
  },
  iconGlyphApprove: {
    color: '#008234',
  },
  iconGlyphReject: {
    color: '#EA1818',
  },
  snippetText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
})
