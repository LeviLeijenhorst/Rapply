import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function AddAudio({ color = colors.textPrimary, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M1.5 9.73499V11.25C1.5 15 3 16.5 6.75 16.5H8.25" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.5 7.5V6.75C16.5 3 15 1.5 11.25 1.5H6.75C3 1.5 1.5 3 1.5 6.75" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11.4526 16.5C12.049 16.5 12.5326 16.0164 12.5326 15.42C12.5326 14.8235 12.049 14.34 11.4526 14.34C10.8561 14.34 10.3726 14.8235 10.3726 15.42C10.3726 16.0164 10.8561 16.5 11.4526 16.5Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.4999 14.7V10.47C16.4999 9.57002 15.9374 9.44249 15.3599 9.59999L13.1924 10.1925C12.8024 10.2975 12.5249 10.6125 12.5249 11.0625V11.82V12.33V15.4275" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15.4198 15.78C16.0163 15.78 16.4998 15.2965 16.4998 14.7C16.4998 14.1035 16.0163 13.62 15.4198 13.62C14.8234 13.62 14.3398 14.1035 14.3398 14.7C14.3398 15.2965 14.8234 15.78 15.4198 15.78Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12.5327 12.3224L16.5002 11.2424" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
