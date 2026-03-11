import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, TextInput, View } from 'react-native'

import { Modal } from '../../../../ui/animated/Modal'
import { Text } from '../../../../ui/Text'
import { MijnAccountIcon } from '../../../../icons/MijnAccountIcon'
import type { ClientUpsertValues } from '../../../../types/clientProfile'
import { styles } from './ClientUpsertModal.styles'
import type { ClientUpsertModalProps } from './ClientUpsertModal.types'
import { capitalizeFirstCharacter, normalizeInitialsInput, sanitizePhoneInput } from './ClientUpsertModal.logic'

export function ClientUpsertModal({ visible, mode, initialValues, trajectoryOptions = [], onClose, onSave }: ClientUpsertModalProps) {
  const [values, setValues] = useState<ClientUpsertValues>(initialValues)

  const containerRef = useRef<View | null>(null)
  const initialsInputRef = useRef<TextInput | null>(null)
  const inputRefs = useRef<Partial<Record<keyof ClientUpsertValues, TextInput | null>>>({})

  useEffect(() => {
    if (!visible) return
    setValues(initialValues)
  }, [initialValues, visible])

  useEffect(() => {
    if (!visible) return
    const id = setTimeout(() => initialsInputRef.current?.focus(), 120)
    return () => clearTimeout(id)
  }, [visible])

  const hasSelectableTrajectory = trajectoryOptions.length > 0

  useEffect(() => {
    if (!visible) return
    if (!hasSelectableTrajectory) return
    if (values.trajectoryId) return
    setValues((previous) => ({ ...previous, trajectoryId: trajectoryOptions[0]?.id ?? previous.trajectoryId }))
  }, [hasSelectableTrajectory, trajectoryOptions, values.trajectoryId, visible])

  if (!visible) return null

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const title = mode === 'create' ? 'Cliënt toevoegen' : 'Cliënt bewerken'
  const primaryLabel = mode === 'create' ? 'Toevoegen' : 'Opslaan'
  const trimmedBsn = values.bsn.trim()
  const isBsnValid = trimmedBsn.length === 0 || /^\d{8,9}$/.test(trimmedBsn)
  const isSaveDisabled = values.firstName.trim().length === 0 || values.lastName.trim().length === 0 || !isBsnValid
  const selectedTrajectoryLabel = 'Werkfit maken'

  function setValue<K extends keyof ClientUpsertValues>(key: K, nextValue: ClientUpsertValues[K]) {
    setValues((previous) => ({ ...previous, [key]: nextValue }))
  }

  function renderInputRow(
    label: string,
    key: keyof ClientUpsertValues,
    options?: { placeholder?: string; inputRef?: React.MutableRefObject<TextInput | null>; required?: boolean },
  ) {
    const value = values[key]
    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          {label}
          {options?.required ? ' *' : ''}
        </Text>
        <Pressable onPress={() => inputRefs.current[key]?.focus()} style={({ hovered }) => [styles.inputRow, hovered ? styles.inputRowHovered : undefined]}>
          <TextInput
            ref={(instance) => {
              inputRefs.current[key] = instance
              if (options?.inputRef) options.inputRef.current = instance
            }}
            value={String(value)}
            onChangeText={(text) => {
              if (key === 'initials') {
                setValue('initials', normalizeInitialsInput(text, values.initials))
                return
              }
              if (key === 'bsn') {
                setValue('bsn', text.replace(/\D/g, ''))
                return
              }
              if (key === 'lastName') {
                setValue('lastName', capitalizeFirstCharacter(text))
                return
              }
              if (key === 'clientPhone') {
                setValue('clientPhone', sanitizePhoneInput(text))
                return
              }
              setValue(key, text as ClientUpsertValues[keyof ClientUpsertValues])
            }}
            placeholder={options?.placeholder ?? ''}
            placeholderTextColor="#656565"
            style={[styles.textInput, styles.inputCursorPointer, inputWebStyle]}
          />
        </Pressable>
      </View>
    )
  }

  function renderTrajectoryDisplay() {
    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Traject</Text>
        <View style={[styles.inputRow, styles.inputRowReadOnly]}>
          <Text style={styles.dropdownValueText}>{selectedTrajectoryLabel || 'Werkfit maken'}</Text>
        </View>
      </View>
    )
  }

  return (
    <Modal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      <View ref={containerRef} style={styles.modalInner}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconCircle}>
              <MijnAccountIcon />
            </View>
            <Text isBold style={styles.headerTitle}>
              {title}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {renderInputRow('Voornaam', 'firstName', { placeholder: 'Voornaam', required: true })}
          {renderInputRow('Voorletters', 'initials', { placeholder: 'Bijv. J.A.', inputRef: initialsInputRef, required: true })}
          {renderInputRow('Achternaam', 'lastName', { placeholder: 'Achternaam', required: true })}
          {renderInputRow('Burgerservicenummer', 'bsn', { placeholder: 'BSN' })}
          {renderInputRow('E-mail', 'clientEmail', { placeholder: 'naam@voorbeeld.nl' })}
          {renderInputRow('Telefoon', 'clientPhone', { placeholder: '+31612345678' })}
          {renderTrajectoryDisplay()}
          {renderInputRow('Ordernummer', 'orderNumber', { placeholder: 'Ordernummer' })}
          {renderInputRow('Naam contactpersoon UWV', 'uwvContactName', { placeholder: 'Naam contactpersoon UWV' })}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable onPress={onClose} style={({ hovered }) => [styles.footerSecondaryButton, hovered ? styles.footerSecondaryButtonHovered : undefined]}>
            <Text isBold style={styles.footerSecondaryButtonText}>
              Annuleren
            </Text>
          </Pressable>
          <Pressable
            disabled={isSaveDisabled}
            onPress={() => onSave(values)}
            style={({ hovered }) => [
              styles.footerPrimaryButton,
              isSaveDisabled ? styles.footerPrimaryButtonDisabled : undefined,
              hovered && !isSaveDisabled ? styles.footerPrimaryButtonHovered : undefined,
            ]}
          >
            <Text isBold style={styles.footerPrimaryButtonText}>
              {primaryLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
