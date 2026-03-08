import React from 'react'
import { StyleSheet, View } from 'react-native'

import { fontSizes, radius, spacing } from '../../../design/tokens'
import type { Note } from '../../../storage/types'
import { Text } from '../../../ui/Text'

type Props = {
  notes: Note[]
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

export function NotesPanel({ notes }: Props) {
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
          <View style={styles.timeChip}>
            <Text isSemibold style={styles.timeText}>{formatTime(note.createdAtUnixMs)}</Text>
          </View>
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
    fontSize: fontSizes.sm,
    lineHeight: 21,
    color: '#93858D',
  },
  list: {
    gap: spacing.sm,
  },
  noteCard: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#F9FAFB',
    minHeight: 160,
    padding: spacing.md,
    gap: spacing.xs,
  },
  timeChip: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    backgroundColor: '#EDF6FF',
    minHeight: 24,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: fontSizes.md,
    lineHeight: 24,
    color: '#0065F4',
  },
  noteText: {
    fontSize: fontSizes.md,
    lineHeight: 24,
    color: '#2C111F',
  },
})
