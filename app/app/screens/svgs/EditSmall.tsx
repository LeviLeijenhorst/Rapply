import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function EditSmall({ color = colors.textPrimary, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M13.0275 7.62744L14.0325 6.56244C15.0975 5.43744 15.5775 4.15495 13.92 2.58745C12.2625 1.02745 11.01 1.57495 9.94501 2.69995L3.78751 9.21744C3.55501 9.46494 3.33001 9.95245 3.28501 10.2899L3.00751 12.7199C2.91001 13.5974 3.54001 14.1974 4.41001 14.0474L6.82501 13.6349C7.16251 13.5749 7.63501 13.3274 7.86751 13.0724L10.83 9.93744" stroke={color} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8.91748 3.78748C9.23998 5.85748 10.92 7.43998 13.005 7.64998" stroke={color} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2.25 16.5H10.5" stroke={color} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.5 16.5H15.75" stroke={color} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
