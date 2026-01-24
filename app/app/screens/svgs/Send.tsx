import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function Send({ color = colors.white, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18.0703 8.50989C21.9103 10.4299 21.9103 13.5699 18.0703 15.4899L9.51026 19.7699C3.75026 22.6499 1.40026 20.2899 4.28026 14.5399L5.15026 12.8099C5.37026 12.3699 5.37026 11.6399 5.15026 11.1999L4.28026 9.45989C1.40026 3.70989 3.76026 1.34989 9.51026 4.22989L14.0203 6.48989" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M5.44043 12H10.8404" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}
