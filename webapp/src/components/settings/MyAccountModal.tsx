import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { colors } from '../../theme/colors'
import { Text } from '../Text'
import { ModalCloseDarkIcon } from '../icons/ModalCloseDarkIcon'
import { TrashIcon } from '../icons/TrashIcon'
import { MijnAccountIcon } from '../icons/MijnAccountIcon'
import { LogoutIcon } from '../icons/LogoutIcon'
import { useE2ee } from '../../e2ee/E2eeProvider'

type Props = {
  visible: boolean
  onClose: () => void
  onLogout: () => void
  onDeleteAccount: () => void
  isDeleteAccountBusy?: boolean
}

// Renders the account modal with recovery-key, logout, and delete-account actions.
export function MyAccountModal({
  visible,
  onClose,
  onLogout,
  onDeleteAccount,
  isDeleteAccountBusy = false,
}: Props) {
  const e2ee = useE2ee()
  const [e2eeStatus, setE2eeStatus] = useState<string | null>(null)
  const [rotatedRecoveryKey, setRotatedRecoveryKey] = useState<string | null>(null)
  const [isE2eeBusy, setIsE2eeBusy] = useState(false)

  useEffect(() => {
    if (!visible) return
    setE2eeStatus(null)
    setRotatedRecoveryKey(null)
    setIsE2eeBusy(false)
  }, [visible])

  if (!visible) return null

  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconCircle}>
            <MijnAccountIcon />
          </View>
          <Text isBold style={styles.headerTitle}>
            Mijn account
          </Text>
        </View>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
          <ModalCloseDarkIcon />
        </Pressable>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.e2eeCard}>
          <Text isSemibold style={styles.e2eeTitle}>
            End-to-end encryptie
          </Text>
          <Text style={styles.e2eeText}>
            {e2ee.isConfigured
              ? e2ee.isEnabled
                ? 'End-to-end encryptie staat aan voor deze browser.'
                : 'End-to-end encryptie staat uit voor deze browser.'
              : 'End-to-end encryptie staat nog uit voor dit account.'}
          </Text>
          <Pressable
            onPress={() => {
              if (isE2eeBusy) return
              setIsE2eeBusy(true)
              setE2eeStatus(null)
              void e2ee
                .setEnabled(!e2ee.isEnabled)
                .then(() => {
                  setE2eeStatus(e2ee.isEnabled ? 'End-to-end encryptie is uitgezet voor dit account.' : 'Stel nu je passphrase in om end-to-end encryptie te activeren.')
                })
                .catch((error) => setE2eeStatus(error instanceof Error ? error.message : 'Aanpassen van end-to-end encryptie mislukt'))
                .finally(() => setIsE2eeBusy(false))
            }}
            style={({ hovered }) => [styles.e2eeButton, hovered ? styles.e2eeButtonHovered : undefined, isE2eeBusy ? styles.e2eeButtonDisabled : undefined]}
            disabled={isE2eeBusy}
          >
            <Text isBold style={styles.e2eeButtonText}>
              {!e2ee.isConfigured ? 'End-to-end encryptie aanzetten' : e2ee.isEnabled ? 'End-to-end encryptie uitzetten' : 'End-to-end encryptie aanzetten'}
            </Text>
          </Pressable>
        </View>

        {e2ee.isEnabled ? (
          <View style={styles.e2eeCard}>
            <Text isSemibold style={styles.e2eeTitle}>
              CoachScribe-code
            </Text>
            <Text style={styles.e2eeText}>
              Je CoachScribe-code is nodig om toegang te krijgen tot je data op andere apparaten of een andere browser. Bewaar hem op een veilige plek.
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
                  link.download = 'coachscribe-CoachScribe-code.txt'
                  document.body.appendChild(link)
                  link.click()
                  link.remove()
                  URL.revokeObjectURL(url)
                })
                .catch((error) => setE2eeStatus(error instanceof Error ? error.message : 'CoachScribe-code roteren mislukt'))
                .finally(() => setIsE2eeBusy(false))
            }}
            style={({ hovered }) => [styles.e2eeButton, hovered ? styles.e2eeButtonHovered : undefined, isE2eeBusy ? styles.e2eeButtonDisabled : undefined]}
            disabled={isE2eeBusy}
          >
            <Text isBold style={styles.e2eeButtonText}>
              Nieuwe CoachScribe-code maken
            </Text>
          </Pressable>
          </View>
        ) : null}

        {e2eeStatus ? <Text style={styles.e2eeStatusText}>{e2eeStatus}</Text> : null}

        <View style={styles.topActionsRow}>
          <Pressable onPress={onLogout} style={({ hovered }) => [styles.secondaryWideButton, hovered ? styles.secondaryWideButtonHovered : undefined]}>
            <View style={styles.secondaryWideButtonContent}>
              <LogoutIcon size={18} color={colors.textStrong} />
              <Text isSemibold style={styles.secondaryWideButtonText}>
                Uitloggen
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={onDeleteAccount}
            style={({ hovered }) => [styles.dangerWideButton, hovered ? styles.dangerWideButtonHovered : undefined, isDeleteAccountBusy ? styles.e2eeButtonDisabled : undefined]}
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
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.footerSecondaryButton, hovered ? styles.footerSecondaryButtonHovered : undefined]}>
          <Text isBold style={styles.footerSecondaryButtonText}>
            Annuleren
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
    maxHeight: '90vh',
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
  },
  iconButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  body: {
    width: '100%',
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  bodyContent: {
    padding: 24,
    gap: 16,
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
  e2eeStatusText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.selected,
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerSecondaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomLeftRadius: 16,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
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
})
