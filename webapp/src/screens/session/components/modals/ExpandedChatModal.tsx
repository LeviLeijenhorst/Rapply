import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { semanticColorTokens } from '@/design/tokens/colors'
import { borderWidths } from '@/design/tokens/borderWidths'
import { radius } from '@/design/tokens/radius'
import { rnShadows } from '@/design/tokens/shadows'
import { spacing } from '@/design/tokens/spacing'
import { FullScreenCloseIcon } from '@/icons/FullScreenCloseIcon'
import type { ExpandedChatModalProps } from '@/screens/session/sessionScreen.types'
import { Modal } from '@/ui/animated/Modal'

export function ExpandedChatModal({ visible, onClose, children }: ExpandedChatModalProps) {
  return (
    <Modal visible={visible} onClose={onClose} contentContainerStyle={styles.overlay}>
      <View style={styles.card}>
        {/* Modal close action */}
        <Pressable onPress={onClose} style={({ hovered }) => [styles.closeButton, hovered ? styles.closeButtonHover : undefined]}>
          <FullScreenCloseIcon size={18} color={semanticColorTokens.light.textHeading} />
        </Pressable>

        {/* Modal content */}
        {children}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    width: '100%',
    maxWidth: 1080,
  },
  card: {
    width: '100%',
    ...( { height: '82vh' } as any ),
    borderRadius: radius.md,
    borderWidth: borderWidths.hairline,
    borderColor: semanticColorTokens.light.panelBorder,
    backgroundColor: semanticColorTokens.light.elevatedSurface,
    padding: spacing.sm,
    ...rnShadows.card,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  closeButtonHover: {
    backgroundColor: semanticColorTokens.light.hoverSoft,
  },
})
