import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'

import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { ModalCloseDarkIcon } from '../icons/ModalCloseDarkIcon'
import { Text } from '../Text'

type Props = {
  visible: boolean
  onClose: () => void
}

export function ContactModal({ visible, onClose }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const { width } = useWindowDimensions()
  const isStacked = width < 1100
  const inputWebStyle = useMemo(() => ({ outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any), [])

  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View />
        <Pressable onPress={onClose} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
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
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>Coachscribe</Text>
          </View>
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
            <Pressable style={({ hovered }) => [styles.submitButton, hovered ? styles.submitButtonHovered : undefined]}>
              <Text style={styles.submitButtonText}>Verstuur -&gt;</Text>
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
  },
  description: {
    maxWidth: 420,
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.9)',
  },
  imagePlaceholder: {
    width: '100%',
    maxWidth: 420,
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 24,
    lineHeight: 28,
    color: '#FFFFFF',
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
  submitButtonText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
  },
})
