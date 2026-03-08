import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { AnimatedOverlayModal } from '../../ui/AnimatedOverlayModal'
import { ModalCloseDarkIcon } from '../../icons/ModalCloseDarkIcon'
import { Text } from '../../ui/Text'
import { colors } from '../../design/theme/colors'
import { CopyIcon } from '../../icons/CopyIcon'
import { CopiedIcon } from '../../icons/CopiedIcon'

const SHARE_URL = 'https://www.coachscribe.nl'

type Props = {
  visible: boolean
  onClose: () => void
}

export function ShareCoachscribeModal({ visible, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(SHARE_URL)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (error) {
      console.error('[ShareCoachscribeModal] Copy failed', error)
    }
  }

  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text isBold style={styles.title}>
          Deel Coachscribe
        </Text>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
          <ModalCloseDarkIcon size={34} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.description}>
          Kopieer de link om Coachscribe te delen met anderen.
        </Text>
        <View style={styles.linkRow}>
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>
              {SHARE_URL}
            </Text>
            <Pressable onPress={() => void handleCopy()} style={({ hovered }) => [styles.linkIconButton, hovered ? styles.linkIconButtonHovered : undefined]}>
              {copied ? <CopiedIcon size={18} /> : <CopyIcon color={colors.textSecondary} size={18} />}
            </Pressable>
          </View>
        </View>
      </View>
    </AnimatedOverlayModal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 520,
    maxWidth: '95vw',
    backgroundColor: colors.surface,
    borderRadius: 12,
    ...( { boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } as any ),
    overflow: 'hidden',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 8,
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
    paddingBottom: 24,
    gap: 14,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textStrong,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkBox: {
    flex: 1,
    minWidth: 0,
    padding: 16,
    borderRadius: 10,
    backgroundColor: colors.pageBackground,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  linkText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textStrong,
  },
  linkIconButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkIconButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
})

