import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'
import { LoadingSpinner } from '../../ui/LoadingSpinner'

import { AnimatedOverlayModal } from '../../ui/AnimatedOverlayModal'
import { ModalCloseDarkIcon } from '../../icons/ModalCloseDarkIcon'
import { Text } from '../../ui/Text'
import { submitContactSubmission } from '../../api/contact/pricingAndContactApi'
import { useToast } from '../../toast/ToastProvider'

type Props = {
  visible: boolean
  onClose: () => void
  onSubmitted?: () => void
}

export function ContactModal({ visible, onClose, onSubmitted }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showErrorToast } = useToast()
  const { width } = useWindowDimensions()
  const isStacked = width < 1100
  const inputWebStyle = useMemo(() => ({ outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any), [])

  function clearForm() {
    setName('')
    setEmail('')
    setPhone('')
    setMessage('')
  }

  function closeModal() {
    if (isSubmitting) return
    clearForm()
    onClose()
  }

  function validateForm() {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedMessage = message.trim()

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      showErrorToast('Vul alsjeblieft je naam, e-mailadres en bericht in.')
      return null
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(trimmedEmail)) {
      showErrorToast('Gebruik alsjeblieft een geldig e-mailadres.')
      return null
    }

    return {
      name: trimmedName,
      email: trimmedEmail,
      phone: phone.trim(),
      message: trimmedMessage,
    }
  }

  function submitForm() {
    if (isSubmitting) return
    const validated = validateForm()
    if (!validated) return
    setIsSubmitting(true)
    void submitContactSubmission({
      name: validated.name,
      email: validated.email,
      phone: validated.phone || null,
      message: validated.message,
    })
      .then(() => {
        clearForm()
        onClose()
        onSubmitted?.()
      })
      .catch(() => {
        showErrorToast('Versturen mislukt. Probeer het alsjeblieft opnieuw.')
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  return (
    <AnimatedOverlayModal visible={visible} onClose={closeModal} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View />
        <Pressable
          onPress={closeModal}
          style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}
          disabled={isSubmitting}
        >
          <ModalCloseDarkIcon size={34} />
        </Pressable>
      </View>

      <View style={[styles.body, isStacked ? styles.bodyStacked : undefined]}>
        <View style={styles.leftColumn}>
          <Text isBold style={styles.title}>
            Kom in contact
          </Text>
          <Text style={styles.description}>
            Heb je een vraag, wil je input geven of ben je benieuwd wat wij voor jou kunnen betekenen? Neem contact met ons op!
          </Text>
          <Text style={styles.callout}>
            Je kunt ook bellen naar 0622168360 (Levi).
          </Text>
        </View>

        <View style={styles.formColumn}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Volledige naam*</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Jouw volledige naam"
              placeholderTextColor="rgba(255,255,255,0.7)"
              style={[styles.input, inputWebStyle]}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email*</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Jouw Email adres"
              placeholderTextColor="rgba(255,255,255,0.7)"
              style={[styles.input, inputWebStyle]}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nummer (optioneel)</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Jouw telefoon nummer"
              placeholderTextColor="rgba(255,255,255,0.7)"
              style={[styles.input, inputWebStyle]}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Bericht*</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Laat ons weten wat je denkt..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              multiline
              textAlignVertical="top"
              style={[styles.messageInput, inputWebStyle]}
            />
          </View>
          <View style={styles.submitRow}>
            <Pressable
              onPress={submitForm}
              style={({ hovered }) => [
                styles.submitButton,
                hovered ? styles.submitButtonHovered : undefined,
                isSubmitting ? styles.submitButtonDisabled : undefined,
              ]}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoadingSpinner size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Verstuur -&gt;</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </AnimatedOverlayModal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 980,
    maxWidth: '96vw',
    borderRadius: 24,
    backgroundColor: '#BE0165',
    ...( { backgroundImage: 'linear-gradient(140deg, #BE0165 0%, #8D004B 100%)' } as any ),
    ...( { boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } as any ),
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 52,
    lineHeight: 58,
    color: '#FFFFFF',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonHovered: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  body: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    gap: 20,
    flexDirection: 'row',
  },
  bodyStacked: {
    flexDirection: 'column',
  },
  leftColumn: {
    flex: 1,
    gap: 18,
    justifyContent: 'flex-start',
  },
  callout: {
    maxWidth: 420,
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  description: {
    maxWidth: 420,
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.9)',
  },
  formColumn: {
    flex: 1,
    gap: 14,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  messageInput: {
    minHeight: 128,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  submitRow: {
    paddingTop: 4,
  },
  submitButton: {
    height: 48,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  submitButtonHovered: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
  },
})

