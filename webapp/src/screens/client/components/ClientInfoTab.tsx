import React, { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { MijnAccountIcon } from '@/icons/MijnAccountIcon'
import { colors } from '@/design/theme/colors'
import { typography } from '@/design/theme/typography'
import type { ClientUpsertValues } from '@/types/clientProfile'
import { Text } from '@/ui/Text'
import { capitalizeFirstCharacter, normalizeInitialsInput, sanitizePhoneInput } from '@/screens/shared/modals/ClientUpsertModal/ClientUpsertModal.logic'

type Props = {
  initialValues: ClientUpsertValues
  onDelete: () => void
  onSave: (values: ClientUpsertValues) => void
}

export function ClientInfoTab({ initialValues, onDelete, onSave }: Props) {
  const [values, setValues] = useState<ClientUpsertValues>(initialValues)
  const inputRefs = useRef<Partial<Record<keyof ClientUpsertValues, TextInput | null>>>({})

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  const trimmedBsn = values.bsn.trim()
  const isBsnValid = trimmedBsn.length === 0 || /^\d{8,9}$/.test(trimmedBsn)
  const isSaveDisabled = values.firstName.trim().length === 0 || values.lastName.trim().length === 0 || !isBsnValid
  const selectedTrajectoryLabel = 'Werkfit maken'
  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

  function setValue<K extends keyof ClientUpsertValues>(key: K, nextValue: ClientUpsertValues[K]) {
    setValues((previous) => ({ ...previous, [key]: nextValue }))
  }

  function renderInputRow(label: string, key: keyof ClientUpsertValues, options?: { placeholder?: string; required?: boolean }) {
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
            style={[styles.textInput, inputWebStyle]}
          />
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconCircle}>
            <MijnAccountIcon />
          </View>
          <Text isSemibold style={styles.headerTitle}>
            Cliëntinformatie
          </Text>
        </View>
      </View>

      <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {renderInputRow('Voornaam', 'firstName', { placeholder: 'Voornaam', required: true })}
        {renderInputRow('Voorletters', 'initials', { placeholder: 'Bijv. J.A.', required: true })}
        {renderInputRow('Achternaam', 'lastName', { placeholder: 'Achternaam', required: true })}
        {renderInputRow('Burgerservicenummer', 'bsn', { placeholder: 'BSN' })}
        {renderInputRow('E-mail', 'clientEmail', { placeholder: 'naam@voorbeeld.nl' })}
        {renderInputRow('Telefoon', 'clientPhone', { placeholder: '+31612345678' })}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Traject</Text>
          <View style={[styles.inputRow, styles.inputRowReadOnly]}>
            <Text style={styles.dropdownValueText}>{selectedTrajectoryLabel}</Text>
          </View>
        </View>
        {renderInputRow('Ordernummer', 'orderNumber', { placeholder: 'Ordernummer' })}
        {renderInputRow('Naam contactpersoon UWV', 'uwvContactName', { placeholder: 'Naam contactpersoon UWV' })}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={onDelete} style={({ hovered }) => [styles.footerDeleteButton, hovered ? styles.footerDeleteButtonHovered : undefined]}>
          <Text isSemibold style={styles.footerDeleteButtonText}>
            Verwijderen
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
          <Text isSemibold style={styles.footerPrimaryButtonText}>
            Opslaan
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE0E2',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FCE3F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 24, lineHeight: 34, color: '#2C111F' },
  bodyScroll: { flex: 1 },
  body: { padding: 24, gap: 12 },
  field: { width: '100%', gap: 8 },
  fieldLabel: { fontSize: 13, lineHeight: 18, color: '#2C111F' },
  inputRow: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE0E2',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...({ cursor: 'pointer' } as any),
  },
  inputRowHovered: { borderColor: colors.selected },
  inputRowReadOnly: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D5D7DA',
  },
  textInput: {
    flex: 1,
    padding: 0,
    fontSize: 15,
    lineHeight: 20,
    color: '#2C111F',
    fontFamily: typography.fontFamilyRegular,
  },
  dropdownValueText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: '#2C111F',
    fontFamily: typography.fontFamilyRegular,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#DFE0E2',
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerDeleteButton: {
    minWidth: 140,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1B5B5',
    backgroundColor: '#FFF6F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  footerDeleteButtonHovered: { backgroundColor: '#FDECEC' },
  footerDeleteButtonText: { fontSize: 14, lineHeight: 18, color: '#B42318' },
  footerPrimaryButton: {
    minWidth: 140,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.selected,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  footerPrimaryButtonDisabled: {
    backgroundColor: '#CFA5BC',
    borderColor: '#CFA5BC',
  },
  footerPrimaryButtonHovered: {
    backgroundColor: '#A50058',
    borderColor: '#A50058',
  },
  footerPrimaryButtonText: { fontSize: 14, lineHeight: 18, color: '#FFFFFF' },
})
