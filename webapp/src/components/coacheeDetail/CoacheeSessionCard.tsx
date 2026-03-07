import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../../design/theme/colors'
import { EditActionIcon } from '../../icons/EditActionIcon'
import { MicrophoneSmallIcon } from '../../icons/MicrophoneSmallIcon'
import { MoreOptionsIcon } from '../../icons/MoreOptionsIcon'
import { StandaardVerslagIcon } from '../../icons/StandaardVerslagIcon'
import { Text } from '../../ui/Text'

type Props = {
  title: string
  dateTimeLabel: string
  isReport: boolean
  onPress: () => void
}

export function CoacheeSessionCard({ title, dateTimeLabel, isReport, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ hovered }) => [styles.card, hovered ? styles.cardHovered : undefined]}>
      {/* Session card */}
      <View style={styles.iconCircle}>
        {/* Session icon */}
        {isReport ? <StandaardVerslagIcon color={colors.selected} size={20} /> : <MicrophoneSmallIcon color={colors.selected} size={20} />}
      </View>

      {/* Session text */}
      <View style={styles.textColumn}>
        {/* Title row */}
        <View style={styles.titleRow}>
          {/* Session title */}
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        </View>
      </View>

      {/* Session date and time */}
      <View style={styles.dateTimeContainer}>
        <Text isBold style={styles.dateTime}>
          {dateTimeLabel}
        </Text>
      </View>

      {/* Session actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={(event) => {
            ;(event as any)?.stopPropagation?.()
          }}
          style={({ hovered }) => [styles.editButton, hovered ? styles.editButtonHovered : undefined]}
        >
          {/* Edit session button */}
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
          onPress={(event) => {
            ;(event as any)?.stopPropagation?.()
          }}
          style={({ hovered }) => [styles.moreButton, hovered ? styles.moreButtonHovered : undefined]}
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
    paddingRight: 16,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
    flex: 1,
  },
  dateTimeContainer: {
    minWidth: 160,
    alignSelf: 'stretch',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 16,
  },
  dateTime: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
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


