import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { Text } from './Text'
import { colors } from '../design/theme/colors'
import { HomeIcon } from '../icons/HomeIcon'

type Props = {
  message: string
  onGoHome: () => void
}

export function EmptyPageMessage({ message, onGoHome }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={onGoHome} style={({ hovered }) => [styles.homeButton, hovered ? styles.homeButtonHovered : undefined]}>
        <HomeIcon color={colors.selected} size={20} />
        <Text isBold style={styles.homeButtonText}>
          Naar home
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    padding: 24,
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    textAlign: 'center',
  },
  homeButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.selected,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  homeButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  homeButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.selected,
  },
})

