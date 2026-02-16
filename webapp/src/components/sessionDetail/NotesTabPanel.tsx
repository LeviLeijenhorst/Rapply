import React, { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { Text } from '../Text'
import { colors } from '../../theme/colors'
import { useLocalAppData } from '../../local/LocalAppDataProvider'
import { NoteEditModal } from '../notes/NoteEditModal'

type Props = {
  sessionId?: string
  coacheeIdForNewNotes?: string
  shouldFillAvailableHeight?: boolean
  contentHorizontalPadding?: number
}

export function NotesTabPanel({
  sessionId,
  coacheeIdForNewNotes,
  shouldFillAvailableHeight = true,
  contentHorizontalPadding = 0,
}: Props) {
  const { data, createNote, createSession, deleteNote, updateNote } = useLocalAppData()
  const [isCreating, setIsCreating] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null)

  const activeSessionId = sessionId ?? createdSessionId ?? null

  const notes = useMemo(() => {
    if (!activeSessionId) return []
    return data.notes
      .filter((note) => note.sessionId === activeSessionId)
      .sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs)
  }, [activeSessionId, data.notes])

  const notesByCreatedLabel = useMemo(() => {
    const grouped = new Map<string, typeof notes>()
    notes.forEach((note) => {
      const label = new Date(note.createdAtUnixMs).toLocaleString('nl-NL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      const current = grouped.get(label) ?? []
      current.push(note)
      grouped.set(label, current)
    })
    return Array.from(grouped.entries()).map(([label, notesInGroup]) => ({ label, notes: notesInGroup }))
  }, [notes])

  const scrollContentStyle = useMemo(() => [styles.scrollContent, { paddingHorizontal: contentHorizontalPadding }], [contentHorizontalPadding])

  const editingNote = editingNoteId ? notes.find((n) => n.id === editingNoteId) : null
  const effectiveSessionId = activeSessionId

  const saveNewNote = (values: { title: string; text: string }) => {
    let targetSessionId = effectiveSessionId
    if (!targetSessionId && coacheeIdForNewNotes) {
      const createdId = createSession({
        coacheeId: coacheeIdForNewNotes,
        title: 'Notities',
        kind: 'notes',
        audioBlobId: null,
        audioDurationSeconds: null,
        uploadFileName: null,
      })
      if (!createdId) return
      setCreatedSessionId(createdId)
      targetSessionId = createdId
    }
    if (!targetSessionId) return
    createNote(targetSessionId, values)
    setIsCreating(false)
  }

  const saveEditingNote = (values: { title: string; text: string }) => {
    if (!editingNoteId) return
    updateNote(editingNoteId, values)
    setEditingNoteId(null)
  }

  return (
    <View style={[styles.container, shouldFillAvailableHeight ? styles.containerFill : styles.containerAuto]}>
      <ScrollView
        style={[styles.scroll, shouldFillAvailableHeight ? styles.scrollFill : styles.scrollAuto]}
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.notesList}>
          {notesByCreatedLabel.map((group) => (
            <View key={group.label} style={styles.noteGroup}>
              <Text style={styles.dateLabel}>{group.label}</Text>
              {group.notes.map((note) => (
                <Pressable
                  key={note.id}
                  onPress={() => setEditingNoteId(note.id)}
                  style={({ hovered }) => [styles.noteCard, hovered ? styles.noteCardHovered : undefined]}
                >
                  <View style={[styles.noteRow, !note.text.includes('\n') ? styles.noteRowSingleLine : undefined]}>
                    <View style={styles.noteContent}>
                      {note.title ? (
                        <Text isBold style={styles.noteTitle}>
                          {note.title}
                        </Text>
                      ) : null}
                      <Text style={styles.noteText} numberOfLines={note.title ? 2 : 4}>
                        {note.text}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        {notes.length > 0 ? <View style={styles.divider} /> : null}

        {!isCreating ? (
          <Pressable
            onPress={() => {
              if (!effectiveSessionId && !coacheeIdForNewNotes) return
              setIsCreating(true)
            }}
            style={({ hovered }) => [styles.newRow, hovered ? styles.newRowHovered : undefined]}
          >
            <Text style={styles.plus}>+</Text>
            <Text style={styles.newText}>Nieuwe notitie</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <NoteEditModal
        visible={isCreating}
        mode="create"
        initialTitle=""
        initialBody=""
        onClose={() => setIsCreating(false)}
        onSave={saveNewNote}
      />

      <NoteEditModal
        visible={Boolean(editingNote)}
        mode="edit"
        initialTitle={editingNote?.title ?? ''}
        initialBody={editingNote?.text ?? ''}
        onClose={() => setEditingNoteId(null)}
        onSave={saveEditingNote}
        onDelete={editingNoteId ? () => deleteNote(editingNoteId) : undefined}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  containerFill: {
    flex: 1,
  },
  containerAuto: {
    flexGrow: 0,
  },
  scroll: {},
  scrollFill: {
    flex: 1,
  },
  scrollAuto: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 8,
  },
  dateLabel: {
    fontSize: 12,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  notesList: {
    gap: 12,
  },
  noteGroup: {
    gap: 10,
  },
  noteCard: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteCardHovered: {
    backgroundColor: colors.hoverBackground,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteRowSingleLine: {
    alignItems: 'center',
  },
  noteContent: {
    flex: 1,
    gap: 4,
  },
  noteTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    ...({ whiteSpace: 'pre-wrap' } as any),
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  newRow: {
    height: 40,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  newRowHovered: {
    backgroundColor: colors.hoverBackground,
  },
  plus: {
    fontSize: 18,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  newText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
})
