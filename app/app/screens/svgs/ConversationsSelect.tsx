import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function ConversationsSelect({ color = colors.textPrimary, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M2.25 5.25H15.75" stroke={color} strokeLinecap="round" />
      <Path d="M7.11768 9H15.7502" stroke={color} strokeLinecap="round" />
      <Path d="M2.25 9H4.4925" stroke={color} strokeLinecap="round" />
      <Path d="M2.25 12.75H15.75" stroke={color} strokeLinecap="round" />
    </Svg>
  )
}
