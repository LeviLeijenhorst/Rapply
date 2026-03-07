import React from 'react'
import { Pressable, View } from 'react-native'

import { AnimatedOverlayModal } from '../../../ui/AnimatedOverlayModal'
import { Text } from '../../../ui/Text'
import { styles } from '../styles'

type Props = {
  documentLabelLower: string
  formattedRemainingMinutes: string
  formattedRequiredMinutes: string
  onClose: () => void
  onOpenSubscription: () => void
  visible: boolean
}

export function NoMinutesModal({
  documentLabelLower,
  formattedRemainingMinutes,
  formattedRequiredMinutes,
  onClose,
  onOpenSubscription,
  visible,
}: Props) {
  return (
    <AnimatedOverlayModal
      visible={visible}
      onClose={onClose}
      contentContainerStyle={styles.noMinutesModalContainer}
    >
      <View style={styles.noMinutesModalContent}>
        <Text isBold style={styles.noMinutesModalTitle}>
          Onvoldoende minuten voor transcriptie
        </Text>
        <Text style={styles.noMinutesModalText}>
          U heeft nog {formattedRemainingMinutes} en dit {documentLabelLower} heeft ongeveer {formattedRequiredMinutes} nodig. Bekijk uw abonnement om extra minuten te regelen.
        </Text>
      </View>
      <View style={styles.noMinutesModalFooter}>
        <Pressable
          onPress={onClose}
          style={({ hovered }) => [
            styles.noMinutesFooterSecondaryButton,
            hovered ? styles.noMinutesFooterSecondaryButtonHovered : undefined,
          ]}
        >
          <Text isBold style={styles.noMinutesFooterSecondaryButtonText}>
            Sluiten
          </Text>
        </Pressable>
        <Pressable
          onPress={onOpenSubscription}
          style={({ hovered }) => [
            styles.noMinutesFooterPrimaryButton,
            hovered ? styles.noMinutesFooterPrimaryButtonHovered : undefined,
          ]}
        >
          <Text isBold style={styles.noMinutesFooterPrimaryButtonText}>
            Mijn abonnement
          </Text>
        </Pressable>
      </View>
    </AnimatedOverlayModal>
  )
}

