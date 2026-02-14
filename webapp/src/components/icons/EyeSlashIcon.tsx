import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  color: string
  size?: number
}

export function EyeSlashIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.11 14.59C18.82 18.19 15.53 20.27 12 20.27C8.47 20.27 5.18 18.19 2.89 14.59C1.99 13.18 1.99 10.81 2.89 9.4C5.18 5.8 8.47 3.72 12 3.72C15.53 3.72 18.82 5.8 21.11 9.4C22.01 10.81 22.01 13.18 21.11 14.59Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3 3L21 21" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  )
}
