import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { colors } from '../../theme/colors'
import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { Text } from '../Text'
import { ModalCloseDarkIcon } from '../icons/ModalCloseDarkIcon'
import { toUserFriendlyErrorMessage } from '../../utils/userFriendlyError'

type Props = {
  visible: boolean
  onClose: () => void
  onContinue?: (feedback: string) => Promise<void> | void
}

export function FeedbackModal({ visible, onClose, onContinue }: Props) {
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setFeedback('')
    setIsSubmitting(false)
    setSubmitError(null)
  }, [visible])

  const trimmedFeedback = feedback.trim()
  const isContinueDisabled = trimmedFeedback.length === 0 || isSubmitting

  async function submitFeedback() {
    if (isContinueDisabled) return
    try {
      setIsSubmitting(true)
      setSubmitError(null)
      await onContinue?.(trimmedFeedback)
      onClose()
    } catch (error) {
      const message = toUserFriendlyErrorMessage(error, { fallback: 'Opslaan mislukt. Probeer het opnieuw.' })
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text isBold style={styles.title}>
          Feedback geven
        </Text>
        <Pressable
          onPress={() => {
            if (isSubmitting) return
            onClose()
          }}
          style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}
        >
          <ModalCloseDarkIcon size={34} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.description}>
          Wat fijn dat je ons wil helpen om CoachScribe te verbeteren! Vertel ons waar je tegenaan bent gelopen of wat we kunnen toevoegen.
        </Text>

        <TextInput
          value={feedback}
          onChangeText={setFeedback}
          style={styles.textInput}
          multiline
          placeholder="Typ hier je feedback"
          placeholderTextColor={colors.textSecondary}
          textAlignVertical="top"
        />

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={onClose}
          style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined, isSubmitting ? styles.secondaryButtonDisabled : undefined]}
          disabled={isSubmitting}
        >
          <Text isBold style={styles.secondaryButtonText}>
            Annuleren
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            void submitFeedback()
          }}
          style={({ hovered }) => [
            styles.primaryButton,
            hovered ? styles.primaryButtonHovered : undefined,
            isContinueDisabled ? styles.primaryButtonDisabled : undefined,
          ]}
          disabled={isContinueDisabled}
        >
          <Text isBold style={styles.primaryButtonText}>
            {isSubmitting ? 'Versturen...' : 'Doorgaan'}
          </Text>
        </Pressable>
      </View>
    </AnimatedOverlayModal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 860,
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
    paddingBottom: 20,
    gap: 14,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textStrong,
  },
  textInput: {
    width: '100%',
    minHeight: 190,
    borderRadius: 10,
    backgroundColor: colors.pageBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textStrong,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  secondaryButton: {
    width: 144,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  secondaryButtonDisabled: {
    opacity: 0.55,
  },
  secondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  primaryButton: {
    width: 144,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#B20000',
  },
})
