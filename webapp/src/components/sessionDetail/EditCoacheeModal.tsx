import React, { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedOverlayModal } from '../../ui/AnimatedOverlayModal'
import { colors } from '../../design/theme/colors'
import { Text } from '../../ui/Text'
import { ModalCloseDarkIcon } from '../../icons/ModalCloseDarkIcon'
import { CoacheeBewerkenIcon } from '../../icons/CoacheeBewerkenIcon'
import { EditActionIcon } from '../../icons/EditActionIcon'
import { TrashIcon } from '../../icons/TrashIcon'
import { ArchiveIcon } from '../../icons/ArchiveIcon'
import { focusAndSelectAll } from '../../utils/textInput'

type Props = {
  visible: boolean
  initialName: string
  onClose: () => void
  onSave: (name: string) => void
  onArchive: () => void
  onDelete: () => void
}

export function EditCoacheeModal({ visible, initialName, onClose, onSave, onArchive, onDelete }: Props) {
  const [name, setName] = useState(initialName)
  const nameInputRef = useRef<TextInput | null>(null)

  useEffect(() => {
    if (!visible) return
    setName(initialName)
  }, [visible, initialName])

  if (!visible) return null

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
        {/* Modal header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Header icon */}
            <View style={styles.headerIconCircle}>
              <CoacheeBewerkenIcon color={colors.selected} />
            </View>
            {/* Header title */}
            <Text isBold style={styles.headerTitle}>
              Cliënt bewerken
            </Text>
          </View>

          <Pressable onPress={onClose} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
            {/* Close */}
            <ModalCloseDarkIcon />
          </Pressable>
        </View>

        {/* Modal body */}
        <View style={styles.body}>
          {/* Name field */}
          <View style={styles.field}>
            {/* Field label */}
            <Text style={styles.fieldLabel}>Naam</Text>
            <View style={styles.inputRow}>
              <TextInput
                ref={(value) => {
                  nameInputRef.current = value
                }}
                value={name}
                onChangeText={setName}
                placeholder="Naam..."
                placeholderTextColor="#656565"
                style={[styles.textInput, inputWebStyle]}
              />
              <Pressable
                onPress={() => {
                  focusAndSelectAll(nameInputRef, name)
                }}
                style={({ hovered }) => [styles.inputIconButton, hovered ? styles.inputIconButtonHovered : undefined]}
              >
                {/* Edit icon */}
                <EditActionIcon color="#656565" size={18} />
              </Pressable>
            </View>
          </View>

          {/* Top actions */}
          <View style={styles.topActionsRow}>
            <Pressable onPress={onArchive} style={({ hovered }) => [styles.secondaryWideButton, hovered ? styles.secondaryWideButtonHovered : undefined]}>
              {/* Archive */}
              <View style={styles.secondaryWideButtonContent}>
                <ArchiveIcon color="#656565" size={18} />
                <Text isSemibold style={styles.secondaryWideButtonText}>
                  Archiveren
                </Text>
              </View>
            </Pressable>

            <Pressable onPress={onDelete} style={({ hovered }) => [styles.dangerWideButton, hovered ? styles.dangerWideButtonHovered : undefined]}>
              {/* Delete */}
              <View style={styles.dangerWideButtonContent}>
                <TrashIcon color={colors.selected} size={18} />
                <Text isSemibold style={styles.dangerWideButtonText}>
                  Verwijderen
                </Text>
              </View>
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
              Opslaan
            </Text>
          </Pressable>
        </View>
    </AnimatedOverlayModal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 920,
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
  },
  iconButtonHovered: {
    backgroundColor: colors.hoverBackground,
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
  },
  textInput: {
    flex: 1,
    padding: 0,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
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
  topActionsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  secondaryWideButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryWideButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  secondaryWideButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  secondaryWideButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  dangerWideButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FCE3F2',
    borderWidth: 1,
    borderColor: '#F2BBD9',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerWideButtonHovered: {
    backgroundColor: '#F8D2EA',
  },
  dangerWideButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dangerWideButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.selected,
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


