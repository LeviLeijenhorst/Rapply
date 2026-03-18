import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Pressable } from 'react-native'

import { Text } from '../../ui/Text'
import { TextInput } from '../../ui/inputs/TextInput'
import { useLocalAppData } from '../../storage/LocalAppDataProvider'
import { colors } from '../../design/theme/colors'
import { fontSizes } from '../../design/tokens/fontSizes'
import { normalizeEmailValue, normalizePhoneValue } from '../organization/viewModels/inputFormatters'
import { LogoutIcon } from '../../icons/LogoutIcon'
import { TrashIcon } from '../../icons/TrashIcon'

function capitalizeFirstLetter(value: string): string {
  const raw = String(value || '')
  if (!raw) return ''
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function placeholderForProfileLabel(label: string): string {
  if (label === 'Naam') return 'Bijv. Jan de Vries'
  if (label === 'Functie') return 'Bijv. Re-integratiecoach'
  if (label === 'Telefoonnummer') return 'Bijv. 0612345678'
  if (label === 'E-mailadres') return 'jan@voorbeeld.nl'
  return 'Typ uw antwoord'
}

type LabeledInputProps = {
  label: string
  value: string
  onChangeText: (value: string) => void
  onBlur: () => void
}

function LabeledInput({ label, value, onChangeText, onBlur }: LabeledInputProps) {
  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

  return (
    <View style={styles.fieldItem}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholderForProfileLabel(label)}
          placeholderTextColor="#8E8480"
          style={[styles.input, inputWebStyle]}
        />
      </View>
    </View>
  )
}

type ProfileScreenProps = {
  accountName?: string | null
  accountEmail?: string | null
  onLogout?: () => void
  onDeleteAccount?: () => void
  isDeleteAccountBusy?: boolean
}

export function ProfileScreen({
  accountName = null,
  accountEmail = null,
  onLogout,
  onDeleteAccount,
  isDeleteAccountBusy = false,
}: ProfileScreenProps) {
  const { data, updateUserSettings } = useLocalAppData()
  const userSettings = data.userSettings
  const accountIdentity = String(accountName || '').trim() || String(accountEmail || '').trim() || 'Onbekend account'

  const [nameDraft, setNameDraft] = useState(String(userSettings.name || ''))
  const [roleDraft, setRoleDraft] = useState(String(userSettings.role || ''))
  const [phoneDraft, setPhoneDraft] = useState(String(userSettings.phone || ''))
  const [emailDraft, setEmailDraft] = useState(String(userSettings.email || ''))

  useEffect(() => {
    setNameDraft(String(userSettings.name || ''))
    setRoleDraft(String(userSettings.role || ''))
    setPhoneDraft(String(userSettings.phone || ''))
    setEmailDraft(String(userSettings.email || ''))
  }, [userSettings.name, userSettings.role, userSettings.phone, userSettings.email])

  function persistName(nextValue: string) {
    const normalized = capitalizeFirstLetter(nextValue)
    setNameDraft(normalized)
    updateUserSettings({ name: normalized })
  }

  function persistRole(nextValue: string) {
    const normalized = capitalizeFirstLetter(nextValue)
    setRoleDraft(normalized)
    updateUserSettings({ role: normalized })
  }

  function persistPhone(nextValue: string) {
    const normalized = normalizePhoneValue(nextValue)
    setPhoneDraft(normalized)
    updateUserSettings({ phone: normalized })
  }

  function persistEmail(nextValue: string) {
    const normalized = normalizeEmailValue(nextValue)
    setEmailDraft(normalized)
    updateUserSettings({ email: normalized })
  }

  return (
    <ScrollView style={styles.screenScroll} contentContainerStyle={styles.screenScrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <Text isSemibold style={styles.headerTitle}>
          Mijn account
        </Text>
        <View style={styles.formSection}>
          <View style={styles.formCard}>
            <View style={styles.fieldGrid}>
              <LabeledInput
                label="Naam"
                value={nameDraft}
                onChangeText={(nextValue) => setNameDraft(capitalizeFirstLetter(nextValue))}
                onBlur={() => persistName(nameDraft)}
              />
              <LabeledInput
                label="Functie"
                value={roleDraft}
                onChangeText={(nextValue) => setRoleDraft(capitalizeFirstLetter(nextValue))}
                onBlur={() => persistRole(roleDraft)}
              />
              <LabeledInput
                label="Telefoonnummer"
                value={phoneDraft}
                onChangeText={(nextValue) => setPhoneDraft(normalizePhoneValue(nextValue))}
                onBlur={() => persistPhone(phoneDraft)}
              />
              <LabeledInput
                label="E-mailadres"
                value={emailDraft}
                onChangeText={(nextValue) => setEmailDraft(normalizeEmailValue(nextValue))}
                onBlur={() => persistEmail(emailDraft)}
              />
            </View>
          </View>
          <View style={styles.accountCard}>
            <Text isSemibold style={styles.accountTitle}>Ingelogd als</Text>
            <Text isBold style={styles.accountIdentity}>{accountIdentity}</Text>
            {accountName && accountEmail ? <Text style={styles.accountEmail}>{accountEmail}</Text> : null}
            <View style={styles.accountActions}>
              <Pressable onPress={onLogout} style={({ hovered }) => [styles.secondaryWideButton, hovered ? styles.secondaryWideButtonHovered : undefined]}>
                <View style={styles.secondaryWideButtonContent}>
                  <LogoutIcon size={18} color={colors.textStrong} />
                  <Text isSemibold style={styles.secondaryWideButtonText}>Uitloggen</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={onDeleteAccount}
                style={({ hovered }) => [
                  styles.dangerWideButton,
                  hovered ? styles.dangerWideButtonHovered : undefined,
                  isDeleteAccountBusy ? styles.actionButtonDisabled : undefined,
                ]}
                disabled={isDeleteAccountBusy}
              >
                <View style={styles.dangerWideButtonContent}>
                  <TrashIcon color={colors.selected} size={18} />
                  <Text isSemibold style={styles.dangerWideButtonText}>
                    {isDeleteAccountBusy ? 'Account verwijderen...' : 'Account verwijderen'}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screenScroll: {
    flex: 1,
  },
  screenScrollContent: {
    paddingBottom: 0,
  },
  container: {
    minHeight: 0,
    gap: 14,
    padding: 24,
    paddingBottom: 24,
    ...( { overflow: 'visible' } as any ),
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    lineHeight: 28,
    color: colors.text,
  },
  formSection: {
    width: '100%',
    ...( { maxWidth: 'min(1280px, 100%)' } as any ),
    gap: 14,
  },
  formCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
    ...( { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } as any ),
  },
  accountCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  accountTitle: {
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  accountIdentity: {
    fontSize: 18,
    lineHeight: 24,
    color: colors.textStrong,
  },
  accountEmail: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  accountActions: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
    marginTop: 6,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  secondaryWideButton: {
    width: '100%',
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryWideButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  secondaryWideButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  secondaryWideButtonText: {
    fontSize: 13,
    lineHeight: 16,
    color: colors.textStrong,
  },
  dangerWideButton: {
    width: '100%',
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FCE3F2',
    borderWidth: 1,
    borderColor: '#F2BBD9',
    paddingHorizontal: 14,
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
    fontSize: 13,
    lineHeight: 16,
    color: colors.selected,
  },
  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fieldItem: {
    width: '48.5%',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    lineHeight: 18,
    color: '#2C111F',
  },
  inputWrap: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    padding: 0,
    fontSize: 14,
    lineHeight: 20,
    color: '#2C111F',
  },
})

