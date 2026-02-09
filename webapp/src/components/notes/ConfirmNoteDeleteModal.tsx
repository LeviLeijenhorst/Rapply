import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { colors } from '../../theme/colors'
import { Text } from '../Text'
import { ModalCloseDarkIcon } from '../icons/ModalCloseDarkIcon'

type Props = {
  visible: boolean
  noteText?: string | null
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmNoteDeleteModal({ visible, noteText, onClose, onConfirm }: Props) {
  if (!visible) return null

  const description = noteText
    ? `Weet je zeker dat je deze notitie wilt verwijderen: "${noteText}"? Dit kan niet ongedaan worden gemaakt.`
    : 'Weet je zeker dat je deze notitie wilt verwijderen? Dit kan niet ongedaan worden gemaakt.'

  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      {/* Modal header */}
      <View style={styles.header}>
        {/* Header title */}
        <Text isBold style={styles.headerTitle}>
          Notitie verwijderen
        </Text>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
          {/* Close */}
          <ModalCloseDarkIcon />
        </Pressable>
      </View>

      {/* Modal body */}
      <View style={styles.body}>
        {/* Description */}
        <Text style={styles.descriptionText}>{description}</Text>
      </View>

      {/* Modal footer */}
      <View style={styles.footer}>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.footerSecondaryButton, hovered ? styles.footerSecondaryButtonHovered : undefined]}>
          {/* Cancel */}
          <Text isBold style={styles.footerSecondaryButtonText}>
            Annuleren
          </Text>
        </Pressable>
        <Pressable onPress={onConfirm} style={({ hovered }) => [styles.footerDangerButton, hovered ? styles.footerDangerButtonHovered : undefined]}>
          {/* Delete */}
          <Text isBold style={styles.footerDangerButtonText}>
            Verwijderen
          </Text>
        </Pressable>
      </View>
    </AnimatedOverlayModal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 640,
    maxWidth: '90vw',
    backgroundColor: colors.surface,
    borderRadius: 16,
    ...( { boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } as any ),
    overflow: 'hidden',
  },
  header: {
    width: '100%',
    height: 72,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
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
    width: '100%',
    padding: 24,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textStrong,
  },
  footer: {
    width: '100%',
    padding: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerSecondaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomLeftRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 0,
    borderColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 0,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSecondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  footerSecondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  footerDangerButton: {
    height: 48,
    borderRadius: 0,
    borderBottomRightRadius: 16,
    backgroundColor: colors.selected,
    paddingHorizontal: 24,
    paddingVertical: 0,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerDangerButtonHovered: {
    backgroundColor: '#A50058',
  },
  footerDangerButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})
