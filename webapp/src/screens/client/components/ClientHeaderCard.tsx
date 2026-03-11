import React from 'react'
import { Image, Pressable, StyleSheet, View } from 'react-native'

import { ClientPageRapportageIcon } from '@/icons/ClientPageSvgIcons'
import { MoreOptionsIcon } from '@/icons/MoreOptionsIcon'
import { PlusIcon } from '@/icons/PlusIcon'
import { colors } from '@/design/theme/colors'
import { webTransitionSmooth } from '@/design/theme/transitions'
import { Text } from '@/ui/Text'

type Props = {
  clientEmail: string
  clientName: string
  clientPhone: string
  durationLabel: string
  isCreateSessionDisabled: boolean
  reportCount: number
  sessionCount: number
  trajectoryName: string
  onOpenEditClient: () => void
  onPressCreateReports: () => void
  onPressCreateSession: () => void
}

export function ClientHeaderCard({
  clientEmail,
  clientName,
  clientPhone,
  durationLabel,
  isCreateSessionDisabled,
  reportCount,
  sessionCount,
  trajectoryName,
  onOpenEditClient,
  onPressCreateReports,
  onPressCreateSession,
}: Props) {
  return (
    <View style={styles.profileCard}>
      <View style={styles.profileCardTopRow}>
        <View style={styles.profileIdentityRow}>
          <View style={styles.profileAvatarCircle}>
            <Image source={require('../../../../assets/over_ons-Jonas.jpg')} style={styles.profileAvatarImage} resizeMode="cover" />
          </View>
          <View style={styles.profileTitleStack}>
            <View style={styles.profileNameRow}>
              <Text isSemibold style={styles.profileName}>
                {clientName}
              </Text>
              <Pressable
                onPress={onOpenEditClient}
                style={({ hovered }) => [styles.profileSettingsButton, hovered ? styles.profileSettingsButtonHovered : undefined]}
              >
                <MoreOptionsIcon color="#93858D" size={18} />
              </Pressable>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusBadgeDot} />
              <Text isSemibold style={styles.statusBadgeText}>
                Actief
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.profileActions}>
          <Pressable
            disabled={isCreateSessionDisabled}
            style={({ hovered }) => [
              styles.newSessionButton,
              webTransitionSmooth,
              isCreateSessionDisabled ? styles.newSessionButtonDisabled : undefined,
              hovered && !isCreateSessionDisabled ? styles.newSessionButtonHovered : undefined,
            ]}
            onPress={onPressCreateSession}
          >
            <PlusIcon color="#FFFFFF" size={22} />
            <Text numberOfLines={1} style={styles.newSessionButtonText}>
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
      <View style={styles.profileMetaGrid}>
        <View style={styles.profileMetaItem}>
          <Text style={styles.profileMetaLabel}>Email</Text>
          <Text isSemibold style={styles.profileMetaValue}>
            {clientEmail}
          </Text>
        </View>
        <View style={styles.profileMetaItem}>
          <Text style={styles.profileMetaLabel}>Traject</Text>
          <Text isSemibold style={styles.profileMetaValue}>
            {trajectoryName}
          </Text>
        </View>
        <View style={styles.profileMetaItem}>
          <Text style={styles.profileMetaLabel}>Sessies</Text>
          <Text isSemibold style={styles.profileMetaValue}>
            {`${sessionCount} sessies`}
          </Text>
        </View>
        <View style={styles.profileMetaItem}>
          <Text style={styles.profileMetaLabel}>Looptijd</Text>
          <Text isSemibold style={styles.profileMetaValue}>
            {durationLabel}
          </Text>
        </View>
        <View style={styles.profileMetaItem}>
          <Text style={styles.profileMetaLabel}>Telefoon</Text>
          <Text isSemibold style={styles.profileMetaValue}>
            {clientPhone}
          </Text>
        </View>
        <View style={styles.profileMetaItem}>
          <Text style={styles.profileMetaLabel}>Rapportages</Text>
          <Text isSemibold style={styles.profileMetaValue}>
            {`${reportCount} rapportages`}
          </Text>
        </View>
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    ...({ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } as any),
  },
  profileCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  profileIdentityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, minWidth: 0, flex: 1 },
  profileAvatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: '#DADBDD',
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatarImage: { width: '100%', height: '100%' },
  profileTitleStack: { minWidth: 0, gap: 6 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileName: { fontSize: 32, lineHeight: 44, color: '#2C111F', flexShrink: 1 },
  profileSettingsButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...({ cursor: 'pointer' } as any),
  },
  profileSettingsButtonHovered: { backgroundColor: '#F3F4F6' },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#C9FFD9',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  statusBadgeDot: { width: 4, height: 4, borderRadius: 999, backgroundColor: '#0C8043' },
  statusBadgeText: { fontSize: 12, lineHeight: 14, color: '#0C8043' },
  profileActions: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  profileMetaGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 18, columnGap: 24, paddingLeft: 104 },
  profileMetaItem: { flexBasis: '30%', maxWidth: '30%', minWidth: 180 },
  profileMetaLabel: { fontSize: 16, lineHeight: 20, color: 'rgba(44,17,31,0.5)' },
  profileMetaValue: { marginTop: 4, fontSize: 16, lineHeight: 20, color: '#2C111F' },
  newSessionButton: {
    minWidth: 203,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.selected,
    borderWidth: 1,
    borderColor: colors.selected,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  newSessionButtonHovered: { backgroundColor: '#A50058' },
  newSessionButtonDisabled: { backgroundColor: '#C6C6C6', borderColor: '#C6C6C6' },
  newSessionButtonText: { fontSize: 16, lineHeight: 20, color: '#FFFFFF' },
  newReportButton: {
    minWidth: 204,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D2D2D2',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  newReportButtonIcon: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  newReportButtonHovered: { backgroundColor: colors.hoverBackground },
  newReportButtonText: { fontSize: 16, lineHeight: 20, color: '#2C111F' },
})
