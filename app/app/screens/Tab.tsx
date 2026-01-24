import React from "react"
import { StyleSheet } from "react-native"
import { Text } from "./Text"
import { colors, radius, spacing, vibrate, typography } from "./constants"
import { OverlayPressable } from "./OverlayPressable"

export function Tab({
  label,
  active,
  onPress,
  disabled = false,
}: {
  label: string
  active: boolean
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <OverlayPressable
      onPress={() => {
        if (disabled) return
        vibrate()
        onPress()
      }}
      style={[
        styles.base,
        active ? styles.active : styles.inactive,
        disabled ? { opacity: 0.5 } : null,
      ]}
      disabled={disabled}
    >
      <Text style={[styles.text, active ? { color: colors.white } : { color: colors.textSecondary }]}>{label}</Text>
    </OverlayPressable>
  )
}
const styles = StyleSheet.create({
  base: {
    height: 44,
    paddingVertical: 0,
    paddingHorizontal: 14,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: "transparent",
    justifyContent: "center",
  },
  active: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  inactive: {
    backgroundColor: colors.backgroundLight,
    borderColor: colors.searchBar,
  },
  text: {
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    lineHeight: typography.textSize + 6,
  },
})
