import React, { useEffect, useRef, useState } from 'react'
import { Linking, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { colors } from '../../theme/colors'
import { Text } from '../Text'
import { ModalCloseDarkIcon } from '../icons/ModalCloseDarkIcon'
import { EditActionIcon } from '../icons/EditActionIcon'
import { TrashIcon } from '../icons/TrashIcon'
import { MijnAccountIcon } from '../icons/MijnAccountIcon'
import { LogoutIcon } from '../icons/LogoutIcon'
import { focusAndSelectAll } from '../../utils/textInput'

type Props = {
  visible: boolean
  initialName: string
  initialEmail: string
  onClose: () => void
  onSave: (values: { name: string; email: string; password: string }) => void
  onLogout: () => void
  onDeleteAccount: () => void
  isManagedByEntra?: boolean
  entraAccountUrl?: string
}

export function MyAccountModal({
  visible,
  initialName,
  initialEmail,
  onClose,
  onSave,
  onLogout,
  onDeleteAccount,
  isManagedByEntra = false,
  entraAccountUrl = 'https://myaccount.microsoft.com/',
}: Props) {
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')

  const nameInputRef = useRef<TextInput | null>(null)
  const emailInputRef = useRef<TextInput | null>(null)
  const passwordInputRef = useRef<TextInput | null>(null)

  useEffect(() => {
    if (!visible) return
    setName(initialName)
    setEmail(initialEmail)
    setPassword(isManagedByEntra ? '********' : 'password')
  }, [initialEmail, initialName, isManagedByEntra, visible])

  if (!visible) return null

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

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
            Mijn account
          </Text>
        </View>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
          {/* Close */}
          <ModalCloseDarkIcon />
        </Pressable>
      </View>

      {/* Modal body */}
      <View style={styles.body}>
        {isManagedByEntra ? (
          <View style={styles.entraNoticeCard}>
            {/* Entra notice */}
            <Text style={styles.entraNoticeText}>Je accountgegevens worden beheerd via Microsoft Entra.</Text>
            <Pressable
              onPress={() => {
                Linking.openURL(entraAccountUrl)
              }}
              style={({ hovered }) => [styles.entraLinkButton, hovered ? styles.entraLinkButtonHovered : undefined]}
            >
              {/* Entra account link */}
              <Text isSemibold style={styles.entraLinkButtonText}>
                Beheer je account in Microsoft
              </Text>
            </Pressable>
          </View>
        ) : null}
        <AccountField
          label="Naam"
          value={name}
          onChangeText={setName}
          inputRef={nameInputRef}
          inputWebStyle={inputWebStyle}
          onPressEdit={() => focusAndSelectAll(nameInputRef, name)}
          secureTextEntry={false}
          isEditable={!isManagedByEntra}
        />
        <AccountField
          label="Email"
          value={email}
          onChangeText={setEmail}
          inputRef={emailInputRef}
          inputWebStyle={inputWebStyle}
          onPressEdit={() => focusAndSelectAll(emailInputRef, email)}
          secureTextEntry={false}
          isEditable={!isManagedByEntra}
        />
        <AccountField
          label="Wachtwoord"
          value={password}
          onChangeText={setPassword}
          inputRef={passwordInputRef}
          inputWebStyle={inputWebStyle}
          onPressEdit={() => focusAndSelectAll(passwordInputRef, password)}
          secureTextEntry
          isEditable={!isManagedByEntra}
        />

        {/* Top actions */}
        <View style={styles.topActionsRow}>
          <Pressable onPress={onLogout} style={({ hovered }) => [styles.secondaryWideButton, hovered ? styles.secondaryWideButtonHovered : undefined]}>
            {/* Logout */}
            <View style={styles.secondaryWideButtonContent}>
              <LogoutIcon size={18} color={colors.textStrong} />
              <Text isSemibold style={styles.secondaryWideButtonText}>
                Uitloggen
              </Text>
            </View>
          </Pressable>

          <Pressable onPress={onDeleteAccount} style={({ hovered }) => [styles.dangerWideButton, hovered ? styles.dangerWideButtonHovered : undefined]}>
            {/* Delete account */}
            <View style={styles.dangerWideButtonContent}>
              <TrashIcon color={colors.selected} size={18} />
              <Text isSemibold style={styles.dangerWideButtonText}>
                Account verwijderen
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
        {!isManagedByEntra ? (
          <Pressable
            onPress={() => onSave({ name, email, password })}
            style={({ hovered }) => [styles.footerPrimaryButton, hovered ? styles.footerPrimaryButtonHovered : undefined]}
          >
            {/* Save */}
            <Text isBold style={styles.footerPrimaryButtonText}>
              Opslaan
            </Text>
          </Pressable>
        ) : null}
      </View>
    </AnimatedOverlayModal>
  )
}

type AccountFieldProps = {
  label: string
  value: string
  onChangeText: (value: string) => void
  inputRef: React.MutableRefObject<TextInput | null>
  inputWebStyle: any
  onPressEdit: () => void
  secureTextEntry: boolean
  isEditable: boolean
}

function AccountField({ label, value, onChangeText, inputRef, inputWebStyle, onPressEdit, secureTextEntry, isEditable }: AccountFieldProps) {
  return (
    <View style={styles.field}>
      {/* Field label */}
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          ref={(value) => {
            inputRef.current = value
          }}
          value={value}
          onChangeText={onChangeText}
          placeholder={`${label}...`}
          placeholderTextColor="#656565"
          secureTextEntry={secureTextEntry}
          editable={isEditable}
          style={[styles.textInput, inputWebStyle]}
        />
        {isEditable ? (
          <Pressable onPress={onPressEdit} style={({ hovered }) => [styles.inputIconButton, hovered ? styles.inputIconButtonHovered : undefined]}>
            {/* Edit icon */}
            <EditActionIcon color="#656565" size={18} />
          </Pressable>
        ) : null}
      </View>
    </View>
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
  entraNoticeCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.pageBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  entraNoticeText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textStrong,
  },
  entraLinkButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entraLinkButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  entraLinkButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
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
    marginTop: 8,
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
    minWidth: 160,
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
    minWidth: 160,
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

