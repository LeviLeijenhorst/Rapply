import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../theme/colors'
import { webTransitionSmooth } from '../theme/webTransitions'
import { CoacheeAvatarIcon } from './icons/CoacheeAvatarIcon'
import { TrashIcon } from './icons/TrashIcon'
import { Text } from './Text'
import { IconNumber } from './IconNumber'

type Props = {
  name: string
  onRestore: () => void
  onDelete: () => void
}

export function ArchivedCoacheeCard({ name, onRestore, onDelete }: Props) {
  return (
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
        <Pressable onPress={onRestore} style={({ hovered }) => [styles.restoreButton, webTransitionSmooth, hovered ? styles.restoreButtonHovered : undefined]}>
          {/* Restore coachee */}
          <View style={styles.restoreButtonContent}>
            <IconNumber value={1} />
            <Text isBold style={styles.restoreButtonText}>
              Terugzetten
            </Text>
          </View>
        </Pressable>
        <Pressable onPress={onDelete} style={({ hovered }) => [styles.deleteButton, webTransitionSmooth, hovered ? styles.deleteButtonHovered : undefined]}>
          {/* Delete coachee */}
          <TrashIcon color={colors.selected} size={20} />
        </Pressable>
      </View>
    </View>
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
  restoreButton: {
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.pageBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    justifyContent: 'center',
  },
  restoreButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  restoreButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  restoreButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
  },
  deleteButton: {
    height: 32,
    width: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
})

