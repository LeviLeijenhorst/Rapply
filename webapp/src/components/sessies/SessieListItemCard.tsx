import React, { useRef } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'

import { colors } from '../../theme/colors'
import { webTransitionSmooth } from '../../theme/webTransitions'
import { CoacheeAvatarIcon } from '../icons/CoacheeAvatarIcon'
import { EditActionIcon } from '../icons/EditActionIcon'
import { MicrophoneSmallIcon } from '../icons/MicrophoneSmallIcon'
import { MoreOptionsIcon } from '../icons/MoreOptionsIcon'
import { StandaardVerslagIcon } from '../icons/StandaardVerslagIcon'
import { Text } from '../Text'

type Props = {
  title: string
  dateLabel: string
  timeLabel: string
  durationLabel: string
  coacheeName?: string
  isReport: boolean
  transcriptionStatus?: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  onPress: () => void
  onPressEdit: (anchorPoint: { x: number; y: number }) => void
  onPressMore: (anchorPoint: { x: number; y: number }) => void
  showCoachee?: boolean
}

export function SessieListItemCard({
  title,
  dateLabel,
  timeLabel,
  durationLabel,
  coacheeName,
  isReport,
  transcriptionStatus = 'idle',
  onPress,
  onPressEdit,
  onPressMore,
  showCoachee = true,
}: Props) {
  const { width: windowWidth } = useWindowDimensions()
  const menuWidth = 220
  const moreButtonRef = useRef<any>(null)
  const isTranscriptionActive = transcriptionStatus === 'transcribing' || transcriptionStatus === 'generating'
  const transcriptionLabel = transcriptionStatus === 'transcribing' ? 'Transcript wordt gegenereerd' : 'Verslag wordt gegenereerd'
  const shouldCompactForNarrowView = showCoachee
  const showTranscriptionText = !shouldCompactForNarrowView || windowWidth > 1180
  const showDateTime = !shouldCompactForNarrowView || windowWidth > 1060
  const showCoacheeInfo = showCoachee && windowWidth > 930
  const showEditButton = !shouldCompactForNarrowView || windowWidth > 820

  function getMenuAnchorPointFromEvent(event: any): { x: number; y: number } {
    const rectFromRef = moreButtonRef.current?.getBoundingClientRect?.()
    const rectFromCurrentTarget = event?.currentTarget?.getBoundingClientRect?.()
    const rectFromNativeTarget = event?.nativeEvent?.target?.getBoundingClientRect?.()
    const rect = rectFromRef ?? rectFromCurrentTarget ?? rectFromNativeTarget

    const clientX = event?.nativeEvent?.clientX
    const clientY = event?.nativeEvent?.clientY
    const pageX = event?.nativeEvent?.pageX
    const pageY = event?.nativeEvent?.pageY

    const scrollX = typeof window !== 'undefined' ? window.scrollX : 0
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0

    const xFromPointer = typeof clientX === 'number' ? clientX : typeof pageX === 'number' ? pageX - scrollX : 0
    const yFromPointer = typeof clientY === 'number' ? clientY : typeof pageY === 'number' ? pageY - scrollY : 0

    const x = rect ? rect.right - menuWidth : xFromPointer - menuWidth
    const y = rect ? rect.bottom : yFromPointer
    return { x, y }
  }

  return (
    <Pressable onPress={onPress} style={({ hovered }) => [styles.card, webTransitionSmooth, hovered ? styles.cardHovered : undefined]}>
      {/* Session row */}
      <View style={styles.sessionInfoRow}>
        <View style={styles.titleColumn}>
          {/* Session icon */}
          <View style={styles.iconContainer}>
            {isReport ? <StandaardVerslagIcon color={colors.selected} size={20} /> : <MicrophoneSmallIcon color={colors.selected} size={20} />}
          </View>
          {/* Session title */}
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        </View>

        {isTranscriptionActive ? (
          <View style={[styles.statusColumn, !showTranscriptionText ? styles.statusColumnCompact : undefined]}>
            <View style={styles.transcriptionStatus}>
              <ActivityIndicator size="small" color={colors.selected} />
              {showTranscriptionText ? <Text style={styles.transcriptionStatusText}>{transcriptionLabel}</Text> : null}
            </View>
          </View>
        ) : (
          <View style={styles.statusColumnSpacer} />
        )}

        {/* Session date and duration */}
        {showDateTime ? (
          <View style={styles.dateColumn}>
            <Text style={styles.dateTime}>
              <Text isBold>{dateLabel}</Text>
              {isReport ? null : <Text>{` ${timeLabel}`}</Text>}
            </Text>
            <Text style={styles.duration}>{durationLabel}</Text>
          </View>
        ) : null}
      </View>

      {/* Coachee */}
      {showCoacheeInfo ? (
        <View style={styles.coacheeColumn}>
          <CoacheeAvatarIcon color={colors.selected} size={24} />
          <Text numberOfLines={1} style={styles.coacheeName}>
            {coacheeName ?? 'Coachee'}
          </Text>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actionsColumn}>
        {showEditButton ? (
          <Pressable
            onPress={(event) => {
              ;(event as any)?.stopPropagation?.()
              onPressEdit(getMenuAnchorPointFromEvent(event))
            }}
            style={({ hovered }) => [styles.editButton, webTransitionSmooth, hovered ? styles.editButtonHovered : undefined]}
          >
            {/* Edit action */}
            <View style={styles.editButtonContent}>
              <EditActionIcon color="#656565" size={18} />
              <Text style={styles.editButtonText}>
                Bewerken
              </Text>
            </View>
          </Pressable>
        ) : null}
        <Pressable
          ref={moreButtonRef}
          onPress={(event) => {
            ;(event as any)?.stopPropagation?.()
            onPressMore(getMenuAnchorPointFromEvent(event))
          }}
          style={({ hovered }) => [styles.moreButton, webTransitionSmooth, hovered ? styles.moreButtonHovered : undefined]}
        >
          {/* More options */}
          <MoreOptionsIcon color="#656565" size={24} />
        </Pressable>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    width: '100%',
    height: 80,
  },
  cardHovered: {
    backgroundColor: colors.hoverBackground,
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfoRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    maxWidth: 320,
    minWidth: 0,
    flexShrink: 1,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
    flexShrink: 1,
  },
  statusColumn: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusColumnCompact: {
    flex: 0,
  },
  statusColumnSpacer: {
    flex: 1,
    minWidth: 0,
  },
  transcriptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transcriptionStatusText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  dateColumn: {
    width: 200,
    gap: 4,
  },
  dateTime: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  duration: {
    fontSize: 13,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  coacheeColumn: {
    width: 200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  coacheeName: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
    flex: 1,
  },
  actionsColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.pageBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    justifyContent: 'center',
  },
  editButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  editButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
  },
  moreButton: {
    height: 36,
    width: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
})

