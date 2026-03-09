import React, { useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../design/theme/colors'
import { webTransitionSmooth } from '../design/theme/transitions'
import { CoacheeAvatarIcon } from '../icons/CoacheeAvatarIcon'
import { MoreOptionsIcon } from '../icons/MoreOptionsIcon'
import { PopoverMenu } from '../ui/PopoverMenu'
import { TrashIcon } from '../icons/TrashIcon'
import { Text } from '../ui/Text'

type Props = {
  name: string
  onRestore: () => void
  onDelete: () => void
}

export function ArchivedCoacheeCard({ name, onRestore, onDelete }: Props) {
  const menuWidth = 220
  const moreButtonRef = useRef<any>(null)
  const [isMenuVisible, setIsMenuVisible] = useState(false)
  const [menuAnchorPoint, setMenuAnchorPoint] = useState<{ x: number; y: number } | null>(null)

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

  function closeMenu() {
    setIsMenuVisible(false)
    setMenuAnchorPoint(null)
  }

  return (
    <>
      <View style={styles.card}>
        {/* Archived coachee card */}
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
        </View>

        {/* Coachee actions */}
        <View style={styles.actions}>
          <Pressable
            ref={moreButtonRef}
            onPress={(event) => {
              ;(event as any)?.stopPropagation?.()
              setMenuAnchorPoint(getMenuAnchorPointFromEvent(event))
              setIsMenuVisible(true)
            }}
            style={({ hovered }) => [styles.moreButton, webTransitionSmooth, hovered ? styles.moreButtonHovered : undefined]}
          >
            {/* More options */}
            <MoreOptionsIcon color="#656565" size={24} />
          </Pressable>
        </View>
      </View>
      <PopoverMenu
        visible={isMenuVisible}
        anchorPoint={menuAnchorPoint}
        placement="below"
        width={menuWidth}
        estimatedHeight={108}
        items={[
          {
            key: 'delete',
            label: 'Verwijderen',
            icon: <TrashIcon color={colors.selected} size={18} />,
            isDanger: true,
            onPress: () => {
              closeMenu()
              onDelete()
            },
          },
          {
            key: 'restore',
            label: 'Terugzetten',
            onPress: () => {
              closeMenu()
              onRestore()
            },
          },
        ]}
        onClose={closeMenu}
      />
    </>
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
    borderWidth: 1,
    borderColor: colors.border,
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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


