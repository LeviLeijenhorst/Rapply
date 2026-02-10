import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { Text } from '../Text'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import { useLocalAppData } from '../../local/LocalAppDataProvider'
import { TrashIcon } from '../icons/TrashIcon'
import { EditActionIcon } from '../icons/EditActionIcon'
import { ConfirmNoteDeleteModal } from '../notes/ConfirmNoteDeleteModal'

type Props = {
  sessionId?: string
  dateTimeLabel: string
  coacheeIdForNewNotes?: string
  shouldFillAvailableHeight?: boolean
  contentHorizontalPadding?: number
}

export function NotesTabPanel({
  sessionId,
  dateTimeLabel,
  coacheeIdForNewNotes,
  shouldFillAvailableHeight = true,
  contentHorizontalPadding = 0,
}: Props) {
  const { data, createNote, createSession, deleteNote, updateNote } = useLocalAppData()
  const [isCreating, setIsCreating] = useState(false)
  const [draftText, setDraftText] = useState('')
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [notePendingDeleteId, setNotePendingDeleteId] = useState<string | null>(null)
  const noteInputRef = useRef<TextInput | null>(null)
  const editingInputRef = useRef<TextInput | null>(null)

  const activeSessionId = sessionId ?? createdSessionId ?? null

  const notes = useMemo(() => {
    if (!activeSessionId) return []
    return data.notes
      .filter((note) => note.sessionId === activeSessionId)
      .sort((a, b) => b.updatedAtUnixMs - a.updatedAtUnixMs)
  }, [activeSessionId, data.notes])

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const scrollContentStyle = useMemo(() => [styles.scrollContent, { paddingHorizontal: contentHorizontalPadding }], [contentHorizontalPadding])
  const notePendingDeleteText = notePendingDeleteId ? notes.find((note) => note.id === notePendingDeleteId)?.text ?? null : null

  const saveEditingNote = () => {
    const trimmed = editingText.trim()
    if (!trimmed || !editingNoteId) return
    updateNote(editingNoteId, trimmed)
    setEditingNoteId(null)
    setEditingText('')
  }

  const saveNewNote = () => {
    const trimmed = draftText.trim()
    if (!trimmed) return
    let targetSessionId = activeSessionId
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
    createNote(targetSessionId, trimmed)
    setIsCreating(false)
    setDraftText('')
  }

  const handleControlEnter = (event: any, onSave: () => void) => {
    const key = event?.nativeEvent?.key
    const isControlPressed = Boolean(event?.nativeEvent?.ctrlKey)
    if (key !== 'Enter' || !isControlPressed) return
    event?.preventDefault?.()
    onSave()
  }

  useEffect(() => {
    if (!isCreating) {
      return
    }
    const id = setTimeout(() => noteInputRef.current?.focus(), 120)
    return () => clearTimeout(id)
  }, [isCreating])

  useEffect(() => {
    if (!editingNoteId) return
    const note = notes.find((n) => n.id === editingNoteId)
    if (note) {
      setEditingText(note.text)
    }
    const id = setTimeout(() => editingInputRef.current?.focus(), 120)
    return () => clearTimeout(id)
  }, [editingNoteId, notes])

  return (
    <View style={[styles.container, shouldFillAvailableHeight ? styles.containerFill : styles.containerAuto]}>
      {/* Notes tab content */}
      <ScrollView
        style={[styles.scroll, shouldFillAvailableHeight ? styles.scrollFill : styles.scrollAuto]}
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
      >
        {notes.length > 0 && dateTimeLabel ? <Text style={styles.dateLabel}>{dateTimeLabel}</Text> : null}

        <View style={styles.notesList}>
          {notes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              {editingNoteId === note.id ? (
                <View style={styles.editBox}>
                  <View style={styles.inputContainer}>
                    <TextInput
                      ref={(value) => {
                        editingInputRef.current = value
                      }}
                      value={editingText}
                      onChangeText={setEditingText}
                      onKeyDown={(event) => handleControlEnter(event, saveEditingNote)}
                      placeholder="Schrijf een notitie..."
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      textAlignVertical="top"
                      style={[styles.input, inputWebStyle]}
                    />
                  </View>
                  <View style={styles.editActions}>
                    <Pressable
                      onPress={() => {
                        setEditingNoteId(null)
                        setEditingText('')
                      }}
                      style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}
                    >
                      <Text isBold style={styles.secondaryButtonText}>
                        Annuleren
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        saveEditingNote()
                      }}
                      style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined, editingText.trim().length === 0 ? styles.primaryButtonDisabled : undefined]}
                    >
                      <Text isBold style={styles.primaryButtonText}>
                        Opslaan
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.noteRow}>
                  <Text style={styles.noteText}>{note.text}</Text>
                  <View style={styles.noteActions}>
                    <Pressable
                      onPress={() => {
                        setEditingNoteId(note.id)
                      }}
                      style={({ hovered }) => [styles.noteActionButton, hovered ? styles.noteActionButtonHovered : undefined]}
                    >
                      <EditActionIcon color={colors.textSecondary} size={16} />
                    </Pressable>
                    <Pressable
                      onPress={() => setNotePendingDeleteId(note.id)}
                      style={({ hovered }) => [styles.noteActionButton, hovered ? styles.noteActionButtonHovered : undefined]}
                    >
                      <TrashIcon color={colors.selected} size={16} />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

        {notes.length > 0 ? <View style={styles.divider} /> : null}

        {isCreating ? (
          <View style={styles.createBox}>
            {/* New note input */}
            <View style={styles.inputContainer}>
              <TextInput
                ref={(value) => {
                  noteInputRef.current = value
                }}
                value={draftText}
                onChangeText={setDraftText}
                onKeyDown={(event) => handleControlEnter(event, saveNewNote)}
                placeholder="Schrijf een notitie..."
                placeholderTextColor={colors.textSecondary}
                multiline
                textAlignVertical="top"
                style={[styles.input, inputWebStyle]}
              />
            </View>
            <View style={styles.editActions}>
              <Pressable
                onPress={() => {
                  setIsCreating(false)
                  setDraftText('')
                }}
                style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}
              >
                {/* Cancel */}
                <Text isBold style={styles.secondaryButtonText}>
                  Annuleren
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  saveNewNote()
                }}
                disabled={draftText.trim().length === 0}
                style={({ hovered }) => [
                  styles.primaryButton,
                  hovered ? styles.primaryButtonHovered : undefined,
                  draftText.trim().length === 0 ? styles.primaryButtonDisabled : undefined,
                ]}
              >
                {/* Save */}
                <Text isBold style={styles.primaryButtonText}>
                  Opslaan
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              if (!activeSessionId && !coacheeIdForNewNotes) return
              setIsCreating(true)
            }}
            style={({ hovered }) => [styles.newRow, hovered ? styles.newRowHovered : undefined]}
          >
            {/* New note */}
            <Text style={styles.plus}>+</Text>
            <Text style={styles.newText}>Nieuwe notitie</Text>
          </Pressable>
        )}
      </ScrollView>

      <ConfirmNoteDeleteModal
        visible={Boolean(notePendingDeleteId)}
        noteText={notePendingDeleteText}
        onClose={() => setNotePendingDeleteId(null)}
        onConfirm={() => {
          if (!notePendingDeleteId) return
          deleteNote(notePendingDeleteId)
          setNotePendingDeleteId(null)
        }}
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
  scroll: {
  },
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
  noteCard: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.pageBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    ...( { whiteSpace: 'pre-wrap' } as any ),
    flex: 1,
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteActionButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteActionButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  editBox: {
    width: '100%',
    gap: 12,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
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
  createBox: {
    width: '100%',
    gap: 12,
  },
  inputContainer: {
    width: '100%',
    minHeight: 120,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    justifyContent: 'flex-start',
  },
  input: {
    padding: 0,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.fontFamilyMedium,
    color: colors.text,
    flex: 1,
  },
  secondaryButton: {
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  secondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  primaryButton: {
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: colors.selected,
    borderWidth: 1,
    borderColor: colors.selected,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})

