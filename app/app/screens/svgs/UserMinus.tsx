import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function UserMinus({ color = "#FF0001", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M11.265 2.25751C10.635 1.77751 9.855 1.5 9 1.5C6.93 1.5 5.25 3.18 5.25 5.25C5.25 7.32 6.93 9 9 9C11.07 9 12.75 7.32 12.75 5.25" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2.55762 16.5C2.55762 13.5975 5.44514 11.25 9.00014 11.25C9.72014 11.25 10.4176 11.3475 11.0701 11.5275" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.5 13.5C16.5 13.74 16.47 13.9725 16.41 14.1975C16.3425 14.4975 16.2225 14.79 16.065 15.045C15.5475 15.915 14.595 16.5 13.5 16.5C12.7275 16.5 12.03 16.2075 11.505 15.7275C11.28 15.5325 11.085 15.3 10.935 15.045C10.6575 14.595 10.5 14.0625 10.5 13.5C10.5 12.69 10.8225 11.9475 11.3475 11.4075C11.895 10.845 12.66 10.5 13.5 10.5C14.385 10.5 15.1875 10.8825 15.7275 11.4975C16.2075 12.03 16.5 12.735 16.5 13.5Z" stroke={color} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14.6173 13.4849H12.3823" stroke={color} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
