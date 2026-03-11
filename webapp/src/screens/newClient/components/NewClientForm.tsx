import React from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { colors } from '../../../design/theme/colors'
import { ClientAvatarIcon } from '../../../icons/ClientAvatarIcon'
import type { ClientUpsertValues } from '../../../types/clientProfile'
import { Text } from '../../../ui/Text'

type Props = {
  values: ClientUpsertValues
  trajectoryLabel: string
  onChange: (key: keyof ClientUpsertValues, value: string) => void
}

const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  required?: boolean
}

function capitalizeFirstLetter(value: string): string {
  const raw = String(value || '')
  if (!raw) return ''
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function formatInitials(value: string): string {
  const letters = String(value || '').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 8).split('')
  return letters.length === 0 ? '' : `${letters.join('.')}.`
}

function sanitizeInitialsOnChange(previousValue: string, nextValue: string): string {
  const previousLetters = String(previousValue || '').replace(/[^a-zA-Z]/g, '').toUpperCase()
  const nextLetters = String(nextValue || '').replace(/[^a-zA-Z]/g, '').toUpperCase()
  if (nextValue.length < previousValue.length && nextLetters.length === previousLetters.length && previousLetters.length > 0) {
    return formatInitials(previousLetters.slice(0, -1))
  }
  return formatInitials(nextLetters)
}

function sanitizeBsn(value: string): string {
  return String(value || '').replace(/\D/g, '').slice(0, 9)
}

function Field({ label, value, onChange, placeholder, required = false }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#95888F"
          style={[styles.input, inputWebStyle]}
        />
      </View>
    </View>
  )
}

export function NewClientForm({ values, trajectoryLabel, onChange }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.personalHeaderRow}>
        <View style={styles.avatarWrap}>
          <ClientAvatarIcon color={colors.textStrong} size={30} />
        </View>
        <Pressable style={({ hovered }) => [styles.changePhotoButton, hovered ? styles.changePhotoButtonHovered : undefined]}>
          <Text style={styles.changePhotoText}>Profielfoto wijzigen</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        <View style={styles.column}>
          <Field
            label="Voornaam"
            value={values.firstName}
            onChange={(value) => onChange('firstName', capitalizeFirstLetter(value))}
            placeholder="Bijv. Jan"
            required
          />
          <Field
            label="Voorletters"
            value={values.initials}
            onChange={(value) => onChange('initials', sanitizeInitialsOnChange(values.initials, value))}
            placeholder="Bijv. J.K."
          />
          <Field label="E-mailadres" value={values.clientEmail} onChange={(value) => onChange('clientEmail', value)} placeholder="naam@email.nl" />
          <Field label="Ordernummer" value={values.orderNumber} onChange={(value) => onChange('orderNumber', value)} placeholder="Ordernummer" />
        </View>

        <View style={styles.column}>
          <Field
            label="Achternaam"
            value={values.lastName}
            onChange={(value) => onChange('lastName', capitalizeFirstLetter(value))}
            placeholder="Bijv. Jansen"
            required
          />
          <Field label="Telefoonnummer" value={values.clientPhone} onChange={(value) => onChange('clientPhone', value)} placeholder="06 12345678" />
          <Field label="BSN-nummer" value={values.bsn} onChange={(value) => onChange('bsn', sanitizeBsn(value))} placeholder="123456789" />
          <Field
            label="Naam contactpersoon IRV"
            value={values.uwvContactName}
            onChange={(value) => onChange('uwvContactName', capitalizeFirstLetter(value))}
            placeholder="Naam contactpersoon IRV"
          />
        </View>
      </View>

      <View style={styles.trajectoryRow}>
        <Text style={styles.fieldLabel}>Traject</Text>
        <View style={styles.trajectoryPill}>
          <Text isSemibold style={styles.trajectoryText}>{trajectoryLabel}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  personalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#CCD0D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoButton: {
    height: 32,
    borderRadius: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoButtonHovered: {
    backgroundColor: '#FCEFF6',
  },
  changePhotoText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.selected,
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  column: {
    flex: 1,
    minWidth: 280,
    gap: 12,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  inputWrap: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
    padding: 0,
  },
  trajectoryRow: {
    gap: 6,
  },
  trajectoryPill: {
    alignSelf: 'flex-start',
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trajectoryText: {
    fontSize: 13,
    lineHeight: 16,
    color: colors.textStrong,
  },
})

