import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { Text } from '../../components/Text'

type Option = {
  label: string
  isActive: boolean
  onPress: () => void
}

type Props = {
  leftOption: Option
  rightOption: Option
  defaultColor: string
  hoveredColor: string
}

export function AuthTopRouteToggle({ leftOption, rightOption, defaultColor, hoveredColor }: Props) {
  return (
    <View style={styles.container}>
      {/* Left option */}
      <Pressable onPress={leftOption.onPress} style={styles.optionButton}>
        {({ hovered }) => (
          <>
            <Text
              isBold={leftOption.isActive}
              isSemibold={!leftOption.isActive}
              style={[
                styles.optionText,
                {
                  color: hovered && !leftOption.isActive ? hoveredColor : defaultColor,
                  textDecorationLine: leftOption.isActive ? 'underline' : 'none',
                },
              ]}
            >
              {leftOption.label}
            </Text>
          </>
        )}
      </Pressable>

      {/* Right option */}
      <Pressable onPress={rightOption.onPress} style={styles.optionButton}>
        {({ hovered }) => (
          <>
            <Text
              isBold={rightOption.isActive}
              isSemibold={!rightOption.isActive}
              style={[
                styles.optionText,
                {
                  color: hovered && !rightOption.isActive ? hoveredColor : defaultColor,
                  textDecorationLine: rightOption.isActive ? 'underline' : 'none',
                },
              ]}
            >
              {rightOption.label}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  optionButton: {
    borderRadius: 8,
    padding: 8,
  },
  optionText: {
    fontSize: 14,
    lineHeight: 18,
  },
})

