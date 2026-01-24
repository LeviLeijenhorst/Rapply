import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function Plus({ color = colors.textPrimary, size = 28 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M14 26C20.6274 26 26 20.6274 26 14C26 7.37258 20.6274 2 14 2C7.37258 2 2 7.37258 2 14C2 20.6274 7.37258 26 14 26Z" fill={color} />
      <Path d="M14 9V19M9 14H19" stroke="#FEFEFE" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}
