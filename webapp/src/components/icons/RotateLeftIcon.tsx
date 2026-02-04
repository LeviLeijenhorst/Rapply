import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  color: string
  size?: number
}

export function RotateLeftIcon({ color, size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M6.83256 3.81005C7.48506 3.61505 8.20506 3.48755 9.00006 3.48755C12.5926 3.48755 15.5026 6.39755 15.5026 9.99005C15.5026 13.5825 12.5926 16.4925 9.00006 16.4925C5.40756 16.4925 2.49756 13.5825 2.49756 9.99005C2.49756 8.65505 2.90256 7.41005 3.59256 6.37505"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M5.90247 3.99L8.06997 1.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5.90247 3.98999L8.42997 5.83499" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

