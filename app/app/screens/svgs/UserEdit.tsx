import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function UserEdit({ color = colors.textPrimary, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M11.265 2.25751C10.635 1.77751 9.855 1.5 9 1.5C6.93 1.5 5.25 3.18 5.25 5.25C5.25 7.32 6.93 9 9 9C11.07 9 12.75 7.32 12.75 5.25" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14.4073 11.805L11.7523 14.46C11.6473 14.565 11.5498 14.76 11.5273 14.9025L11.3848 15.915C11.3323 16.2825 11.5873 16.5375 11.9548 16.485L12.9673 16.3425C13.1098 16.32 13.3123 16.2225 13.4098 16.1175L16.0648 13.4625C16.5223 13.005 16.7398 12.4725 16.0648 11.7975C15.3973 11.13 14.8648 11.3475 14.4073 11.805Z" stroke={color} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14.0249 12.1875C14.2499 12.9975 14.8799 13.6275 15.6899 13.8525" stroke={color} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2.55762 16.5C2.55762 13.5975 5.44514 11.25 9.00014 11.25C9.78014 11.25 10.5301 11.3625 11.2276 11.5725" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
