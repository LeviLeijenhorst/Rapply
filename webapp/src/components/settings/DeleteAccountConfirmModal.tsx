import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedOverlayModal } from '../../ui/AnimatedOverlayModal'
import { colors } from '../../design/theme/colors'
import { Text } from '../../ui/Text'
import { ModalCloseDarkIcon } from '../../icons/ModalCloseDarkIcon'

type Props = {
  visible: boolean
  isBusy?: boolean
  onClose: () => void
  onConfirm: () => void
}

const REQUIRED_CONFIRMATION_TEXT = 'VERWIJDEREN'

export function DeleteAccountConfirmModal({ visible, isBusy = false, onClose, onConfirm }: Props) {
  const [confirmationText, setConfirmationText] = useState('')
  const inputRef = useRef<TextInput | null>(null)

  useEffect(() => {
    if (!visible) return
    setConfirmationText('')
    const id = setTimeout(() => inputRef.current?.focus(), 120)
    return () => clearTimeout(id)
  }, [visible])

  const inputWebStyle = useMemo(() => ({ outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any), [])
  const canConfirm = confirmationText.trim().toUpperCase() === REQUIRED_CONFIRMATION_TEXT && !isBusy

  if (!visible) return null

  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text isBold style={styles.headerTitle}>
          Account verwijderen
        </Text>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
          <ModalCloseDarkIcon />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.descriptionText}>
          Weet je zeker dat je je account wilt verwijderen? Dit verwijdert al je cliëntdata en verslagen definitief.
        </Text>
        <Text style={styles.descriptionText}>
          Typ <Text isSemibold>{REQUIRED_CONFIRMATION_TEXT}</Text> om te bevestigen.
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            ref={(value) => {
              inputRef.current = value
            }}
            value={confirmationText}
            onChangeText={setConfirmationText}
            placeholder={REQUIRED_CONFIRMATION_TEXT}
            placeholderTextColor="#656565"
            autoCapitalize="characters"
            style={[styles.input, inputWebStyle]}
            editable={!isBusy}
            onSubmitEditing={() => {
              if (!canConfirm) return
              onConfirm()
            }}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.footerSecondaryButton, hovered ? styles.footerSecondaryButtonHovered : undefined]}>
          <Text isBold style={styles.footerSecondaryButtonText}>
            Annuleren
          </Text>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          disabled={!canConfirm}
          style={({ hovered }) => [
            styles.footerDangerButton,
            hovered ? styles.footerDangerButtonHovered : undefined,
            !canConfirm ? styles.footerDangerButtonDisabled : undefined,
          ]}
        >
          <Text isBold style={styles.footerDangerButtonText}>
            {isBusy ? 'Account verwijderen...' : 'Verwijderen'}
          </Text>
        </Pressable>
      </View>
    </AnimatedOverlayModal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 640,
    maxWidth: '90vw',
    backgroundColor: colors.surface,
    borderRadius: 16,
    ...( { boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } as any ),
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
    gap: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textStrong,
  },
  inputRow: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
    padding: 0,
  },
  footer: {
    width: '100%',
    padding: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerSecondaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomLeftRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 0,
    borderColor: 'transparent',
    paddingHorizontal: 24,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSecondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  footerSecondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  footerDangerButton: {
    height: 48,
    borderRadius: 0,
    borderBottomRightRadius: 16,
    backgroundColor: colors.selected,
    paddingHorizontal: 24,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerDangerButtonHovered: {
    backgroundColor: '#A50058',
  },
  footerDangerButtonDisabled: {
    opacity: 0.45,
  },
  footerDangerButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})

