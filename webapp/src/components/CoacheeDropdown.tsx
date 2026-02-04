import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../theme/colors'
import { webTransitionSmooth } from '../theme/webTransitions'
import { ChevronDownIcon } from './icons/ChevronDownIcon'
import { UserSquareIcon } from './icons/UserSquareIcon'
import { Text } from './Text'

type Props = {
  coacheeName: string
  onPress: () => void
}

export function CoacheeDropdown({ coacheeName, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ hovered }) => [styles.container, webTransitionSmooth, hovered ? styles.containerHovered : undefined]}>
      {/* Coachee dropdown */}
      <View style={styles.leftContent}>
        {/* Coachee icon */}
        <UserSquareIcon color={colors.selected} size={24} />
        {/* Coachee name */}
        <Text numberOfLines={1} style={styles.name}>
          {coacheeName}
        </Text>
      </View>
      {/* Chevron down */}
      <ChevronDownIcon color={colors.text} size={20} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 186,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.pageBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  containerHovered: {
    backgroundColor: colors.hoverBackground,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  name: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
    flex: 1,
  },
})

