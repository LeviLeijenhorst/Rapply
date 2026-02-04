import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  color: string
  size?: number
}

export function EditActionIcon({ color, size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M13.0275 7.62751L14.0325 6.56251C15.0975 5.43751 15.5775 4.15501 13.92 2.58751C12.2625 1.02751 11.01 1.57501 9.94501 2.70001L3.78751 9.21751C3.55501 9.46501 3.33001 9.95251 3.28501 10.29L3.00751 12.72C2.91001 13.5975 3.54001 14.1975 4.41001 14.0475L6.82501 13.635C7.16251 13.575 7.63501 13.3275 7.86751 13.0725L10.83 9.93751"
        stroke={color}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.91748 3.78751C9.23998 5.85751 10.92 7.44001 13.005 7.65001"
        stroke={color}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M2.25 16.5H10.5" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.5 16.5H15.75" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

