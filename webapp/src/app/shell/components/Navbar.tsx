import React from 'react'
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'

import { radius } from '../../../design/tokens/radius'
import { spacing } from '../../../design/tokens/spacing'
import { colors } from '../../../design/theme/colors'
import { typography } from '../../../design/theme/typography'
import { CoachscribeLogo } from '../../../components/brand/CoachscribeLogo'
import { Text } from '../../../ui/Text'
import { UsageIndicator } from './UsageIndicator'
import { ClientPageMicrophoneIcon, ClientPageRapportageIcon } from '../../../icons/ClientPageSvgIcons'
import { ChevronLeftIcon } from '../../../icons/ChevronLeftIcon'

type Props = {
  usedMinutes: number
  totalMinutes: number
  isUsageLoading?: boolean
  isUsageClickable?: boolean
  onPressUsage?: () => void
  breadcrumbItems?: Array<{ label: string; onPress: () => void }>
  onPressNieuweRapportage?: () => void
  isNieuweRapportageDisabled?: boolean
  onPressRecord?: () => void
  isRecordDisabled?: boolean
}

// Demo-only toggle. Set to false to restore the minutes widget.
const HIDE_USAGE_WIDGET_FOR_DEMO = true
const NEW_REPORT_BREADCRUMB_LABEL = 'Nieuwe rapportage'

function getDisplayBreadcrumbLabel(label: string): string {
  if (label === 'Rapportage controleren') return NEW_REPORT_BREADCRUMB_LABEL
  const normalized = String(label || '').trim().toLowerCase()
  if (normalized === 'clienten' || normalized === 'cli\u00ebnten') return 'Clienten'
  return label
}

export function Navbar({
  usedMinutes,
  totalMinutes,
  isUsageLoading = false,
  isUsageClickable = false,
  onPressUsage,
  breadcrumbItems = [],
  onPressNieuweRapportage,
  isNieuweRapportageDisabled = false,
  onPressRecord,
  isRecordDisabled = false,
}: Props) {
  const { width } = useWindowDimensions()
  const hideUsage = width < 600 || HIDE_USAGE_WIDGET_FOR_DEMO
  const shouldShowClientActions = !!onPressNieuweRapportage && !!onPressRecord

  return (
    <View style={styles.container}>
      {/* Navbar area above sidebar */}
      <View style={styles.leftArea}>
        {/* Coachscribe logo */}
        <CoachscribeLogo />
      </View>

      {/* Navbar area to the right of the sidebar */}
      <View style={styles.rightArea}>
        {breadcrumbItems.length >= 2 ? (
          <View style={styles.breadcrumbsRow}>
            {breadcrumbItems.map((item, index) => (
              <View key={`${item.label}-${index}`} style={styles.breadcrumbItem}>
                {index > 0 ? (
                  <View style={styles.breadcrumbChevron}>
                    <ChevronLeftIcon color={colors.textSecondary} size={14} />
                  </View>
                ) : null}
                <Pressable onPress={item.onPress} style={({ hovered }) => [styles.breadcrumbPressable, hovered ? styles.breadcrumbPressableHovered : undefined]}>
                  <Text style={[styles.breadcrumbText, index === breadcrumbItems.length - 1 ? styles.breadcrumbTextActive : styles.breadcrumbTextInactive]}>
                    {getDisplayBreadcrumbLabel(item.label)}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : <View style={styles.breadcrumbsSpacer} />}

        {/* Right actions */}
        <View style={styles.rightActions}>
          {shouldShowClientActions ? (
            <>
              <Pressable
                disabled={isNieuweRapportageDisabled}
                onPress={onPressNieuweRapportage}
                style={({ hovered }) => [
                  styles.secondaryButton,
                  isNieuweRapportageDisabled ? styles.secondaryButtonDisabled : undefined,
                  hovered && !isNieuweRapportageDisabled ? styles.secondaryButtonHovered : undefined,
                ]}
              >
                <ClientPageRapportageIcon color="#2C111F" size={18} />
                <Text style={styles.secondaryButtonText}>Nieuwe rapportage</Text>
              </Pressable>
              <Pressable
                disabled={isRecordDisabled}
                onPress={onPressRecord}
                style={({ hovered }) => [
                  styles.primaryButton,
                  isRecordDisabled ? styles.primaryButtonDisabled : undefined,
                  hovered && !isRecordDisabled ? styles.primaryButtonHovered : undefined,
                ]}
              >
                <ClientPageMicrophoneIcon size={18} />
                <Text style={styles.primaryButtonText}>Nieuwe input</Text>
              </Pressable>
            </>
          ) : null}
          {/* Usage indicator */}
          {!hideUsage ? (
            <Pressable
              onPress={() => {
                if (!isUsageClickable) return
                onPressUsage?.()
              }}
              disabled={!isUsageClickable}
              style={({ hovered }) => [styles.usageContainer, isUsageClickable && hovered ? styles.usageContainerHovered : undefined]}
            >
              <UsageIndicator usedMinutes={usedMinutes} totalMinutes={totalMinutes} isLoading={isUsageLoading} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 72,
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftArea: {
    width: 256,
    height: '100%',
    paddingTop: spacing.lg,
    paddingRight: spacing.lg,
    paddingBottom: spacing.lg,
    paddingLeft: 32,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  rightArea: {
    flex: 1,
    height: '100%',
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  breadcrumbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    flex: 1,
  },
  breadcrumbsSpacer: {
    flex: 1,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  breadcrumbChevron: {
    transform: [{ rotate: '180deg' }],
  },
  breadcrumbPressable: {
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  breadcrumbPressableHovered: {
    backgroundColor: colors.hoverBackground,
  },
  breadcrumbText: {
    fontSize: 16,
    lineHeight: 20,
  },
  breadcrumbTextInactive: {
    color: '#93858D',
    fontFamily: typography.fontFamilyMedium,
  },
  breadcrumbTextActive: {
    color: '#2C111F',
    fontFamily: typography.fontFamilySemibold,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 0,
  },
  secondaryButton: {
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#D2D2D2',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  primaryButton: {
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.selected,
    borderWidth: 1,
    borderColor: colors.selected,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonHovered: {
    backgroundColor: '#A50058',
    borderColor: '#A50058',
  },
  primaryButtonDisabled: {
    backgroundColor: '#C6C6C6',
    borderColor: '#C6C6C6',
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  usageContainer: {
    borderRadius: radius.sm,
  },
  usageContainerHovered: {
    opacity: 0.9,
  },
})
