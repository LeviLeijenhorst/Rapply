import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { Modal } from '../../../ui/animated/Modal'
import { colors } from '../../../design/theme/colors'
import { Text } from '../../../ui/Text'
import { ModalCloseDarkIcon } from '../../../icons/ModalCloseDarkIcon'

type Props = {
  visible: boolean
  message: string
  onClose: () => void
}

export function DeleteAccountErrorModal({ visible, message, onClose }: Props) {
  if (!visible) return null

  return (
    <Modal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text isBold style={styles.headerTitle}>
          Verwijderen mislukt
        </Text>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
          <ModalCloseDarkIcon />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.descriptionText}>{message}</Text>
      </View>

      <View style={styles.footer}>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.footerPrimaryButton, hovered ? styles.footerPrimaryButtonHovered : undefined]}>
          <Text isBold style={styles.footerPrimaryButtonText}>
            Sluiten
          </Text>
        </Pressable>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 640,
    maxWidth: '90vw',
    backgroundColor: colors.surface,
    borderRadius: 16,
    ...( { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } as any ),
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
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerPrimaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerPrimaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  footerPrimaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
})

