import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { brandColors } from '../../design/tokens/colors'
import { fontSizes } from '../../design/tokens/fontSizes'
import { radius } from '../../design/tokens/radius'
import { spacing } from '../../design/tokens/spacing'
import { colors } from '../../design/theme/colors'
import { ModalCloseDarkIcon } from '../../icons/ModalCloseDarkIcon'
import { Modal } from '../animated/Modal'
import { Text } from '../Text'

type Props = {
  visible: boolean
  title: string
  description: string
  onClose: () => void
  onConfirm: () => void
  confirmLabel?: string
  cancelLabel?: string
}

// Renders the shared confirmation/warning modal.
export function WarningModal({
  visible,
  title,
  description,
  onClose,
  onConfirm,
  confirmLabel = 'Verwijderen',
  cancelLabel = 'Annuleren',
}: Props) {
  if (!visible) return null

  return (
    <Modal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text isBold style={styles.headerTitle}>
          {title}
        </Text>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
          <ModalCloseDarkIcon />
        </Pressable>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.descriptionText}>{description}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.footerSecondaryButton, hovered ? styles.footerSecondaryButtonHovered : undefined]}>
          <Text isBold style={styles.footerSecondaryButtonText}>
            {cancelLabel}
          </Text>
        </Pressable>
        <Pressable onPress={onConfirm} style={({ hovered }) => [styles.footerDangerButton, hovered ? styles.footerDangerButtonHovered : undefined]}>
          <Text isBold style={styles.footerDangerButtonText}>
            {confirmLabel}
          </Text>
        </Pressable>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 640,
    maxWidth: '90%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    width: '100%',
    height: 72,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    lineHeight: 22,
    color: colors.textStrong,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  body: {
    width: '100%',
    padding: spacing.lg,
  },
  descriptionText: {
    fontSize: fontSizes.sm,
    lineHeight: 20,
    color: colors.textStrong,
  },
  footer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerSecondaryButton: {
    height: 48,
    borderBottomLeftRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSecondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  footerSecondaryButtonText: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
    color: colors.textStrong,
  },
  footerDangerButton: {
    height: 48,
    borderBottomRightRadius: radius.lg,
    backgroundColor: colors.selected,
    paddingHorizontal: spacing.lg,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerDangerButtonHovered: {
    backgroundColor: brandColors.primaryHover,
  },
  footerDangerButtonText: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
    color: brandColors.white,
  },
})
