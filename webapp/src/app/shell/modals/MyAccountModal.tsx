import React from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { Modal } from '../../../ui/animated/Modal'
import { colors } from '../../../design/theme/colors'
import { Text } from '../../../ui/Text'
import { ModalCloseDarkIcon } from '../../../icons/ModalCloseDarkIcon'
import { TrashIcon } from '../../../icons/TrashIcon'
import { MijnAccountIcon } from '../../../icons/MijnAccountIcon'
import { LogoutIcon } from '../../../icons/LogoutIcon'

type Props = {
  visible: boolean
  accountName?: string | null
  accountEmail?: string | null
  onClose: () => void
  onLogout: () => void
  onDeleteAccount: () => void
  isDeleteAccountBusy?: boolean
}

// Renders the account modal with recovery-key, logout, and delete-account actions.
export function MyAccountModal({
  visible,
  accountName = null,
  accountEmail = null,
  onClose,
  onLogout,
  onDeleteAccount,
  isDeleteAccountBusy = false,
}: Props) {
  const accountIdentity = accountName?.trim() || accountEmail?.trim() || 'Onbekend account'

  if (!visible) return null

  return (
    <Modal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
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
        <View style={styles.accountCard}>
          <Text isSemibold style={styles.accountTitle}>
            Ingelogd als
          </Text>
          <Text isBold style={styles.accountIdentity}>
            {accountIdentity}
          </Text>
          {accountName && accountEmail ? <Text style={styles.accountEmail}>{accountEmail}</Text> : null}
        </View>

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
            style={({ hovered }) => [styles.dangerWideButton, hovered ? styles.dangerWideButtonHovered : undefined, isDeleteAccountBusy ? styles.actionButtonDisabled : undefined]}
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
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 920,
    maxWidth: '90vw',
    maxHeight: '90vh',
    backgroundColor: colors.surface,
    borderRadius: 16,
    ...( { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } as any ),
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
  accountCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.pageBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
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
  actionButtonDisabled: {
    opacity: 0.6,
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

