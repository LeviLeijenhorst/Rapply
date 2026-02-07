import React, { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { Text } from '../Text'
import { colors } from '../../theme/colors'
import { ModalCloseDarkIcon } from '../icons/ModalCloseDarkIcon'

type Props = {
  visible: boolean
  text: string
  onClose: () => void
}

export function PrivacyPolicyModal({ visible, text, onClose }: Props) {
  const cleanedText = useMemo(() => String(text || '').replace(/\r/g, '').trim(), [text])

  if (!visible) return null

  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      {/* Modal header */}
      <View style={styles.header}>
        {/* Header title */}
        <Text isBold style={styles.headerTitle}>
          Privacy beleid
        </Text>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
          {/* Close */}
          <ModalCloseDarkIcon />
        </Pressable>
      </View>

      {/* Modal body */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {/* Privacy text */}
        <Text style={styles.privacyText}>{cleanedText}</Text>
      </ScrollView>
    </AnimatedOverlayModal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 860,
    maxWidth: '90vw',
    maxHeight: '85vh',
    backgroundColor: colors.surface,
    borderRadius: 16,
    ...( { boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' } as any ),
  },
  header: {
    width: '100%',
    height: 72,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  },
  bodyContent: {
    padding: 24,
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textStrong,
  },
})

