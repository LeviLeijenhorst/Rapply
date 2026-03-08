import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../design/theme/colors'
import { Text } from '../ui/Text'
import { WebPortal } from '../ui/WebPortal'
import { ArchiveIcon } from '../icons/ArchiveIcon'
import { TrashIcon } from '../icons/TrashIcon'

type AnchorPoint = {
  x: number
  y: number
}

type Props = {
  visible: boolean
  anchorPoint: AnchorPoint | null
  onClose: () => void
  onArchive: () => void
  onDelete: () => void
}

export function CoacheeEditMenu({ visible, anchorPoint, onClose, onArchive, onDelete }: Props) {
  if (!visible || !anchorPoint) return null

  const menuWidth = 220
  const padding = 12
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800

  const estimatedMenuHeight = 44 * 2 + 1 + 4 * 2 + 8

  const left = Math.min(Math.max(padding, anchorPoint.x), Math.max(padding, viewportWidth - menuWidth - padding))
  const top = Math.min(Math.max(padding, anchorPoint.y + 6), Math.max(padding, viewportHeight - estimatedMenuHeight - padding))

  return (
    <WebPortal>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={[styles.menu, { left, top } as any]}>
          <Pressable onPress={onArchive} style={({ hovered }) => [styles.row, hovered ? styles.rowHovered : undefined]}>
            {/* Archive */}
            <Text isSemibold style={styles.rowText}>
              Archiveren
            </Text>
            <ArchiveIcon color="#656565" size={18} />
          </Pressable>

          <Pressable onPress={onDelete} style={({ hovered }) => [styles.row, hovered ? styles.rowHovered : undefined]}>
            {/* Delete */}
            <Text isSemibold style={styles.rowTextDanger}>
              Verwijderen
            </Text>
            <TrashIcon color={colors.selected} size={18} />
          </Pressable>
        </View>
      </View>
    </WebPortal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...( { position: 'fixed', inset: 0, zIndex: 9999 } as any ),
  },
  backdrop: {
    ...( { position: 'absolute', inset: 0 } as any ),
  },
  menu: {
    ...( { position: 'absolute', boxShadow: '0 20px 60px rgba(0,0,0,0.16)' } as any ),
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    padding: 4,
  },
  row: {
    height: 44,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowHovered: {
    backgroundColor: colors.hoverBackground,
  },
  rowText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
  },
  rowTextDanger: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.selected,
  },
})


