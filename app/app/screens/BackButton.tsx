import React from "react"
import { Pressable, View, StyleSheet } from "react-native"
import { Icon } from "./Icon"
import { colors } from "./constants"

type Props = {
  onPress: () => void
  accessibilityLabel?: string
}

export default function BackButton({ onPress, accessibilityLabel }: Props) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={styles.button}>
      {({ pressed }) => (
        <>
          {pressed && <View style={styles.pressOverlay} />}
          <View style={styles.iconWrap}>
            <Icon name="back" size={28} />
          </View>
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { width: 66, height: 66, alignItems: "center", justifyContent: "center", overflow: "hidden", margin: 0 },
  pressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.pressedOverlay,
  },
  iconWrap: { alignItems: "center", justifyContent: "center" },
})

