import React, { useMemo, useRef } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { Text } from '../../components/Text'
import { colors } from '../../theme/colors'

type Props = {
  value: string
  onChangeValue: (value: string) => void
  length: number
}

export function AuthCodeEntry({ value, onChangeValue, length }: Props) {
  const inputRef = useRef<TextInput | null>(null)
  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

  const digits = useMemo(() => {
    const sanitized = value.replace(/\D/g, '').slice(0, length)
    const result = Array.from({ length }).map((_, index) => sanitized[index] ?? null)
    return result
  }, [length, value])

  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={styles.container}>
      {/* Hidden code input */}
      <TextInput
        ref={(value) => {
          inputRef.current = value
        }}
        value={value}
        onChangeText={(text) => onChangeValue(text.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        autoFocus
        style={[styles.hiddenInput, inputWebStyle]}
      />

      {/* Code boxes */}
      <View style={styles.boxRow}>
        {digits.map((digit, index) => (
          <View key={index} style={styles.box}>
            <Text isBold style={styles.digitText}>
              {digit ?? '-'}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  boxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    flexWrap: 'wrap',
  },
  box: {
    width: 76,
    height: 76,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  digitText: {
    fontSize: 48,
    lineHeight: 52,
    color: colors.selected,
  },
})

