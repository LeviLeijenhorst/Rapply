import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../design/theme/colors'
import { webTransitionSmooth } from '../design/theme/transitions'
import { MicrophoneSmallIcon } from '../icons/MicrophoneSmallIcon'
import { Text } from '../ui/Text'

type Props = {
  title: string
  timeLabel: string
  durationLabel: string
  onPress: () => void
}

export function ConversationCard({ title, timeLabel, durationLabel, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ hovered }) => [styles.card, webTransitionSmooth, hovered ? styles.cardHovered : undefined]}>
      {/* Conversation card */}
      <View style={styles.iconCircle}>
        {/* Conversation icon */}
        <MicrophoneSmallIcon color={colors.selected} size={20} />
      </View>

      {/* Conversation text */}
      <View style={styles.textColumn}>
        {/* Title row */}
        <View style={styles.titleRow}>
          {/* Conversation title */}
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          {/* Conversation time */}
          <Text isBold style={styles.date}>
            {timeLabel}
          </Text>
        </View>
        {/* Duration */}
        <Text style={styles.duration}>{durationLabel}</Text>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
    flex: 1,
  },
  date: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  duration: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
})


