import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { ClientPageRapportageIcon } from '@/icons/ClientPageSvgIcons'
import { MoreOptionsIcon } from '@/icons/MoreOptionsIcon'
import { PlusIcon } from '@/icons/PlusIcon'
import { colors } from '@/design/theme/colors'
import { webTransitionSmooth } from '@/design/theme/transitions'
import { Text } from '@/ui/Text'

type Props = {
  clientName: string
  isCreateInputDisabled: boolean
  sessionCount: number
  onOpenClientInfo: () => void
  onPressCreateReports: () => void
  onPressCreateInput: () => void
}

export function ClientHeaderCard({
  clientName,
  isCreateInputDisabled,
  sessionCount,
  onOpenClientInfo,
  onPressCreateReports,
  onPressCreateInput,
}: Props) {
  return (
    <View style={styles.profileCard}>
      <View style={styles.profileCardTopRow}>
        <View style={styles.profileIdentityRow}>
          <View style={styles.profileTitleStack}>
            <View style={styles.profileNameRow}>
              <Text isSemibold style={styles.profileName}>
                {clientName}
              </Text>
              <Pressable
                onPress={onOpenClientInfo}
                style={({ hovered }) => [styles.profileSettingsButton, hovered ? styles.profileSettingsButtonHovered : undefined]}
              >
                <MoreOptionsIcon color="#93858D" size={18} />
              </Pressable>
            </View>
          </View>
        </View>
        <View style={styles.profileActions}>
          <Pressable
            disabled={isCreateInputDisabled}
            style={({ hovered }) => [
              styles.newInputButton,
              webTransitionSmooth,
              isCreateInputDisabled ? styles.newInputButtonDisabled : undefined,
              hovered && !isCreateInputDisabled ? styles.newInputButtonHovered : undefined,
            ]}
            onPress={onPressCreateInput}
          >
            <PlusIcon color="#FFFFFF" size={22} />
            <Text numberOfLines={1} style={styles.newInputButtonText}>
              Nieuwe input
            </Text>
          </Pressable>
          <Pressable
            style={({ hovered }) => [styles.newReportButton, hovered ? styles.newReportButtonHovered : undefined]}
            onPress={onPressCreateReports}
          >
            <View style={styles.newReportButtonIcon}>
              <ClientPageRapportageIcon color={colors.text} size={18} />
            </View>
            <Text numberOfLines={1} style={styles.newReportButtonText}>
              Genereer rapportage
            </Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.profileSessionMeta}>
        <Text style={styles.profileMetaLabel}>Sessies</Text>
        <Text isSemibold style={styles.profileMetaValue}>
          {`${sessionCount} sessies`}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 0,
    position: 'relative',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    ...({ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } as any),
  },
  profileCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  profileIdentityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 },
  profileTitleStack: { minWidth: 0, gap: 0 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileName: { fontSize: 28, lineHeight: 36, color: '#2C111F', flexShrink: 1 },
  profileSettingsButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...({ cursor: 'pointer' } as any),
  },
  profileSettingsButtonHovered: { backgroundColor: '#F3F4F6' },
  profileActions: { flexDirection: 'column', alignItems: 'stretch', gap: 8, marginTop: 0 },
  profileSessionMeta: { position: 'absolute', left: 18, bottom: 18 },
  profileMetaLabel: { fontSize: 13, lineHeight: 15, color: 'rgba(44,17,31,0.5)' },
  profileMetaValue: { marginTop: 0, fontSize: 13, lineHeight: 15, color: '#2C111F' },
  newInputButton: {
    minWidth: 184,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.selected,
    borderWidth: 1,
    borderColor: colors.selected,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  newInputButtonHovered: { backgroundColor: '#A50058' },
  newInputButtonDisabled: { backgroundColor: '#C6C6C6', borderColor: '#C6C6C6' },
  newInputButtonText: { fontSize: 16, lineHeight: 20, color: '#FFFFFF' },
  newReportButton: {
    minWidth: 184,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D2D2D2',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  newReportButtonIcon: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  newReportButtonHovered: { backgroundColor: colors.hoverBackground },
  newReportButtonText: { fontSize: 16, lineHeight: 20, color: '#2C111F' },
})








