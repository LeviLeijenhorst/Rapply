import React from 'react'
import { Pressable, StyleSheet } from 'react-native'

import { ChevronLeftIcon } from '../../../../icons/ChevronLeftIcon'
import { colors } from '../../../../design/theme/colors'

type Props = {
  onPress: () => void
}

export function BackButton({ onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ hovered }) => [styles.button, hovered ? styles.buttonHovered : undefined]}>
      {/* Back */}
      <ChevronLeftIcon color={colors.textStrong} size={22} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonHovered: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
})



