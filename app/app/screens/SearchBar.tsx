import React from "react"
import { View, TextInput, StyleSheet } from "react-native"
import { colors, radius, spacing, typography } from "./constants"
import { Icon } from "./Icon"

export function SearchBar({ value, onChangeText, placeholder }: { value: string; onChangeText: (t: string) => void; placeholder: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}><Icon name="search" /></View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.searchBar,
    borderRadius: radius,
    paddingHorizontal: spacing.small,
    height: 44,
  },
  icon: { marginRight: spacing.small },
  input: {
    flex: 1,
    height: 44,
    paddingVertical: 0,
    textAlignVertical: "center",
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    lineHeight: typography.textSize + 6,
    color: colors.textPrimary,
  },
})
