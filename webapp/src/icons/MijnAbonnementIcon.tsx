import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  color?: string
  size?: number
}

export function MijnAbonnementIcon({ color = '#656565', size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M12.525 14.2345H5.475C5.16 14.2345 4.8075 13.987 4.7025 13.687L1.5975 5.00203C1.155 3.75703 1.6725 3.37453 2.7375 4.13953L5.6625 6.23203C6.15 6.56953 6.705 6.39703 6.915 5.84953L8.235 2.33203C8.655 1.20703 9.3525 1.20703 9.7725 2.33203L11.0925 5.84953C11.3025 6.39703 11.8575 6.56953 12.3375 6.23203L15.0825 4.27453C16.2525 3.43453 16.815 3.86203 16.335 5.21953L13.305 13.702C13.1925 13.987 12.84 14.2345 12.525 14.2345Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4.875 16.5H13.125" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7.125 10.5H10.875" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

