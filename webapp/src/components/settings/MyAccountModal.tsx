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
import { useE2ee } from '../../e2ee/E2eeProvider'
import { e2eeApprovePairing, e2eeListDevices, e2eeRevokeDevice } from '../../services/e2ee'

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
  const e2ee = useE2ee()
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [devices, setDevices] = useState<
    { deviceId: string; publicKeyJwk: JsonWebKey; pairingExpiresAtMs: number | null; approvedAtMs: number | null; revokedAtMs: number | null; createdAtMs: number }[]
  >([])
  const [e2eeStatus, setE2eeStatus] = useState<string | null>(null)
  const [rotatedRecoveryKey, setRotatedRecoveryKey] = useState<string | null>(null)
  const [isE2eeBusy, setIsE2eeBusy] = useState(false)

  const nameInputRef = useRef<TextInput | null>(null)
  const emailInputRef = useRef<TextInput | null>(null)
  const passwordInputRef = useRef<TextInput | null>(null)

  useEffect(() => {
    if (!visible) return
    setName(initialName)
    setEmail(initialEmail)
    setPassword(isManagedByEntra ? '********' : 'password')
    setE2eeStatus(null)
    setRotatedRecoveryKey(null)
    setIsE2eeBusy(false)

    void e2eeListDevices()
      .then((result) => setDevices(result.devices))
      .catch((error) => {
        console.error('[MyAccountModal] Failed to load devices', error)
        setDevices([])
      })
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

        {/* Recovery key */}
        <View style={styles.e2eeCard}>
          {/* Recovery key */}
          <Text isSemibold style={styles.e2eeTitle}>
            Herstelcode
          </Text>
          <Text style={styles.e2eeText}>
            Met de herstelcode kun je je versleutelde data terugkrijgen als je al je apparaten kwijtraakt. Bewaar hem op een veilige plek.
          </Text>
          {rotatedRecoveryKey ? (
            <View style={styles.e2eeCodeBox}>
              <Text isSemibold style={styles.e2eeCodeText}>
                {rotatedRecoveryKey}
              </Text>
            </View>
          ) : null}
          <Pressable
            onPress={() => {
              if (isE2eeBusy) return
              setIsE2eeBusy(true)
              setE2eeStatus(null)
              void e2ee
                .rotateRecoveryKey()
                .then((key) => {
                  setRotatedRecoveryKey(key)
                  const blob = new Blob([`${key}\n`], { type: 'text/plain;charset=utf-8' })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = 'coachscribe-herstelcode.txt'
                  document.body.appendChild(link)
                  link.click()
                  link.remove()
                  URL.revokeObjectURL(url)
                })
                .catch((error) => setE2eeStatus(error instanceof Error ? error.message : 'Herstelcode roteren mislukt'))
                .finally(() => setIsE2eeBusy(false))
            }}
            style={({ hovered }) => [styles.e2eeButton, hovered ? styles.e2eeButtonHovered : undefined, isE2eeBusy ? styles.e2eeButtonDisabled : undefined]}
            disabled={isE2eeBusy}
          >
            <Text isBold style={styles.e2eeButtonText}>
              Nieuwe herstelcode maken
            </Text>
          </Pressable>
        </View>

        {/* Devices */}
        <View style={styles.e2eeCard}>
          {/* Devices */}
          <Text isSemibold style={styles.e2eeTitle}>
            Apparaten
          </Text>
          {devices
            .filter((device) => !device.revokedAtMs)
            .map((device) => {
              const now = Date.now()
              const canApprove = device.approvedAtMs === null && typeof device.pairingExpiresAtMs === 'number' && device.pairingExpiresAtMs > now
              return (
                <View key={device.deviceId} style={styles.deviceRow}>
                  {/* Device info */}
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceIdText}>{device.deviceId}</Text>
                    <Text style={styles.deviceMetaText}>{device.approvedAtMs ? 'Goedgekeurd' : canApprove ? 'Wacht op goedkeuring' : 'Niet gekoppeld'}</Text>
                  </View>
                  {canApprove ? (
                    <Pressable
                      onPress={() => {
                        if (isE2eeBusy) return
                        setIsE2eeBusy(true)
                        setE2eeStatus(null)
                        void e2ee
                          .wrapUserDataKeyForDevicePublicKeyJwk(device.publicKeyJwk)
                          .then((wrapped) => e2eeApprovePairing({ deviceId: device.deviceId, wrappedUserDataKeyForDevice: wrapped }))
                          .then(() => e2eeListDevices().then((result) => setDevices(result.devices)))
                          .catch((error) => setE2eeStatus(error instanceof Error ? error.message : 'Goedkeuren mislukt'))
                          .finally(() => setIsE2eeBusy(false))
                      }}
                      style={({ hovered }) => [styles.smallPrimaryButton, hovered ? styles.smallPrimaryButtonHovered : undefined, isE2eeBusy ? styles.e2eeButtonDisabled : undefined]}
                      disabled={isE2eeBusy}
                    >
                      <Text isBold style={styles.smallPrimaryButtonText}>Goedkeuren</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => {
                        if (isE2eeBusy) return
                        setIsE2eeBusy(true)
                        setE2eeStatus(null)
                        void e2eeRevokeDevice({ deviceId: device.deviceId })
                          .then(() => e2eeListDevices().then((result) => setDevices(result.devices)))
                          .catch((error) => setE2eeStatus(error instanceof Error ? error.message : 'Intrekken mislukt'))
                          .finally(() => setIsE2eeBusy(false))
                      }}
                      style={({ hovered }) => [styles.smallSecondaryButton, hovered ? styles.smallSecondaryButtonHovered : undefined, isE2eeBusy ? styles.e2eeButtonDisabled : undefined]}
                      disabled={isE2eeBusy}
                    >
                      <Text isBold style={styles.smallSecondaryButtonText}>Intrekken</Text>
                    </Pressable>
                  )}
                </View>
              )
            })}
          {e2eeStatus ? <Text style={styles.e2eeStatusText}>{e2eeStatus}</Text> : null}
        </View>

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
  e2eeCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.pageBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  e2eeTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  e2eeText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  e2eeCodeBox: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  e2eeCodeText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textStrong,
  },
  e2eeButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  e2eeButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  e2eeButtonDisabled: {
    opacity: 0.6,
  },
  e2eeButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  deviceRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  deviceInfo: {
    flex: 1,
    gap: 4,
  },
  deviceIdText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textStrong,
  },
  deviceMetaText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
  },
  smallPrimaryButton: {
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.selected,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallPrimaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  smallPrimaryButtonText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  smallSecondaryButton: {
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallSecondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  smallSecondaryButtonText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textStrong,
  },
  e2eeStatusText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.selected,
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

