import React, { useRef } from 'react'
import { GestureResponderEvent, Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../theme/colors'
import { webTransitionSmooth } from '../theme/webTransitions'
import { CoacheeAvatarIcon } from './icons/CoacheeAvatarIcon'
import { EditActionIcon } from './icons/EditActionIcon'
import { MoreOptionsIcon } from './icons/MoreOptionsIcon'
import { Text } from './Text'

type Props = {
  name: string
  detailLabel: string
  onPress: () => void
  onPressEdit: () => void
  onPressMore: (anchorPoint: { x: number; y: number }) => void
}

export function CoacheeCard({ name, detailLabel, onPress, onPressEdit, onPressMore }: Props) {
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
      {/* Coachee card */}
      <View style={styles.iconCircle}>
        {/* Coachee icon */}
        <CoacheeAvatarIcon color={colors.selected} size={24} />
      </View>

      {/* Coachee text */}
      <View style={styles.textColumn}>
        {/* Coachee name */}
        <Text isSemibold numberOfLines={1} style={styles.name}>
          {name}
        </Text>
        {/* Coachee detail */}
        <Text style={styles.detail}>{detailLabel}</Text>
      </View>

      {/* Coachee actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={(event) => {
            event?.stopPropagation?.()
            onPressEdit()
          }}
          style={({ hovered }) => [styles.editButton, webTransitionSmooth, hovered ? styles.editButtonHovered : undefined]}
        >
          {/* Edit coachee button */}
          <View style={styles.editButtonContent}>
            {/* Edit icon */}
            <EditActionIcon color="#656565" size={18} />
            {/* Edit label */}
            <Text isBold style={styles.editButtonText}>
              Bewerken
            </Text>
          </View>
        </Pressable>
        <Pressable
          ref={moreButtonRef}
          onPress={(event) => {
            event?.stopPropagation?.()
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
    height: 72,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHovered: {
    backgroundColor: colors.hoverBackground,
    ...( { boxShadow: '0 10px 24px rgba(0,0,0,0.05)' } as any ),
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.pageBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textColumn: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  detail: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  actions: {
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

