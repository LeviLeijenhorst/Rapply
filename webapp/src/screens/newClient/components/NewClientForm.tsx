import React, { useEffect, useRef } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'

import { colors } from '../../../design/theme/colors'
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
  autoFocus?: boolean
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad' | 'url'
  inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
  inputRef?: React.RefObject<TextInput | null>
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

function sanitizePhone(value: string): string {
  const compact = String(value || '').replace(/\s+/g, '')
  const hasLeadingPlus = compact.startsWith('+')
  const digits = compact.replace(/\D/g, '')
  return `${hasLeadingPlus ? '+' : ''}${digits}`
}

function Field({ label, value, onChange, placeholder, required = false, autoFocus = false, keyboardType = 'default', inputMode = 'text', inputRef }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <View style={styles.inputWrap}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#95888F"
          autoFocus={autoFocus}
          keyboardType={keyboardType}
          inputMode={inputMode}
          style={[styles.input, inputWebStyle]}
        />
      </View>
    </View>
  )
}

export function NewClientForm({ values, trajectoryLabel, onChange }: Props) {
  const firstNameInputRef = useRef<TextInput | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const timeoutId = window.setTimeout(() => {
      firstNameInputRef.current?.focus()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <View style={styles.row}>
          <View style={styles.cell}>
            <Field
              label="Voornaam"
              value={values.firstName}
              onChange={(value) => onChange('firstName', capitalizeFirstLetter(value))}
              placeholder="Bijv. Jan"
              required
              autoFocus
              inputRef={firstNameInputRef}
            />
          </View>
          <View style={styles.cell}>
            <Field
              label="Achternaam"
              value={values.lastName}
              onChange={(value) => onChange('lastName', capitalizeFirstLetter(value))}
              placeholder="Bijv. Jansen"
              required
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.cell}>
            <Field
              label="Voorletters"
              value={values.initials}
              onChange={(value) => onChange('initials', sanitizeInitialsOnChange(values.initials, value))}
              placeholder="Bijv. J.K."
            />
          </View>
          <View style={styles.cell}>
            <Field
              label="Telefoonnummer"
              value={values.clientPhone}
              onChange={(value) => onChange('clientPhone', sanitizePhone(value))}
              placeholder="+31612345678"
              keyboardType="phone-pad"
              inputMode="tel"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.cell}>
            <Field label="E-mailadres" value={values.clientEmail} onChange={(value) => onChange('clientEmail', value)} placeholder="naam@email.nl" keyboardType="email-address" inputMode="email" />
          </View>
          <View style={styles.cell}>
            <Field label="BSN-nummer" value={values.bsn} onChange={(value) => onChange('bsn', sanitizeBsn(value))} placeholder="123456789" />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.cell}>
            <Field label="Ordernummer" value={values.orderNumber} onChange={(value) => onChange('orderNumber', value)} placeholder="Ordernummer" />
          </View>
          <View style={styles.cell}>
            <Field
              label="Naam contactpersoon IRV"
              value={values.uwvContactName}
              onChange={(value) => onChange('uwvContactName', capitalizeFirstLetter(value))}
              placeholder="Naam contactpersoon IRV"
            />
          </View>
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
  grid: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  cell: {
    flex: 1,
    minWidth: 280,
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

