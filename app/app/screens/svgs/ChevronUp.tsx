import React from "react"
import Svg, { Path, G } from "react-native-svg"
import { colors } from "../constants"

export default function ChevronUp({ color = colors.textSecondary, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G transform="rotate(180 12 12)">
        <Path
          d="M19.9201 9.00003L13.4001 15.52C12.6301 16.29 11.3701 16.29 10.6001 15.52L4.08008 9.00003"
          stroke={color}
          strokeWidth={1.5}
          strokeMiterlimit={10}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  )
}
