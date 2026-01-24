import React from "react"
import { Pressable, PressableProps, StyleSheet, View } from "react-native"
import { colors } from "./constants"

type Props = Omit<PressableProps, "children"> & {
  children: React.ReactNode | ((params: { pressed: boolean }) => React.ReactNode)
}

export function OverlayPressable({ style, children, disabled, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={(params) => {
        const base = typeof style === "function" ? style(params) : style
        return [base, styles.base]
      }}
    >
      {(params) => (
        <>
          {params.pressed && !disabled ? <View pointerEvents="none" style={styles.overlay} /> : null}
          {typeof children === "function" ? children(params) : children}
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: { position: "relative", overflow: "hidden" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.pressedOverlay },
})

