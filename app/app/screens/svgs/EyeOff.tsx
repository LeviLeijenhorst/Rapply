import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function EyeOff({ color = colors.textPrimary, size = 24, opacity = 0.5 }: { color?: string; size?: number; opacity?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14.5299 9.47001L9.46992 14.53C8.81992 13.88 8.41992 12.99 8.41992 12C8.41992 10.02 10.0199 8.42001 11.9999 8.42001C12.9899 8.42001 13.8799 8.82001 14.5299 9.47001Z" stroke={color} strokeOpacity={opacity} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M5.59984 17.76C4.59984 16.9 3.68984 15.84 2.88984 14.59C1.98984 13.18 1.98984 10.81 2.88984 9.4C4.06984 7.55 5.50984 6.1 7.11984 5.13" stroke={color} strokeOpacity={opacity} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M17.82 5.77001C16.07 4.45001 14.07 3.73001 12 3.73001" stroke={color} strokeOpacity={opacity} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M8.41992 19.53C9.55992 20.01 10.7699 20.27 11.9999 20.27C15.5299 20.27 18.8199 18.19 21.1099 14.59C22.0099 13.18 22.0099 10.81 21.1099 9.39999C20.7799 8.87999 20.4199 8.38999 20.0499 7.92999" stroke={color} strokeOpacity={opacity} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M15.5099 12.7C15.2499 14.11 14.0999 15.26 12.6899 15.52" stroke={color} strokeOpacity={opacity} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M9.47 14.53L2 22" stroke={color} strokeOpacity={opacity} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M21.9998 2L14.5298 9.47" stroke={color} strokeOpacity={opacity} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}











