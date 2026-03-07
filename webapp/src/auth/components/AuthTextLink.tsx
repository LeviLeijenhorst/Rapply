import React from 'react'
import { Pressable, StyleSheet } from 'react-native'

import { Text } from '../../ui/Text'

type Props = {
  label: string
  defaultColor: string
  hoveredColor: string
  onPress: () => void
  align?: 'left' | 'center' | 'right'
}

export function AuthTextLink({ label, defaultColor, hoveredColor, onPress, align = 'left' }: Props) {
  return (
    <Pressable onPress={onPress} style={align === 'right' ? styles.alignRight : align === 'center' ? styles.alignCenter : styles.alignLeft}>
      {({ hovered }) => (
        <>
          {/* Link */}
          <Text isSemibold style={[styles.text, { color: hovered ? hoveredColor : defaultColor }]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  alignLeft: {
    alignSelf: 'flex-start',
  },
  alignCenter: {
    alignSelf: 'center',
  },
  alignRight: {
    alignSelf: 'flex-end',
  },
  text: {
    fontSize: 14,
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
})


