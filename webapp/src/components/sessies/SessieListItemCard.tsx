import React, { useRef } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

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
  dateTimeLabel: string
  coacheeName?: string
  isReport: boolean
  onPress: () => void
  onPressEdit: () => void
  onPressMore: (anchorPoint: { x: number; y: number }) => void
  showCoachee?: boolean
}

export function SessieListItemCard({
  title,
  dateTimeLabel,
  coacheeName,
  isReport,
  onPress,
  onPressEdit,
  onPressMore,
  showCoachee = true,
}: Props) {
  const menuWidth = 220
  const moreButtonRef = useRef<any>(null)

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
      <View style={styles.titleColumn}>
        {/* Session icon */}
        <View style={styles.iconContainer}>
          {isReport ? <StandaardVerslagIcon color={colors.selected} size={20} /> : <MicrophoneSmallIcon color={colors.selected} size={20} />}
        </View>
        {/* Session title */}
        <Text numberOfLines={1} isBold style={styles.title}>
          {title}
        </Text>
      </View>

      {/* Session date and duration */}
      <View style={styles.dateColumn}>
        <Text isBold style={styles.dateTime}>
          {dateTimeLabel}
        </Text>
      </View>

      {/* Coachee */}
      {showCoachee ? (
        <View style={styles.coacheeColumn}>
          <CoacheeAvatarIcon color={colors.selected} size={24} />
          <Text numberOfLines={1} isSemibold style={styles.coacheeName}>
            {coacheeName ?? 'Coachee'}
          </Text>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actionsColumn}>
        <Pressable
          onPress={(event) => {
            ;(event as any)?.stopPropagation?.()
            onPressEdit()
          }}
          style={({ hovered }) => [styles.editButton, webTransitionSmooth, hovered ? styles.editButtonHovered : undefined]}
        >
          {/* Edit action */}
          <View style={styles.editButtonContent}>
            <EditActionIcon color="#656565" size={18} />
            <Text isBold style={styles.editButtonText}>
              Bewerken
            </Text>
          </View>
        </Pressable>
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
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
    height: 72,
  },
  cardHovered: {
    backgroundColor: colors.hoverBackground,
    ...( { boxShadow: '0 10px 24px rgba(0,0,0,0.05)' } as any ),
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
    flex: 1,
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
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.pageBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
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
    height: 32,
    width: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
})

