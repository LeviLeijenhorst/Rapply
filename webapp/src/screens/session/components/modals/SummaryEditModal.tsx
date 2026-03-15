import React, { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { semanticColorTokens } from '@/design/tokens/colors'
import { borderWidths } from '@/design/tokens/borderWidths'
import { fontSizes } from '@/design/tokens/fontSizes'
import { radius } from '@/design/tokens/radius'
import { spacing } from '@/design/tokens/spacing'
import { ModalCloseDarkIcon } from '@/icons/ModalCloseDarkIcon'
import { Text } from '@/ui/Text'
import { Modal } from '@/ui/animated/Modal'

type SummaryEditModalProps = {
  visible: boolean
  initialSummary: string
  onClose: () => void
  onSave: (summary: string) => void
}

const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

export function SummaryEditModal({ visible, initialSummary, onClose, onSave }: SummaryEditModalProps) {
  const [draft, setDraft] = useState('')
  const editorRef = useRef<TextInput | null>(null)

  useEffect(() => {
    if (!visible) return
    setDraft(String(initialSummary || ''))
  }, [initialSummary, visible])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => editorRef.current?.focus(), 120)
    return () => clearTimeout(timer)
  }, [visible])

  if (!visible) return null

  return (
    <Modal visible={visible} onClose={onClose} contentContainerStyle={styles.modalContainer}>
      <View style={styles.header}>
        <Text isBold style={styles.title}>Samenvatting bewerken</Text>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.closeButton, hovered ? styles.closeButtonHover : undefined]}>
          <ModalCloseDarkIcon size={34} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <TextInput
          ref={editorRef}
          value={draft}
          onChangeText={setDraft}
          placeholder="Schrijf of bewerk de samenvatting..."
          placeholderTextColor={semanticColorTokens.light.textMuted}
          multiline
          textAlignVertical="top"
          style={[styles.editorInput, inputWebStyle]}
        />
      </View>

      <View style={styles.footer}>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.cancelButton, hovered ? styles.cancelButtonHover : undefined]}>
          <Text isBold style={styles.cancelButtonText}>Annuleren</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            onSave(draft)
            onClose()
          }}
          style={({ hovered }) => [styles.saveButton, hovered ? styles.saveButtonHover : undefined]}
        >
          <Text isBold style={styles.saveButtonText}>Opslaan</Text>
        </Pressable>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    width: 980,
    maxWidth: '96%',
    maxHeight: '90%',
    backgroundColor: semanticColorTokens.light.surface,
    borderRadius: radius.lg,
    ...({ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } as any),
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: borderWidths.hairline,
    borderBottomColor: semanticColorTokens.light.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: fontSizes.lg,
    lineHeight: 22,
    color: semanticColorTokens.light.textStrong,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonHover: {
    backgroundColor: semanticColorTokens.light.hoverBackground,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...( { flex: 1, minHeight: 360 } as any ),
  },
  editorInput: {
    minHeight: 320,
    borderRadius: radius.md,
    borderWidth: borderWidths.hairline,
    borderColor: semanticColorTokens.light.border,
    backgroundColor: semanticColorTokens.light.pageBackground,
    padding: spacing.md,
    fontSize: fontSizes.md,
    lineHeight: 24,
    color: semanticColorTokens.light.textBody,
  },
  footer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: borderWidths.hairline,
    borderTopColor: semanticColorTokens.light.border,
  },
  cancelButton: {
    height: 48,
    backgroundColor: semanticColorTokens.light.surface,
    paddingHorizontal: spacing.lg,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonHover: {
    backgroundColor: semanticColorTokens.light.hoverBackground,
  },
  cancelButtonText: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
    color: semanticColorTokens.light.textStrong,
  },
  saveButton: {
    height: 48,
    borderBottomRightRadius: radius.lg,
    backgroundColor: semanticColorTokens.light.selected,
    paddingHorizontal: spacing.lg,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonHover: {
    backgroundColor: '#A50058',
  },
  saveButtonText: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})
