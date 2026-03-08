import React from 'react'
import { Pressable, StyleSheet } from 'react-native'

type Props = {
  onPress: () => void
  children: (params: { hovered: boolean }) => React.ReactNode
}

export function AuthIconButton({ onPress, children }: Props) {
  return (
    <Pressable onPress={onPress} style={({ hovered }) => [styles.button, hovered ? styles.buttonHovered : undefined]}>
      {({ hovered }) => <>{children({ hovered: Boolean(hovered) })}</>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonHovered: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
})

