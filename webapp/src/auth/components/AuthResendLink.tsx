import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { RotateLeftIcon } from '../../components/icons/RotateLeftIcon'
import { Text } from '../../components/Text'
import { colors } from '../../theme/colors'

type Props = {
  label: string
  onPress: () => void
}

export function AuthResendLink({ label, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ hovered }) => [styles.container, hovered ? styles.containerHovered : undefined]}>
      {({ hovered }) => (
        <>
          {/* Resend */}
          <View style={styles.content}>
            <Text isSemibold style={[styles.text, { color: hovered ? colors.selected : colors.textStrong }]}>
              {label}
            </Text>
            <RotateLeftIcon color={hovered ? colors.selected : colors.textStrong} size={18} />
          </View>
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 8,
  },
  containerHovered: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
    textDecorationLine: 'underline',
  },
})

