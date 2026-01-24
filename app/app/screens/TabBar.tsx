import React from "react"
import { View, Pressable, StyleSheet } from "react-native"
import { colors, safeAreaBottom, spacing, vibrate } from "./constants"
import { Icon } from "./Icon"

export type BottomTab = "coachees" | "settings"

export function TabBar({
  active,
  onChange,
}: {
  active: BottomTab
  onChange: (t: BottomTab) => void
}) {
  return (
    <View style={styles.bar}>
      {/* LEFT HALF */}
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          vibrate()
          onChange("coachees")
        }}
        style={styles.half}
      >
        {({ pressed }) => (
          <>
            {pressed && <View style={styles.pressOverlay} />}
            <Icon
              name="people"
              color={active === "coachees" ? colors.orange : colors.textPrimary}
            />
          </>
        )}
      </Pressable>

      {/* RIGHT HALF */}
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          vibrate()
          onChange("settings")
        }}
        style={styles.half}
      >
        {({ pressed }) => (
          <>
            {pressed && <View style={styles.pressOverlay} />}
            <Icon
              name="settings"
              color={active === "settings" ? colors.orange : colors.textPrimary}
            />
          </>
        )}
      </Pressable>
    </View>
  )
}

const BAR_HEIGHT = 72

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.white,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: BAR_HEIGHT + safeAreaBottom,
    flexDirection: "row",
  },

  half: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: safeAreaBottom,
    paddingTop: spacing.small,
    overflow: "hidden",
  },

  pressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.pressedOverlay,
  },
})
