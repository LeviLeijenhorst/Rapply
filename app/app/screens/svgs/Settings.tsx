import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function Settings({ color = colors.textPrimary, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9C10.34 9 9 10.34 9 12C9 12.41 9.08 12.81 9.24 13.17" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M3.42018 6.88L2.79018 7.97C2.32018 8.76 2.60017 9.78 3.39017 10.25L3.58018 10.36C5.15018 11.26 5.15018 12.74 3.58018 13.65L3.39017 13.76C2.60017 14.23 2.32018 15.25 2.79018 16.04L3.78018 17.77C4.30018 18.68 5.47018 18.99 6.37018 18.47C7.94018 17.56 9.22018 18.3 9.22018 20.11C9.22018 21.15 10.0702 22.01 11.1202 22.01H12.8802C13.9202 22.01 14.7802 21.16 14.7802 20.11C14.7802 19.1 15.1802 18.42 15.8102 18.18C16.3002 17.99 16.9402 18.07 17.6302 18.47C18.5402 18.99 19.7002 18.68 20.2202 17.77L20.6802 16.96" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M20.4201 13.64C18.8501 12.74 18.8501 11.26 20.4201 10.35L20.6101 10.24C21.4001 9.78 21.6801 8.76 21.2101 7.97L20.2201 6.24C19.7001 5.33 18.5301 5.02 17.6201 5.54C16.0601 6.45 14.7801 5.71 14.7801 3.9C14.7801 2.86 13.9301 2 12.8801 2H11.1201C10.0801 2 9.22006 2.85 9.22006 3.9C9.22006 5.71 7.94006 6.45 6.37006 5.54" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}
