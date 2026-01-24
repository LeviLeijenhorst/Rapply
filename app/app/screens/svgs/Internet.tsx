import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function Internet({ color = colors.textPrimary, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M7.54004 12C7.54004 15.04 8.03004 18.08 9.00004 21H8.00004" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M8.00039 3H9.00039C8.51039 4.46 8.15039 5.95 7.90039 7.46" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M16.13 16.3601C15.88 17.9201 15.51 19.4801 15 21.0001" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M15 3C15.97 5.92 16.46 8.96 16.46 12" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M3 16V15C8.84 16.95 15.16 16.95 21 15V16" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M3 9.0001C8.84 7.0501 15.16 7.0501 21 9.0001" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}
