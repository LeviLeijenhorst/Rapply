import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { AnimatedOverlayModal } from '../../../ui/AnimatedOverlayModal'
import { Text } from '../../../ui/Text'
import { colors } from '../../../design/theme/colors'

type Props = {
  visible: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmReportRegenerateModal({ visible, onClose, onConfirm }: Props) {
  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      <View style={styles.body}>
        <Text isBold style={styles.title}>
          Rapportage opnieuw genereren?
        </Text>
        <Text style={styles.message}>
          Handmatige wijzigingen in dit document worden overschreven.
        </Text>
      </View>
      <View style={styles.footer}>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}>
          <Text isBold style={styles.secondaryButtonText}>Annuleren</Text>
        </Pressable>
        <Pressable onPress={onConfirm} style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined]}>
          <Text isBold style={styles.primaryButtonText}>Opnieuw genereren</Text>
        </Pressable>
      </View>
    </AnimatedOverlayModal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 520,
  },
  body: {
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    color: colors.textStrong,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 0,
  },
  secondaryButton: {
    height: 48,
    minWidth: 150,
    borderRadius: 0,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    minWidth: 180,
    borderRadius: 0,
    borderBottomRightRadius: 16,
    backgroundColor: colors.selected,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  primaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})


