import React from "react"
import { Pressable, View, StyleSheet } from "react-native"
import { Icon } from "./Icon"

type Props = {
  onPress: () => void
  accessibilityLabel?: string
}

export default function BackButton({ onPress, accessibilityLabel }: Props) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <View style={styles.iconWrap}>
        <Icon name="back" size={28} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.8 },
  iconWrap: { alignItems: "center", justifyContent: "center" },
})

