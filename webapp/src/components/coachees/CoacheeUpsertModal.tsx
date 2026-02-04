import React, { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { colors } from '../../theme/colors'
import { Text } from '../Text'
import { ModalCloseDarkIcon } from '../icons/ModalCloseDarkIcon'
import { EditActionIcon } from '../icons/EditActionIcon'
import { MijnAccountIcon } from '../icons/MijnAccountIcon'
import { focusAndSelectAll } from '../../utils/textInput'

type Props = {
  visible: boolean
  mode: 'create' | 'edit'
  initialName: string
  onClose: () => void
  onSave: (name: string) => void
}

export function CoacheeUpsertModal({ visible, mode, initialName, onClose, onSave }: Props) {
  const [name, setName] = useState(initialName)
  const nameInputRef = useRef<TextInput | null>(null)

  useEffect(() => {
    if (!visible) return
    setName(initialName)
  }, [initialName, visible])

  useEffect(() => {
    if (!visible) return
    const id = setTimeout(() => nameInputRef.current?.focus(), 120)
    return () => clearTimeout(id)
  }, [visible])

  if (!visible) return null

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const title = mode === 'create' ? 'Coachee toevoegen' : 'Coachee bewerken'
  const primaryLabel = mode === 'create' ? 'Toevoegen' : 'Opslaan'

  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      {/* Modal header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Header icon */}
          <View style={styles.headerIconCircle}>
            <MijnAccountIcon />
          </View>
          {/* Header title */}
          <Text isBold style={styles.headerTitle}>
            {title}
          </Text>
        </View>

        <Pressable
          onPress={onClose}
          style={({ hovered, pressed }) => [
            styles.iconButton,
            hovered ? styles.iconButtonHovered : undefined,
            pressed ? styles.iconButtonPressed : undefined,
          ]}
        >
          {/* Close */}
          {({ pressed }) => (
            <>
              {pressed && <View style={styles.iconButtonOverlay} />}
              <ModalCloseDarkIcon />
            </>
          )}
        </Pressable>
      </View>

      {/* Modal body */}
      <View style={styles.body}>
        {/* Name field */}
        <View style={styles.field}>
          {/* Field label */}
          <Text style={styles.fieldLabel}>Naam</Text>
          <Pressable onPress={() => nameInputRef.current?.focus()} style={({ hovered }) => [styles.inputRow, hovered ? styles.inputRowHovered : undefined]}>
            <TextInput
              ref={(value) => {
                nameInputRef.current = value
              }}
              value={name}
              onChangeText={setName}
              onSubmitEditing={() => onSave(name)}
              placeholder="Naam..."
              placeholderTextColor="#656565"
              style={[styles.textInput, inputWebStyle]}
            />
            <Pressable onPress={() => focusAndSelectAll(nameInputRef, name)} style={({ hovered }) => [styles.inputIconButton, hovered ? styles.inputIconButtonHovered : undefined]}>
              {/* Edit icon */}
              <EditActionIcon color="#656565" size={18} />
            </Pressable>
          </Pressable>
        </View>
      </View>

      {/* Modal footer */}
      <View style={styles.footer}>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.footerSecondaryButton, hovered ? styles.footerSecondaryButtonHovered : undefined]}>
          {/* Cancel */}
          <Text isBold style={styles.footerSecondaryButtonText}>
            Annuleren
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onSave(name)}
          style={({ hovered }) => [styles.footerPrimaryButton, hovered ? styles.footerPrimaryButtonHovered : undefined]}
        >
          {/* Save */}
          <Text isBold style={styles.footerPrimaryButtonText}>
            {primaryLabel}
          </Text>
        </Pressable>
      </View>
    </AnimatedOverlayModal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 720,
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
    position: 'relative',
    zIndex: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FCE3F2',
    alignItems: 'center',
    justifyContent: 'center',
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
    overflow: 'hidden',
    position: 'relative',
  },
  iconButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  iconButtonPressed: {},
  iconButtonOverlay: {
    ...( { position: 'absolute', inset: 0 } as any ),
    backgroundColor: 'rgba(190, 1, 101, 0.08)',
  },
  body: {
    width: '100%',
    padding: 24,
    gap: 16,
  },
  field: {
    width: '100%',
    gap: 10,
  },
  fieldLabel: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  inputRow: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...( { cursor: 'pointer' } as any ),
  },
  inputRowHovered: {
    backgroundColor: colors.hoverBackground,
  },
  textInput: {
    flex: 1,
    padding: 0,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
    ...( { cursor: 'pointer' } as any ),
  },
  inputIconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputIconButtonHovered: {
    backgroundColor: colors.hoverBackground,
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
    paddingVertical: 0,
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
  footerPrimaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomRightRadius: 16,
    backgroundColor: colors.selected,
    paddingHorizontal: 24,
    paddingVertical: 0,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerPrimaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  footerPrimaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})

