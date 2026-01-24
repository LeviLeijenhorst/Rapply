import React, { ReactNode, useRef } from "react"
import { View, StyleSheet, Pressable } from "react-native"
import { Text } from "./Text"
import { colors, radius, spacing, typography } from "./constants"
import { Icon, IconName } from "./Icon"

export function ListItem({
  title,
  subtitle,
  iconName,
  onPress,
  onLongPress,
  selected,
  rightAccessory,
}: {
  title: string
  subtitle?: string
  iconName?: IconName
  onPress?: () => void
  onLongPress?: () => void
  selected?: boolean
  rightAccessory?: ReactNode
}) {
  const longPressedRef = useRef(false)
  function renderContent({ pressed }: { pressed: boolean }) {
    return (
      <View style={[styles.card, pressed && styles.cardPressed, selected && styles.cardSelected]}>
        {pressed ? <View style={styles.pressOverlay} /> : null}

        <View style={styles.row}>
          {/* Left icon */}
          {iconName ? (
            <View style={styles.iconWrapper}>
              <Icon name={iconName} />
            </View>
          ) : null}

          {/* Title + subtitle */}
          <View style={styles.textWrapper}>
            <Text style={styles.title} numberOfLines={subtitle ? 1 : 2}>
              {title}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          {/* Right accessory */}
          {rightAccessory ? <View style={styles.rightAccessory}>{rightAccessory}</View> : null}
        </View>
      </View>
    )
  }

  if (!onPress && !onLongPress) return renderContent({ pressed: false })
  return (
    <Pressable
      onPress={() => {
        if (longPressedRef.current) {
          longPressedRef.current = false
          return
        }
        onPress?.()
      }}
      onLongPress={() => {
        longPressedRef.current = true
        onLongPress?.()
        setTimeout(() => {
          longPressedRef.current = false
        }, 0)
      }}
      style={styles.pressable}
    >
      {({ pressed }) => renderContent({ pressed })}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    marginBottom: spacing.small,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius,
    paddingHorizontal: spacing.big,
    paddingVertical: spacing.big,
    minHeight: 78,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.pressedOverlay,
  },
  iconWrapper: { marginRight: spacing.big },
  textWrapper: { flex: 1, justifyContent: "center" },
  title: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },
  subtitle: { marginTop: 4, fontFamily: typography.fontFamily, fontSize: 14, color: colors.textSecondary },
  rightAccessory: {
    paddingLeft: spacing.big,
  },
  cardPressed: {
    borderColor: colors.pressedOverlay,
  },
  cardSelected: {
    borderColor: colors.orange,
  },
})
