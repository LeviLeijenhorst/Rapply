import React, { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import { Text } from '../Text'
import { ModalCloseDarkIcon } from '../icons/ModalCloseDarkIcon'
import { TrashIcon } from '../icons/TrashIcon'
import { ConfirmNoteDeleteModal } from './ConfirmNoteDeleteModal'
import { ConfirmNoteCloseModal } from './ConfirmNoteCloseModal'
import { radius } from '../../foundation/theme/tokens'

type Props = {
  visible: boolean
  mode: 'create' | 'edit'
  initialTitle?: string
  initialBody?: string
  onClose: () => void
  onSave: (values: { title: string; text: string }) => void
  onDelete?: () => void
}

const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

export function NoteEditModal({
  visible,
  mode,
  initialTitle = '',
  initialBody = '',
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const titleRef = useRef<TextInput | null>(null)
  const bodyRef = useRef<TextInput | null>(null)

  useEffect(() => {
    if (!visible) return
    setTitle(initialTitle)
    setBody(initialBody)
    setShowDeleteConfirm(false)
    setShowCloseConfirm(false)
  }, [visible, initialTitle, initialBody])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => titleRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [visible])

  const handleSave = () => {
    const trimmedBody = body.trim()
    if (!trimmedBody) return
    onSave({ title: title.trim(), text: trimmedBody })
    onClose()
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const handleRequestClose = () => {
    setShowCloseConfirm(true)
  }

  const handleConfirmClose = () => {
    setShowCloseConfirm(false)
    onClose()
  }

  const handleConfirmDelete = () => {
    onDelete?.()
    setShowDeleteConfirm(false)
    onClose()
  }

  const handleControlEnter = (event: any) => {
    const key = event?.nativeEvent?.key
    const isControlPressed = Boolean(event?.nativeEvent?.ctrlKey)
    if (key !== 'Enter' || !isControlPressed) return
    event?.preventDefault?.()
    handleSave()
  }

  if (!visible) return null

  const canSave = body.trim().length > 0
  const isEdit = mode === 'edit'

  return (
    <>
      <AnimatedOverlayModal visible={visible} onClose={handleRequestClose} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text isBold style={styles.title}>
            {isEdit ? 'Notitie bewerken' : 'Nieuwe notitie'}
          </Text>
          <Pressable onPress={handleRequestClose} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
            <ModalCloseDarkIcon size={34} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Titel</Text>
            <TextInput
              ref={titleRef}
              value={title}
              onChangeText={setTitle}
              placeholder="Optionele titel..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.titleInput, inputWebStyle]}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Notitie</Text>
            <TextInput
              ref={bodyRef}
              value={body}
              onChangeText={setBody}
              {...({ onKeyDown: handleControlEnter } as any)}
              placeholder="Schrijf je notitie..."
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
              style={[styles.bodyInput, inputWebStyle]}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {isEdit && onDelete ? (
              <Pressable
                onPress={handleDelete}
                style={({ hovered }) => [styles.deleteButton, hovered ? styles.deleteButtonHovered : undefined]}
              >
                <TrashIcon color={colors.selected} size={16} />
                <Text isBold style={styles.deleteButtonText}>
                  Verwijderen
                </Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.footerRight}>
            <Pressable onPress={handleRequestClose} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}>
              <Text isBold style={styles.secondaryButtonText}>
                Annuleren
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              style={({ hovered }) => [
                styles.primaryButton,
                hovered ? styles.primaryButtonHovered : undefined,
                !canSave ? styles.primaryButtonDisabled : undefined,
              ]}
            >
              <Text isBold style={styles.primaryButtonText}>
                Opslaan
              </Text>
            </Pressable>
          </View>
        </View>
      </AnimatedOverlayModal>

      <ConfirmNoteDeleteModal
        visible={showDeleteConfirm}
        noteText={title.trim() || undefined}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
      />
      <ConfirmNoteCloseModal
        visible={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={handleConfirmClose}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 980,
    maxWidth: '96%',
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...({ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } as any),
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textStrong,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  body: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 16,
    ...( { flex: 1, minHeight: 360 } as any ),
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  titleInput: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.fontFamilyMedium,
    color: colors.text,
  },
  bodyInput: {
    padding: 12,
    minHeight: 240,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.fontFamilyMedium,
    color: colors.text,
  },
  footer: {
    width: '100%',
    padding: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 0,
    height: 48,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerLeft: {
    marginRight: 'auto',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 0,
  },
  deleteButton: {
    height: 48,
    borderRadius: 0,
    borderBottomLeftRadius: radius.lg,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 0,
    minWidth: 140,
    marginRight: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonHovered: {
    backgroundColor: 'rgba(190,1,101,0.08)',
  },
  deleteButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.selected,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 0,
    backgroundColor: colors.surface,
    borderWidth: 0,
    borderColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 0,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  secondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  primaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomRightRadius: radius.lg,
    backgroundColor: colors.selected,
    paddingHorizontal: 24,
    paddingVertical: 0,
    minWidth: 140,
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
