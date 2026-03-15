import React from 'react'
import { LayoutAnimation, Platform, Pressable, StyleSheet, UIManager, View } from 'react-native'

import { semanticColorTokens } from '@/design/tokens/colors'
import { borderWidths } from '@/design/tokens/borderWidths'
import { fontSizes } from '@/design/tokens/fontSizes'
import { radius } from '@/design/tokens/radius'
import { spacing } from '@/design/tokens/spacing'
import { EditActionIcon } from '@/icons/EditActionIcon'
import { TrashIcon } from '@/icons/TrashIcon'
import type { NotesTabProps } from '@/screens/session/sessionScreen.types'
import { Text } from '@/ui/Text'

if (Platform.OS === 'android' && (UIManager as any).setLayoutAnimationEnabledExperimental) {
  ;(UIManager as any).setLayoutAnimationEnabledExperimental(true)
}

function formatTimeLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

export function NotesTab({ notes, onEditNote, onDeleteNote }: NotesTabProps) {
  React.useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
  }, [notes.length])

  if (notes.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>Nog geen notities in deze sessie.</Text>
      </View>
    )
  }

  return (
    <View style={styles.list}>
      {notes.map((note) => (
        <View key={note.id} style={styles.noteCard}>
          {/* Note header with timestamp and actions */}
          <View style={styles.noteTopRow}>
            <View style={styles.timeChip}>
              <Text isSemibold style={styles.timeText}>{formatTimeLabel(note.createdAtUnixMs)}</Text>
            </View>
            <View style={styles.noteActions}>
              <Pressable onPress={() => onEditNote(note)} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHover : undefined]}>
                <EditActionIcon size={16} color={semanticColorTokens.light.textSecondary} />
              </Pressable>
              <Pressable onPress={() => onDeleteNote(note)} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHover : undefined]}>
                <TrashIcon size={16} color={semanticColorTokens.light.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Note body */}
          <Text style={styles.noteText}>{note.text}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  emptyWrap: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  emptyText: {
    color: semanticColorTokens.light.textMuted,
    fontSize: fontSizes.sm,
    lineHeight: 21,
  },
  list: {
    gap: spacing.sm,
  },
  noteCard: {
    borderRadius: radius.sm,
    borderWidth: borderWidths.hairline,
    borderColor: semanticColorTokens.light.panelBorder,
    backgroundColor: semanticColorTokens.light.neutralSurface,
    padding: spacing.md,
    gap: spacing.xs + 2,
  },
  noteTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs + 2,
  },
  timeChip: {
    alignSelf: 'flex-start',
    borderRadius: spacing.xxs,
    backgroundColor: semanticColorTokens.light.actionBlueBackground,
    minHeight: spacing.lg,
    paddingHorizontal: spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    color: semanticColorTokens.light.actionBlue,
    fontSize: fontSizes.md,
    lineHeight: 20,
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonHover: {
    backgroundColor: semanticColorTokens.light.hoverNeutral,
  },
  noteText: {
    color: semanticColorTokens.light.textHeading,
    fontSize: fontSizes.sm,
    lineHeight: 22,
  },
})
